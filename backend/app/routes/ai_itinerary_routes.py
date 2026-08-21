"""Trip draft generation and itinerary saving flows."""
import json
from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.ai import AIItinerary
from app.models.booking import Itinerary, ItineraryDay, ItineraryItem
from app.schemas.ai import AIItineraryRequest, AIItineraryResponse, AISaveItineraryRequest
from app.schemas.booking import ItineraryOut
from app.services.ai_service import generate_itinerary, AIServiceError
from app.config import settings
from app.utils.exceptions import not_found, forbidden, bad_request


router = APIRouter(prefix="/ai/itinerary", tags=["AI Itinerary Generator"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/generate", response_model=AIItineraryResponse)
@limiter.limit(settings.RATE_LIMIT_AI)
async def generate(request: Request, payload: AIItineraryRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        plan = await generate_itinerary(payload.destination, payload.duration_days, payload.budget,
                                        payload.interests, payload.travelers)
    except AIServiceError as exc:
        raise bad_request(str(exc))

    record = AIItinerary(
        user_id=current_user.id, destination_name=payload.destination, duration_days=payload.duration_days,
        budget=payload.budget, interests=payload.interests, generated_plan=json.dumps(
            plan),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return AIItineraryResponse(id=record.id, destination_name=record.destination_name,
                               duration_days=record.duration_days, budget=record.budget, plan=plan)


@router.get("/{ai_itinerary_id}", response_model=AIItineraryResponse)
def get_generated(ai_itinerary_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = db.get(AIItinerary, ai_itinerary_id)
    if not record:
        raise not_found("Generated itinerary")
    if record.user_id != current_user.id:
        raise forbidden()
    return AIItineraryResponse(id=record.id, destination_name=record.destination_name,
                               duration_days=record.duration_days, budget=record.budget,
                               plan=json.loads(record.generated_plan))


@router.post("/save", response_model=ItineraryOut, status_code=201)
def save_to_itinerary(
    payload: AISaveItineraryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.get(AIItinerary, payload.ai_itinerary_id)

    if not record:
        raise not_found("Generated itinerary")

    if record.user_id != current_user.id:
        raise forbidden()

    try:
        plan = json.loads(record.generated_plan)
    except (json.JSONDecodeError, TypeError):
        raise bad_request("Generated itinerary contains invalid JSON")

    itinerary = Itinerary(
        customer_id=current_user.id,
        title=payload.title
        or f"{record.destination_name} — {record.duration_days} days",
        budget=record.budget,
        is_ai_generated=True,
    )

    db.add(itinerary)
    db.flush()

    for day in plan.get("days", []):
        itinerary_day = ItineraryDay(
            itinerary_id=itinerary.id,
            day_number=day.get("day_number", 1),
            summary=day.get("theme"),
        )

        db.add(itinerary_day)
        db.flush()

        for idx, item in enumerate(day.get("items", [])):
            itinerary_item = ItineraryItem(
                day_id=itinerary_day.id,
                item_type="CUSTOM",
                title=item.get("title", "Activity"),
                time_slot=item.get("time_slot"),
                location=item.get("location"),
                notes=item.get("notes"),
                estimated_cost=item.get("estimated_cost"),
                sort_order=idx,
            )

            db.add(itinerary_item)

    record.saved_itinerary_id = itinerary.id

    db.commit()

    from app.routes.itinerary_routes import _load

    return _load(db, itinerary.id)
