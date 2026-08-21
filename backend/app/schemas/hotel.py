from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field

from app.models.enums import VerificationStatus, BookingStatus
from app.schemas.common import ORMBase


class HotelCreate(BaseModel):
    name: str
    description: Optional[str] = None
    address: str
    city: str
    country: str
    destination_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    star_rating: int = Field(default=3, ge=1, le=5)
    amenities: Optional[List[str]] = None

    cover_image_url: Optional[str] = None

    check_in_time: str = "14:00"
    check_out_time: str = "11:00"


class HotelUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None

    destination_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    star_rating: Optional[int] = Field(default=None, ge=1, le=5)

    amenities: Optional[List[str]] = None

    cover_image_url: Optional[str] = None

    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None

    is_active: Optional[bool] = None


class HotelOut(ORMBase):

    id: int
    manager_id: int
    name: str
    description: Optional[str] = None
    address: str
    city: str
    country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    star_rating: int
    rating_avg: float
    review_count: int
    cover_image_url: Optional[str] = None
    check_in_time: str
    check_out_time: str
    verification_status: VerificationStatus
    is_active: bool
    created_at: datetime


class RoomTypeCreate(BaseModel):
    name: str
    description: Optional[str] = None


class RoomTypeOut(ORMBase):
    id: int
    name: str
    description: Optional[str] = None


class RoomCreate(BaseModel):
    hotel_id: int
    room_type_id: Optional[int] = None
    room_number: str
    name: str
    price_per_night: float
    capacity_adults: int = 2
    capacity_children: int = 0
    total_units: int = 1


class RoomUpdate(BaseModel):
    name: Optional[str] = None
    price_per_night: Optional[float] = None
    capacity_adults: Optional[int] = None
    capacity_children: Optional[int] = None
    total_units: Optional[int] = None
    available_units: Optional[int] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None


class RoomOut(ORMBase):
    id: int
    hotel_id: int
    room_type_id: Optional[int] = None
    room_number: str
    name: str
    price_per_night: float
    capacity_adults: int
    capacity_children: int
    total_units: int
    available_units: int
    status: str
    is_active: bool


class HotelSearchParams(BaseModel):
    city: Optional[str] = None
    check_in: Optional[date] = None
    check_out: Optional[date] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_rating: Optional[float] = None
    star_rating: Optional[int] = None
    guests: Optional[int] = None


class HotelBookingCreate(BaseModel):
    hotel_id: int
    room_id: int
    check_in_date: date
    check_out_date: date
    rooms_booked: int = 1
    guests_adults: int = 1
    guests_children: int = 0
    special_requests: Optional[str] = None
    coupon_code: Optional[str] = None


class HotelBookingOut(ORMBase):
    id: int
    booking_reference: str
    customer_id: int
    hotel_id: int
    room_id: int
    check_in_date: date
    check_out_date: date
    nights: int
    rooms_booked: int
    guests_adults: int
    guests_children: int
    price_per_night: float
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    status: BookingStatus
    special_requests: Optional[str] = None
    created_at: datetime


class BookingCancelRequest(BaseModel):
    reason: Optional[str] = None
