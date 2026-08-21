"""Saved trip ideas and wishlist management."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.customer import WishlistItem
from app.schemas.customer import WishlistCreate, WishlistOut
from app.schemas.common import Msg
from app.utils.exceptions import not_found, forbidden, conflict

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])


@router.get("", response_model=list[WishlistOut])
def get_my_wishlist(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(WishlistItem).filter(WishlistItem.user_id == current_user.id).order_by(WishlistItem.created_at.desc()).all()


@router.post("", response_model=WishlistOut, status_code=201)
def add_to_wishlist(payload: WishlistCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(WishlistItem).filter(
        WishlistItem.user_id == current_user.id,
        WishlistItem.item_type == payload.item_type,
        WishlistItem.item_id == payload.item_id,
    ).first()
    if existing:
        raise conflict("This item is already in your wishlist")
    item = WishlistItem(user_id=current_user.id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", response_model=Msg)
def remove_from_wishlist(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.get(WishlistItem, item_id)
    if not item:
        raise not_found("Wishlist item")
    if item.user_id != current_user.id:
        raise forbidden()
    db.delete(item)
    db.commit()
    return Msg(message="Removed from wishlist")
