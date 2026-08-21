from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel

from app.models.enums import BookingStatus
from app.schemas.common import ORMBase


class ActivityBookingCreate(BaseModel):
    activity_id: int
    activity_date: date
    participants: int = 1


class ActivityBookingOut(ORMBase):
    id: int
    booking_reference: str
    customer_id: int
    activity_id: int
    activity_date: date
    participants: int
    price_per_person: float
    total_amount: float
    status: BookingStatus
    created_at: datetime


class TransportBookingCreate(BaseModel):
    transport_option_id: int
    seats_booked: int = 1
    passenger_details: Optional[List[dict]] = None


class TransportBookingOut(ORMBase):
    id: int
    booking_reference: str
    customer_id: int
    transport_option_id: int
    seats_booked: int
    price_per_seat: float
    total_amount: float
    status: BookingStatus
    created_at: datetime


# ---- Itinerary () ----
class ItineraryItemCreate(BaseModel):
    item_type: str
    reference_id: Optional[int] = None
    title: str
    time_slot: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    estimated_cost: Optional[float] = None
    sort_order: int = 0


class ItineraryItemOut(ORMBase):
    id: int
    item_type: str
    reference_id: Optional[int] = None
    title: str
    time_slot: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    estimated_cost: Optional[float] = None
    sort_order: int


class ItineraryDayCreate(BaseModel):
    day_number: int
    date: Optional[date] = None
    summary: Optional[str] = None
    items: List[ItineraryItemCreate] = []


class ItineraryDayOut(ORMBase):
    id: int
    day_number: int
    date: Optional[date] = None
    summary: Optional[str] = None
    items: List[ItineraryItemOut] = []


class ItineraryCreate(BaseModel):
    title: str
    destination_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[float] = None
    notes: Optional[str] = None
    days: List[ItineraryDayCreate] = []


class ItineraryUpdate(BaseModel):
    title: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[float] = None
    notes: Optional[str] = None
    is_shared: Optional[bool] = None


class ItineraryOut(ORMBase):
    id: int
    customer_id: int
    title: str
    destination_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[float] = None
    notes: Optional[str] = None
    is_ai_generated: bool
    is_shared: bool
    days: List[ItineraryDayOut] = []
    created_at: datetime
