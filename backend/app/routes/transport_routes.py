"""Transport catalog and airport transfer flows."""
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.travel import TransportOption, AirportTransfer
from app.models.booking import TransportBooking
from app.models.enums import TransportType, BookingStatus, NotificationType
from app.schemas.travel import TransportOptionCreate, TransportOptionOut, AirportTransferCreate, AirportTransferOut
from app.schemas.booking import TransportBookingCreate, TransportBookingOut
from app.schemas.hotel import BookingCancelRequest
from app.services.notification_service import notify
from app.utils.exceptions import not_found, forbidden, bad_request
from app.utils.reference import generate_reference

router = APIRouter(prefix="/transport", tags=["Transport & Airport Transfers"])


# ---- Transport catalogue ----
@router.get("/options", response_model=list[TransportOptionOut])
def search_transport(type: Optional[TransportType] = None, origin: Optional[str] = None,
                      destination_name: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(TransportOption).filter(TransportOption.is_active == True)
    if type:
        query = query.filter(TransportOption.type == type)
    if origin:
        query = query.filter(TransportOption.origin.ilike(f"%{origin}%"))
    if destination_name:
        query = query.filter(TransportOption.destination_name.ilike(f"%{destination_name}%"))
    return query.order_by(TransportOption.departure_time).all()


@router.post("/options", response_model=TransportOptionOut, status_code=201)
def create_transport_option(payload: TransportOptionCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    option = TransportOption(**payload.model_dump())
    db.add(option)
    db.commit()
    db.refresh(option)
    return option


@router.post("/bookings", response_model=TransportBookingOut, status_code=201)
def book_transport(payload: TransportBookingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    import json
    option = db.get(TransportOption, payload.transport_option_id)
    if not option or not option.is_active:
        raise not_found("Transport option")
    if option.seats_available < payload.seats_booked:
        raise bad_request(f"Only {option.seats_available} seat(s) available")

    total_amount = option.price * payload.seats_booked
    booking = TransportBooking(
        booking_reference=generate_reference("TRN"),
        customer_id=current_user.id,
        transport_option_id=option.id,
        seats_booked=payload.seats_booked,
        price_per_seat=option.price,
        total_amount=total_amount,
        passenger_details=json.dumps(payload.passenger_details) if payload.passenger_details else None,
    )
    option.seats_available -= payload.seats_booked
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.get("/bookings/mine", response_model=list[TransportBookingOut])
def my_transport_bookings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(TransportBooking).filter(TransportBooking.customer_id == current_user.id).order_by(TransportBooking.created_at.desc()).all()


@router.post("/bookings/{booking_id}/cancel", response_model=TransportBookingOut)
def cancel_transport_booking(booking_id: int, payload: BookingCancelRequest, db: Session = Depends(get_db),
                              current_user: User = Depends(get_current_user)):
    booking = db.get(TransportBooking, booking_id)
    if not booking:
        raise not_found("Booking")
    if booking.customer_id != current_user.id:
        raise forbidden()
    if booking.status in (BookingStatus.CANCELLED, BookingStatus.COMPLETED):
        raise bad_request(f"Booking is already {booking.status.value.lower()}")
    booking.status = BookingStatus.CANCELLED
    option = db.get(TransportOption, booking.transport_option_id)
    if option:
        option.seats_available += booking.seats_booked
    db.commit()
    db.refresh(booking)
    return booking


# ---- Airport Transfers ----
@router.post("/airport-transfers", response_model=AirportTransferOut, status_code=201)
def book_airport_transfer(payload: AirportTransferCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    base_price = 35.0 if payload.vehicle_type.lower() == "sedan" else 65.0
    transfer = AirportTransfer(
        customer_id=current_user.id, price=base_price,
        tracking_reference=generate_reference("XFR"), **payload.model_dump(),
    )
    db.add(transfer)
    db.commit()
    db.refresh(transfer)
    return transfer


@router.get("/airport-transfers/mine", response_model=list[AirportTransferOut])
def my_airport_transfers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(AirportTransfer).filter(AirportTransfer.customer_id == current_user.id).order_by(AirportTransfer.scheduled_time.desc()).all()


@router.put("/airport-transfers/{transfer_id}/status", response_model=AirportTransferOut)
def update_transfer_status(transfer_id: int, status: str, driver_name: Optional[str] = None,
                            driver_phone: Optional[str] = None, db: Session = Depends(get_db),
                            current_user: User = Depends(require_admin)):
    transfer = db.get(AirportTransfer, transfer_id)
    if not transfer:
        raise not_found("Airport transfer")
    transfer.status = status
    if driver_name:
        transfer.driver_name = driver_name
    if driver_phone:
        transfer.driver_phone = driver_phone
    db.commit()
    db.refresh(transfer)
    notify(db, transfer.customer_id, NotificationType.SYSTEM, "Airport transfer update",
           f"Your airport transfer is now {status}.")
    return transfer


@router.post("/airport-transfers/{transfer_id}/cancel", response_model=AirportTransferOut)
def cancel_transfer(transfer_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    transfer = db.get(AirportTransfer, transfer_id)
    if not transfer:
        raise not_found("Airport transfer")
    if transfer.customer_id != current_user.id:
        raise forbidden()
    transfer.status = "CANCELLED"
    db.commit()
    db.refresh(transfer)
    return transfer
