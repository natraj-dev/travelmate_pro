"""Travel activities and booking catalog."""
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.travel import Activity
from app.models.booking import ActivityBooking
from app.models.enums import BookingStatus, UserRole, NotificationType
from app.schemas.travel import ActivityCreate, ActivityOut
from app.schemas.booking import ActivityBookingCreate, ActivityBookingOut
from app.schemas.hotel import BookingCancelRequest
from app.services.notification_service import notify
from app.utils.exceptions import not_found, forbidden, bad_request
from app.utils.reference import generate_reference
from app.utils.pagination import paginate, Page

router = APIRouter(prefix="/activities", tags=["Activity Booking"])


@router.get("", response_model=Page[ActivityOut])
def search_activities(destination_id: Optional[int] = None, category: Optional[str] = None,
                       max_price: Optional[float] = None, page: int = 1, page_size: int = 20,
                       db: Session = Depends(get_db)):
    query = db.query(Activity).filter(Activity.is_active == True)
    if destination_id:
        query = query.filter(Activity.destination_id == destination_id)
    if category:
        query = query.filter(Activity.category.ilike(f"%{category}%"))
    if max_price:
        query = query.filter(Activity.price <= max_price)
    query = query.order_by(Activity.rating_avg.desc())
    items, total, page, page_size, total_pages = paginate(query, page, page_size)
    return Page(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/{activity_id}", response_model=ActivityOut)
def get_activity(activity_id: int, db: Session = Depends(get_db)):
    activity = db.get(Activity, activity_id)
    if not activity:
        raise not_found("Activity")
    return activity


@router.post("", response_model=ActivityOut, status_code=201)
def create_activity(payload: ActivityCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    activity = Activity(**payload.model_dump())
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


@router.post("/bookings", response_model=ActivityBookingOut, status_code=201)
def book_activity(payload: ActivityBookingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    activity = db.get(Activity, payload.activity_id)
    if not activity or not activity.is_active:
        raise not_found("Activity")
    total_amount = activity.price * payload.participants
    booking = ActivityBooking(
        booking_reference=generate_reference("ACT"),
        customer_id=current_user.id,
        activity_id=activity.id,
        activity_date=payload.activity_date,
        participants=payload.participants,
        price_per_person=activity.price,
        total_amount=total_amount,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.get("/bookings/mine", response_model=list[ActivityBookingOut])
def my_activity_bookings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(ActivityBooking).filter(ActivityBooking.customer_id == current_user.id).order_by(ActivityBooking.created_at.desc()).all()


@router.post("/bookings/{booking_id}/cancel", response_model=ActivityBookingOut)
def cancel_activity_booking(booking_id: int, payload: BookingCancelRequest, db: Session = Depends(get_db),
                             current_user: User = Depends(get_current_user)):
    booking = db.get(ActivityBooking, booking_id)
    if not booking:
        raise not_found("Booking")
    if booking.customer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise forbidden()
    if booking.status in (BookingStatus.CANCELLED, BookingStatus.COMPLETED):
        raise bad_request(f"Booking is already {booking.status.value.lower()}")
    booking.status = BookingStatus.CANCELLED
    booking.cancelled_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(booking)
    notify(db, booking.customer_id, NotificationType.BOOKING_CONFIRMATION, "Activity booking cancelled",
           f"Your activity booking {booking.booking_reference} has been cancelled.")
    return booking
