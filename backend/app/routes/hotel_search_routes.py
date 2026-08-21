"""Hotel search, filtering, and availability queries."""
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, or_, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.hotel import Hotel, Room, HotelBooking
from app.models.enums import VerificationStatus, BookingStatus
from app.schemas.hotel import HotelOut, RoomOut
from app.utils.pagination import paginate, Page

router = APIRouter(prefix="/hotels/search", tags=["Hotel Search"])


def _rooms_available(db: Session, hotel_id: int, check_in: date, check_out: date, guests: int) -> bool:
    rooms = db.query(Room).filter(Room.hotel_id == hotel_id, Room.is_active == True, Room.status == "ACTIVE")
    if guests:
        rooms = rooms.filter((Room.capacity_adults + Room.capacity_children) >= guests)
    for room in rooms.all():
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
        if room.available_units - overlapping > 0:
            return True
    return False


@router.get("", response_model=Page[HotelOut])
def search_hotels(
    city: Optional[str] = None,
    check_in: Optional[date] = Query(None),
    check_out: Optional[date] = Query(None),
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    star_rating: Optional[int] = None,
    guests: Optional[int] = None,
    amenity: Optional[str] = None,
    page: int = 1, page_size: int = 20,
    db: Session = Depends(get_db),
):
    query = db.query(Hotel).filter(Hotel.is_active == True, Hotel.verification_status == VerificationStatus.APPROVED)
    if city:
        query = query.filter(Hotel.city.ilike(f"%{city}%"))
    if min_rating:
        query = query.filter(Hotel.rating_avg >= min_rating)
    if star_rating:
        query = query.filter(Hotel.star_rating == star_rating)
    if amenity:
        query = query.filter(Hotel.amenities.ilike(f"%{amenity}%"))

    if min_price or max_price:
        hotel_ids_with_price = db.query(Room.hotel_id).filter(Room.is_active == True)
        if min_price:
            hotel_ids_with_price = hotel_ids_with_price.filter(Room.price_per_night >= min_price)
        if max_price:
            hotel_ids_with_price = hotel_ids_with_price.filter(Room.price_per_night <= max_price)
        query = query.filter(Hotel.id.in_(hotel_ids_with_price.subquery().select()))

    query = query.order_by(Hotel.rating_avg.desc())
    all_hotels = query.all()

    if check_in and check_out:
        all_hotels = [h for h in all_hotels if _rooms_available(db, h.id, check_in, check_out, guests or 0)]

    total = len(all_hotels)
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)
    start = (page - 1) * page_size
    items = all_hotels[start:start + page_size]
    total_pages = (total + page_size - 1) // page_size if total else 0
    return Page(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/{hotel_id}/available-rooms", response_model=list[RoomOut])
def available_rooms(hotel_id: int, check_in: date, check_out: date, guests: int = 1, db: Session = Depends(get_db)):
    rooms = db.query(Room).filter(Room.hotel_id == hotel_id, Room.is_active == True, Room.status == "ACTIVE").all()
    result = []
    for room in rooms:
        if (room.capacity_adults + room.capacity_children) < guests:
            continue
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
        if room.available_units - overlapping > 0:
            result.append(room)
    return result
