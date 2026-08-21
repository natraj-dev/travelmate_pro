"""Guide content and destination storytelling."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.user import User
from app.models.travel import TravelGuide
from app.models.enums import UserRole
from app.schemas.travel import TravelGuideCreate, TravelGuideOut
from app.schemas.common import Msg
from app.utils.exceptions import not_found, forbidden

router = APIRouter(prefix="/travel-guides", tags=["Travel Guides"])


@router.get("/destination/{destination_id}", response_model=list[TravelGuideOut])
def list_guides_for_destination(destination_id: int, db: Session = Depends(get_db)):
    return db.query(TravelGuide).filter(TravelGuide.destination_id == destination_id, TravelGuide.is_published == True).all()


@router.get("/{guide_id}", response_model=TravelGuideOut)
def get_guide(guide_id: int, db: Session = Depends(get_db)):
    guide = db.get(TravelGuide, guide_id)
    if not guide:
        raise not_found("Travel guide")
    return guide


@router.post("", response_model=TravelGuideOut, status_code=201)
def create_guide(payload: TravelGuideCreate, db: Session = Depends(get_db),
                  current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.TRAVEL_AGENT, UserRole.TOUR_OPERATOR))):
    guide = TravelGuide(author_id=current_user.id, **payload.model_dump())
    db.add(guide)
    db.commit()
    db.refresh(guide)
    return guide


@router.put("/{guide_id}", response_model=TravelGuideOut)
def update_guide(guide_id: int, payload: TravelGuideCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    guide = db.get(TravelGuide, guide_id)
    if not guide:
        raise not_found("Travel guide")
    if guide.author_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise forbidden()
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(guide, field, value)
    db.commit()
    db.refresh(guide)
    return guide


@router.delete("/{guide_id}", response_model=Msg)
def delete_guide(guide_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    guide = db.get(TravelGuide, guide_id)
    if not guide:
        raise not_found("Travel guide")
    if guide.author_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise forbidden()
    db.delete(guide)
    db.commit()
    return Msg(message="Travel guide deleted")
