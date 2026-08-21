"""Hotel reservation flows and booking management."""
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.hotel import Hotel, Room, HotelBooking
from app.models.enums import BookingStatus, UserRole, VerificationStatus, NotificationType
from app.schemas.hotel import HotelBookingCreate, HotelBookingOut, BookingCancelRequest
from app.schemas.common import Msg
from app.config import settings
from app.services.coupon_service import validate_and_price_coupon, record_coupon_usage
from app.services.notification_service import notify
from app.utils.exceptions import not_found, forbidden, bad_request
from app.utils.reference import generate_reference
from app.utils.pagination import paginate, Page
from app.utils.audit import log_action

router = APIRouter(prefix="/hotel-bookings", tags=["Hotel Booking"])


def _availability_remaining(db: Session, room: Room, check_in: date, check_out: date) -> int:
    overlapping = (
        db.query(func.coalesce(func.sum(HotelBooking.rooms_booked), 0))
        .filter(
            HotelBooking.room_id == room.id,
            HotelBooking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
            HotelBooking.check_in_date < check_out,
            HotelBooking.check_out_date > check_in,
        )
        .scalar()
    )
    return room.available_units - overlapping


@router.post("", response_model=HotelBookingOut, status_code=201)
def create_hotel_booking(payload: HotelBookingCreate, db: Session = Depends(get_db),
                          current_user: User = Depends(get_current_user)):
    if payload.check_out_date <= payload.check_in_date:
        raise bad_request("Check-out date must be after check-in date")

    hotel = db.get(Hotel, payload.hotel_id)
    if not hotel or hotel.verification_status != VerificationStatus.APPROVED or not hotel.is_active:
        raise not_found("Hotel")

    room = db.get(Room, payload.room_id)
    if not room or room.hotel_id != hotel.id or not room.is_active:
        raise not_found("Room")

    remaining = _availability_remaining(db, room, payload.check_in_date, payload.check_out_date)
    if remaining < payload.rooms_booked:
        raise bad_request(f"Only {max(remaining, 0)} room(s) of this type are available for the selected dates")

    nights = (payload.check_out_date - payload.check_in_date).days
    subtotal = room.price_per_night * nights * payload.rooms_booked
    tax_amount = round(subtotal * (settings.DEFAULT_TAX_PERCENT / 100), 2)

    discount_amount = 0.0
    if payload.coupon_code:
        coupon, discount_amount, message = validate_and_price_coupon(db, payload.coupon_code, current_user.id, subtotal)
        if not coupon:
            raise bad_request(message)

    total_amount = round(subtotal + tax_amount - discount_amount, 2)

    booking = HotelBooking(
        booking_reference=generate_reference("HTL"),
        customer_id=current_user.id,
        hotel_id=hotel.id,
        room_id=room.id,
        check_in_date=payload.check_in_date,
        check_out_date=payload.check_out_date,
        nights=nights,
        rooms_booked=payload.rooms_booked,
        guests_adults=payload.guests_adults,
        guests_children=payload.guests_children,
        price_per_night=room.price_per_night,
        subtotal=subtotal,
        tax_amount=tax_amount,
        discount_amount=discount_amount,
        total_amount=total_amount,
        special_requests=payload.special_requests,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    if payload.coupon_code and discount_amount > 0:
        coupon, _, _ = validate_and_price_coupon(db, payload.coupon_code, current_user.id, subtotal)
        if coupon:
            record_coupon_usage(db, coupon, current_user.id, payment_id=None, discount_applied=discount_amount)
            db.commit()

    log_action(db, current_user.id, "HOTEL_BOOKING_CREATED", "HotelBooking", booking.id)
    return booking


@router.get("", response_model=Page[HotelBookingOut])
def list_hotel_bookings(status_filter: Optional[BookingStatus] = None, page: int = 1, page_size: int = 20,
                         db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(HotelBooking)
    if current_user.role == UserRole.CUSTOMER:
        query = query.filter(HotelBooking.customer_id == current_user.id)
    elif current_user.role == UserRole.HOTEL_MANAGER:
        managed_hotel_ids = [h.id for h in db.query(Hotel.id).filter(Hotel.manager_id == current_user.id)]
        query = query.filter(HotelBooking.hotel_id.in_(managed_hotel_ids))
    # ADMIN sees all
    if status_filter:
        query = query.filter(HotelBooking.status == status_filter)
    query = query.order_by(HotelBooking.created_at.desc())
    items, total, page, page_size, total_pages = paginate(query, page, page_size)
    return Page(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/{booking_id}", response_model=HotelBookingOut)
def get_hotel_booking(booking_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    booking = db.get(HotelBooking, booking_id)
    if not booking:
        raise not_found("Booking")
    hotel = db.get(Hotel, booking.hotel_id)
    if current_user.role == UserRole.CUSTOMER and booking.customer_id != current_user.id:
        raise forbidden()
    if current_user.role == UserRole.HOTEL_MANAGER and hotel.manager_id != current_user.id:
        raise forbidden()
    return booking


@router.post("/{booking_id}/cancel", response_model=HotelBookingOut)
def cancel_hotel_booking(booking_id: int, payload: BookingCancelRequest, db: Session = Depends(get_db),
                          current_user: User = Depends(get_current_user)):
    from datetime import datetime, timezone
    booking = db.get(HotelBooking, booking_id)
    if not booking:
        raise not_found("Booking")
    hotel = db.get(Hotel, booking.hotel_id)
    if current_user.role == UserRole.CUSTOMER and booking.customer_id != current_user.id:
        raise forbidden()
    if current_user.role == UserRole.HOTEL_MANAGER and hotel.manager_id != current_user.id:
        raise forbidden()
    if booking.status in (BookingStatus.CANCELLED, BookingStatus.COMPLETED):
        raise bad_request(f"Booking is already {booking.status.value.lower()}")

    booking.status = BookingStatus.CANCELLED
    booking.cancelled_at = datetime.now(timezone.utc)
    booking.cancellation_reason = payload.reason
    db.commit()
    db.refresh(booking)

    notify(db, booking.customer_id, NotificationType.BOOKING_CONFIRMATION, "Booking cancelled",
           f"Your hotel booking {booking.booking_reference} has been cancelled.")
    log_action(db, current_user.id, "HOTEL_BOOKING_CANCELLED", "HotelBooking", booking.id)
    return booking
