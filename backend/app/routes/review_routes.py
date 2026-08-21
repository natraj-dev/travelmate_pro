"""Reviews and rating collection for stays and trips."""
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.customer import Review, ReviewType
from app.models.hotel import Hotel
from app.models.tour import TourPackage
from app.schemas.customer import ReviewCreate, ReviewOut, ReviewResponseRequest
from app.schemas.common import Msg
from app.utils.exceptions import not_found, forbidden
from app.utils.pagination import paginate, Page

router = APIRouter(prefix="/reviews", tags=["Reviews & Ratings"])


def _recalculate_rating(db: Session, review_type: ReviewType, item_id: int) -> None:
    stats = db.query(func.avg(Review.rating), func.count(Review.id)).filter(
        Review.review_type == review_type, Review.item_id == item_id, Review.is_approved == True
    ).first()
    avg_rating, count = stats[0] or 0, stats[1] or 0

    if review_type == ReviewType.HOTEL:
        hotel = db.get(Hotel, item_id)
        if hotel:
            hotel.rating_avg = round(float(avg_rating), 2)
            hotel.review_count = count
    elif review_type == ReviewType.TOUR:
        package = db.get(TourPackage, item_id)
        if package:
            package.rating_avg = round(float(avg_rating), 2)
            package.review_count = count
    db.commit()


@router.get("", response_model=Page[ReviewOut])
def list_reviews(review_type: Optional[ReviewType] = None, item_id: Optional[int] = None,
                  page: int = 1, page_size: int = 20, db: Session = Depends(get_db)):
    query = db.query(Review).filter(Review.is_approved == True)
    if review_type:
        query = query.filter(Review.review_type == review_type)
    if item_id:
        query = query.filter(Review.item_id == item_id)
    query = query.order_by(Review.created_at.desc())
    items, total, page, page_size, total_pages = paginate(query, page, page_size)
    return Page(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.post("", response_model=ReviewOut, status_code=201)
def create_review(payload: ReviewCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    review = Review(user_id=current_user.id, **payload.model_dump())
    db.add(review)
    db.commit()
    db.refresh(review)
    _recalculate_rating(db, review.review_type, review.item_id)
    return review


@router.delete("/{review_id}", response_model=Msg)
def delete_review(review_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    review = db.get(Review, review_id)
    if not review:
        raise not_found("Review")
    if review.user_id != current_user.id and current_user.role.value != "ADMIN":
        raise forbidden()
    review_type, item_id = review.review_type, review.item_id
    db.delete(review)
    db.commit()
    _recalculate_rating(db, review_type, item_id)
    return Msg(message="Review deleted")


@router.put("/{review_id}/respond", response_model=ReviewOut)
def respond_to_review(review_id: int, payload: ReviewResponseRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    review = db.get(Review, review_id)
    if not review:
        raise not_found("Review")
    review.operator_response = payload.operator_response
    db.commit()
    db.refresh(review)
    return review


@router.put("/{review_id}/moderate", response_model=ReviewOut)
def moderate_review(review_id: int, is_approved: bool = True, is_flagged: bool = False,
                     db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    review = db.get(Review, review_id)
    if not review:
        raise not_found("Review")
    review.is_approved = is_approved
    review.is_flagged = is_flagged
    db.commit()
    db.refresh(review)
    _recalculate_rating(db, review.review_type, review.item_id)
    return review
