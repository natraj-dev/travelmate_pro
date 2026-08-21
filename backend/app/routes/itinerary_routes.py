"""Saved trip plans and itinerary management."""
from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.booking import Itinerary, ItineraryDay, ItineraryItem
from app.models.enums import UserRole
from app.schemas.booking import ItineraryCreate, ItineraryUpdate, ItineraryOut, ItineraryDayCreate, ItineraryItemCreate
from app.schemas.common import Msg
from app.services.export_service import export_pdf
from app.utils.exceptions import not_found, forbidden

router = APIRouter(prefix="/itineraries", tags=["Travel Itinerary"])


def _load(db: Session, itinerary_id: int) -> Itinerary:
    itinerary = (
        db.query(Itinerary)
        .options(joinedload(Itinerary.days).joinedload(ItineraryDay.items))
        .filter(Itinerary.id == itinerary_id)
        .first()
    )
    if not itinerary:
        raise not_found("Itinerary")
    return itinerary


def _check_access(itinerary: Itinerary, user: User) -> None:
    if itinerary.customer_id != user.id and itinerary.agent_id != user.id and user.role != UserRole.ADMIN and not itinerary.is_shared:
        raise forbidden()


@router.get("", response_model=list[ItineraryOut])
def list_my_itineraries(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(Itinerary)
        .options(joinedload(Itinerary.days).joinedload(ItineraryDay.items))
        .filter(Itinerary.customer_id == current_user.id)
        .order_by(Itinerary.created_at.desc())
        .all()
    )


@router.get("/{itinerary_id}", response_model=ItineraryOut)
def get_itinerary(itinerary_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    itinerary = _load(db, itinerary_id)
    _check_access(itinerary, current_user)
    return itinerary


@router.post("", response_model=ItineraryOut, status_code=201)
def create_itinerary(payload: ItineraryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = payload.model_dump()
    days_data = data.pop("days")
    itinerary = Itinerary(customer_id=current_user.id, **data)
    db.add(itinerary)
    db.flush()

    for day_data in days_data:
        items_data = day_data.pop("items")
        day = ItineraryDay(itinerary_id=itinerary.id, **day_data)
        db.add(day)
        db.flush()
        for item_data in items_data:
            db.add(ItineraryItem(day_id=day.id, **item_data))

    db.commit()
    return _load(db, itinerary.id)


@router.put("/{itinerary_id}", response_model=ItineraryOut)
def update_itinerary(itinerary_id: int, payload: ItineraryUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    itinerary = _load(db, itinerary_id)
    _check_access(itinerary, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(itinerary, field, value)
    db.commit()
    return _load(db, itinerary_id)


@router.post("/{itinerary_id}/days", response_model=ItineraryOut, status_code=201)
def add_day(itinerary_id: int, payload: ItineraryDayCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    itinerary = _load(db, itinerary_id)
    _check_access(itinerary, current_user)
    data = payload.model_dump()
    items_data = data.pop("items")
    day = ItineraryDay(itinerary_id=itinerary.id, **data)
    db.add(day)
    db.flush()
    for item_data in items_data:
        db.add(ItineraryItem(day_id=day.id, **item_data))
    db.commit()
    return _load(db, itinerary_id)


@router.post("/days/{day_id}/items", response_model=ItineraryOut, status_code=201)
def add_item(day_id: int, payload: ItineraryItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    day = db.get(ItineraryDay, day_id)
    if not day:
        raise not_found("Itinerary day")
    itinerary = _load(db, day.itinerary_id)
    _check_access(itinerary, current_user)
    db.add(ItineraryItem(day_id=day_id, **payload.model_dump()))
    db.commit()
    return _load(db, itinerary.id)


@router.delete("/items/{item_id}", response_model=Msg)
def delete_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.get(ItineraryItem, item_id)
    if not item:
        raise not_found("Itinerary item")
    day = db.get(ItineraryDay, item.day_id)
    itinerary = _load(db, day.itinerary_id)
    _check_access(itinerary, current_user)
    db.delete(item)
    db.commit()
    return Msg(message="Item removed")


@router.delete("/{itinerary_id}", response_model=Msg)
def delete_itinerary(itinerary_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    itinerary = _load(db, itinerary_id)
    if itinerary.customer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise forbidden()
    db.delete(itinerary)
    db.commit()
    return Msg(message="Itinerary deleted")


@router.get("/{itinerary_id}/download")
def download_itinerary(itinerary_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    itinerary = _load(db, itinerary_id)
    _check_access(itinerary, current_user)

    headers = ["Day", "Time", "Activity", "Location", "Notes", "Est. Cost"]
    rows = []
    for day in itinerary.days:
        for item in day.items:
            rows.append([f"Day {day.day_number}", item.time_slot or "-", item.title,
                         item.location or "-", item.notes or "-", item.estimated_cost or 0])

    path = export_pdf(f"Itinerary - {itinerary.title}", headers, rows)
    return FileResponse(path, filename=f"itinerary_{itinerary.id}.pdf", media_type="application/pdf")
