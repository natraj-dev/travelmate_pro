from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

from app.models.enums import DestinationCategoryType, TransportType
from app.schemas.common import ORMBase


class DestinationCategoryCreate(BaseModel):
    name: str
    type: DestinationCategoryType
    description: Optional[str] = None


class DestinationCategoryOut(ORMBase):
    id: int
    name: str
    type: DestinationCategoryType
    description: Optional[str] = None


class DestinationCreate(BaseModel):
    name: str
    country: str
    region: Optional[str] = None
    description: Optional[str] = None

    travel_information: Optional[str] = None
    best_time_to_visit: Optional[str] = None

    latitude: Optional[float] = None
    longitude: Optional[float] = None

    cover_image_url: Optional[str] = None
    images: Optional[str] = None

    category_id: Optional[int] = None

    is_popular: bool = False
    is_active: bool = True


class DestinationUpdate(BaseModel):
    name: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    description: Optional[str] = None

    travel_information: Optional[str] = None
    best_time_to_visit: Optional[str] = None

    latitude: Optional[float] = None
    longitude: Optional[float] = None

    cover_image_url: Optional[str] = None
    images: Optional[str] = None

    category_id: Optional[int] = None

    is_popular: Optional[bool] = None
    is_active: Optional[bool] = None


class DestinationOut(ORMBase):
    id: int
    name: str
    country: str
    region: Optional[str] = None

    description: Optional[str] = None
    travel_information: Optional[str] = None
    best_time_to_visit: Optional[str] = None

    latitude: Optional[float] = None
    longitude: Optional[float] = None

    cover_image_url: Optional[str] = None
    images: Optional[str] = None

    is_popular: bool
    is_active: bool

    category: Optional[DestinationCategoryOut] = None
    created_at: datetime


class TravelGuideCreate(BaseModel):
    destination_id: int
    title: str
    local_tips: Optional[str] = None
    tourist_attractions: Optional[str] = None
    safety_information: Optional[str] = None
    recommendations: Optional[str] = None


class TravelGuideOut(ORMBase):
    id: int
    destination_id: int
    title: str
    local_tips: Optional[str] = None
    tourist_attractions: Optional[str] = None
    safety_information: Optional[str] = None
    recommendations: Optional[str] = None
    is_published: bool
    created_at: datetime


class ActivityCreate(BaseModel):
    destination_id: int
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: float
    duration_hours: Optional[float] = None
    capacity_per_slot: int = 20
    image_url: Optional[str] = None


class ActivityOut(ORMBase):
    id: int
    destination_id: int
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: float
    duration_hours: Optional[float] = None
    capacity_per_slot: int
    rating_avg: float
    image_url: Optional[str] = None
    is_active: bool


class TransportOptionCreate(BaseModel):
    type: TransportType
    provider_name: str
    origin: str
    destination_name: str
    departure_time: datetime
    arrival_time: datetime
    price: float
    seats_available: int


class TransportOptionOut(ORMBase):
    id: int
    type: TransportType
    provider_name: str
    origin: str
    destination_name: str
    departure_time: datetime
    arrival_time: datetime
    price: float
    seats_available: int
    is_active: bool


class AirportTransferCreate(BaseModel):
    pickup_location: str
    drop_location: str
    vehicle_type: str = "Sedan"
    scheduled_time: datetime


class AirportTransferOut(ORMBase):
    id: int
    customer_id: int
    pickup_location: str
    drop_location: str
    vehicle_type: str
    scheduled_time: datetime
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    status: str
    price: float
    tracking_reference: Optional[str] = None
