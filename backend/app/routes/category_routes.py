"""Destination categories and browsing filters."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.travel import DestinationCategory
from app.schemas.travel import DestinationCategoryCreate, DestinationCategoryOut
from app.schemas.common import Msg
from app.utils.exceptions import not_found

router = APIRouter(prefix="/destination-categories", tags=["Destination Categories"])


@router.get("", response_model=list[DestinationCategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.query(DestinationCategory).order_by(DestinationCategory.name).all()


@router.post("", response_model=DestinationCategoryOut, status_code=201)
def create_category(payload: DestinationCategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    category = DestinationCategory(**payload.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", response_model=Msg)
def delete_category(category_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    category = db.get(DestinationCategory, category_id)
    if not category:
        raise not_found("Category")
    db.delete(category)
    db.commit()
    return Msg(message="Category deleted")
