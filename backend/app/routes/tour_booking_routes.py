"""Tour reservations and booking administration."""
import json
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.tour import TourPackage, TourSchedule, TourBooking, TourOperator
from app.models.enums import BookingStatus, UserRole, NotificationType
from app.schemas.tour import TourBookingCreate, TourBookingOut
from app.schemas.hotel import BookingCancelRequest
from app.config import settings
from app.services.coupon_service import validate_and_price_coupon, record_coupon_usage
from app.services.notification_service import notify
from app.utils.exceptions import not_found, forbidden, bad_request
from app.utils.reference import generate_reference
from app.utils.pagination import paginate, Page
from app.utils.audit import log_action

router = APIRouter(prefix="/tour-bookings", tags=["Tour Booking"])


@router.post("", response_model=TourBookingOut, status_code=201)
def create_tour_booking(payload: TourBookingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    package = db.get(TourPackage, payload.package_id)
    if not package or not package.is_published:
        raise not_found("Tour package")

    schedule = db.get(TourSchedule, payload.schedule_id)
    if not schedule or schedule.package_id != package.id or not schedule.is_active:
        raise not_found("Tour schedule")

    if schedule.seats_available < payload.traveler_count:
        raise bad_request(f"Only {schedule.seats_available} seat(s) remaining on this departure")

    subtotal = package.price_per_person * payload.traveler_count
    tax_amount = round(subtotal * (settings.DEFAULT_TAX_PERCENT / 100), 2)

    discount_amount = 0.0
    coupon = None
    if payload.coupon_code:
        coupon, discount_amount, message = validate_and_price_coupon(db, payload.coupon_code, current_user.id, subtotal)
        if not coupon:
            raise bad_request(message)

    total_amount = round(subtotal + tax_amount - discount_amount, 2)

    booking = TourBooking(
        booking_reference=generate_reference("TUR"),
        customer_id=current_user.id,
        package_id=package.id,
        schedule_id=schedule.id,
        traveler_count=payload.traveler_count,
        price_per_person=package.price_per_person,
        subtotal=subtotal,
        tax_amount=tax_amount,
        discount_amount=discount_amount,
        total_amount=total_amount,
        traveler_details=json.dumps([t.model_dump() for t in payload.traveler_details]) if payload.traveler_details else None,
    )
    db.add(booking)
    schedule.seats_available -= payload.traveler_count
    db.commit()
    db.refresh(booking)

    if coupon:
        record_coupon_usage(db, coupon, current_user.id, payment_id=None, discount_applied=discount_amount)
        db.commit()

    log_action(db, current_user.id, "TOUR_BOOKING_CREATED", "TourBooking", booking.id)
    return booking


@router.get("", response_model=Page[TourBookingOut])
def list_tour_bookings(status_filter: Optional[BookingStatus] = None, page: int = 1, page_size: int = 20,
                        db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(TourBooking)
    if current_user.role == UserRole.CUSTOMER:
        query = query.filter(TourBooking.customer_id == current_user.id)
    elif current_user.role == UserRole.TOUR_OPERATOR:
        operator = db.query(TourOperator).filter(TourOperator.user_id == current_user.id).first()
        package_ids = [p.id for p in db.query(TourPackage.id).filter(TourPackage.operator_id == operator.id)] if operator else []
        query = query.filter(TourBooking.package_id.in_(package_ids))
    if status_filter:
        query = query.filter(TourBooking.status == status_filter)
    query = query.order_by(TourBooking.created_at.desc())
    items, total, page, page_size, total_pages = paginate(query, page, page_size)
    return Page(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/{booking_id}", response_model=TourBookingOut)
def get_tour_booking(booking_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    booking = db.get(TourBooking, booking_id)
    if not booking:
        raise not_found("Booking")
    if current_user.role == UserRole.CUSTOMER and booking.customer_id != current_user.id:
        raise forbidden()
    if current_user.role == UserRole.TOUR_OPERATOR:
        package = db.get(TourPackage, booking.package_id)
        operator = db.query(TourOperator).filter(TourOperator.user_id == current_user.id).first()
        if not operator or package.operator_id != operator.id:
            raise forbidden()
    return booking


@router.post("/{booking_id}/cancel", response_model=TourBookingOut)
def cancel_tour_booking(booking_id: int, payload: BookingCancelRequest, db: Session = Depends(get_db),
                         current_user: User = Depends(get_current_user)):
    booking = db.get(TourBooking, booking_id)
    if not booking:
        raise not_found("Booking")
    if current_user.role == UserRole.CUSTOMER and booking.customer_id != current_user.id:
        raise forbidden()
    if booking.status in (BookingStatus.CANCELLED, BookingStatus.COMPLETED):
        raise bad_request(f"Booking is already {booking.status.value.lower()}")

    booking.status = BookingStatus.CANCELLED
    booking.cancelled_at = datetime.now(timezone.utc)
    booking.cancellation_reason = payload.reason

    schedule = db.get(TourSchedule, booking.schedule_id)
    if schedule:
        schedule.seats_available += booking.traveler_count

    db.commit()
    db.refresh(booking)
    notify(db, booking.customer_id, NotificationType.BOOKING_CONFIRMATION, "Booking cancelled",
           f"Your tour booking {booking.booking_reference} has been cancelled.")
    log_action(db, current_user.id, "TOUR_BOOKING_CANCELLED", "TourBooking", booking.id)
    return booking
