"""Admin console for platform oversight and operations."""
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app.models.user import User
from app.models.hotel import HotelBooking
from app.models.tour import TourBooking
from app.models.payment import Payment
from app.models.enums import UserRole, BookingStatus, PaymentStatus
from app.schemas.auth import UserOut
from app.schemas.hotel import HotelBookingOut
from app.schemas.tour import TourBookingOut
from app.schemas.payment import PaymentOut
from app.schemas.common import Msg
from app.utils.exceptions import not_found, bad_request
from app.utils.pagination import paginate, Page
from app.utils.audit import log_action

router = APIRouter(prefix="/admin", tags=["Admin Management"])


@router.get("/users", response_model=Page[UserOut])
def list_users(role: Optional[UserRole] = None, q: Optional[str] = None, is_active: Optional[bool] = None,
                page: int = 1, page_size: int = 20, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if q:
        query = query.filter((User.email.ilike(f"%{q}%")) | (User.first_name.ilike(f"%{q}%")) | (User.last_name.ilike(f"%{q}%")))
    query = query.order_by(User.created_at.desc())
    items, total, page, page_size, total_pages = paginate(query, page, page_size)
    return Page(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    user = db.get(User, user_id)
    if not user:
        raise not_found("User")
    return user


@router.put("/users/{user_id}/deactivate", response_model=Msg)
def deactivate_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    user = db.get(User, user_id)
    if not user:
        raise not_found("User")
    if user.id == current_user.id:
        raise bad_request("You cannot deactivate your own account")
    user.is_active = False
    db.commit()
    log_action(db, current_user.id, "USER_DEACTIVATED", "User", user_id)
    return Msg(message="User account deactivated")


@router.put("/users/{user_id}/activate", response_model=Msg)
def activate_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    user = db.get(User, user_id)
    if not user:
        raise not_found("User")
    user.is_active = True
    db.commit()
    log_action(db, current_user.id, "USER_ACTIVATED", "User", user_id)
    return Msg(message="User account activated")


@router.get("/bookings/hotel", response_model=Page[HotelBookingOut])
def monitor_hotel_bookings(status_filter: Optional[BookingStatus] = None, page: int = 1, page_size: int = 20,
                             db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    query = db.query(HotelBooking)
    if status_filter:
        query = query.filter(HotelBooking.status == status_filter)
    query = query.order_by(HotelBooking.created_at.desc())
    items, total, page, page_size, total_pages = paginate(query, page, page_size)
    return Page(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/bookings/tour", response_model=Page[TourBookingOut])
def monitor_tour_bookings(status_filter: Optional[BookingStatus] = None, page: int = 1, page_size: int = 20,
                            db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    query = db.query(TourBooking)
    if status_filter:
        query = query.filter(TourBooking.status == status_filter)
    query = query.order_by(TourBooking.created_at.desc())
    items, total, page, page_size, total_pages = paginate(query, page, page_size)
    return Page(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/payments", response_model=Page[PaymentOut])
def monitor_payments(status_filter: Optional[PaymentStatus] = None, page: int = 1, page_size: int = 20,
                       db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    query = db.query(Payment)
    if status_filter:
        query = query.filter(Payment.status == status_filter)
    query = query.order_by(Payment.created_at.desc())
    items, total, page, page_size, total_pages = paginate(query, page, page_size)
    return Page(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)
