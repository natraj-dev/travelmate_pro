from datetime import date, datetime
from typing import Optional, List

from pydantic import BaseModel, field_validator

from app.models.enums import VerificationStatus, BookingStatus
from app.schemas.common import ORMBase


class TourOperatorCreate(BaseModel):
    company_name: str
    company_description: Optional[str] = None
    license_number: Optional[str] = None
    website: Optional[str] = None
    years_in_business: Optional[int] = None


class TourOperatorOut(ORMBase):
    id: int
    user_id: int
    company_name: str
    company_description: Optional[str] = None
    license_number: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    verification_status: VerificationStatus
    rating_avg: float
    created_at: datetime


class TourGuideCreate(BaseModel):
    full_name: str
    languages: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None


class TourGuideOut(ORMBase):
    id: int
    operator_id: int
    full_name: str
    languages: Optional[str] = None
    phone: Optional[str] = None
    photo_url: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool


# ============================================================
# TOUR PACKAGE
# ============================================================

class TourPackageCreate(BaseModel):
    destination_id: Optional[int] = None

    title: str
    description: Optional[str] = None

    included_services: Optional[List[str]] = None
    excluded_services: Optional[List[str]] = None

    duration_days: int
    duration_nights: int

    price_per_person: float
    max_group_size: int = 20

    activity_type: Optional[str] = None

    # URL-based images
    cover_image_url: Optional[str] = None
    images: Optional[List[str]] = None

    is_published: bool = False


class TourPackageUpdate(BaseModel):
    destination_id: Optional[int] = None

    title: Optional[str] = None
    description: Optional[str] = None

    included_services: Optional[List[str]] = None
    excluded_services: Optional[List[str]] = None

    duration_days: Optional[int] = None
    duration_nights: Optional[int] = None

    price_per_person: Optional[float] = None
    max_group_size: Optional[int] = None

    activity_type: Optional[str] = None

    # URL-based images
    cover_image_url: Optional[str] = None
    images: Optional[List[str]] = None

    is_published: Optional[bool] = None


class TourPackageOut(ORMBase):
    id: int

    operator_id: int
    destination_id: Optional[int] = None

    title: str
    description: Optional[str] = None

    included_services: Optional[List[str]] = None
    excluded_services: Optional[List[str]] = None

    duration_days: int
    duration_nights: int

    price_per_person: float
    max_group_size: int

    activity_type: Optional[str] = None

    cover_image_url: Optional[str] = None
    images: Optional[List[str]] = None

    rating_avg: float
    review_count: int

    is_published: bool

    created_at: datetime
    updated_at: datetime

    # --------------------------------------------------------
    # Database stores these fields as JSON strings in TEXT.
    # Convert them back to Python lists for the API response.
    # --------------------------------------------------------

    @field_validator(
        "included_services",
        "excluded_services",
        "images",
        mode="before",
    )
    @classmethod
    def parse_json_list(cls, value):
        if value is None:
            return None

        if isinstance(value, list):
            return value

        if isinstance(value, str):
            try:
                import json
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return []

        return value


# ============================================================
# TOUR SCHEDULE
# ============================================================

class TourScheduleCreate(BaseModel):
    package_id: int
    departure_date: date
    return_date: date
    departure_location: str
    total_seats: int


class TourScheduleOut(ORMBase):
    id: int
    package_id: int
    departure_date: date
    return_date: date
    departure_location: str
    total_seats: int
    seats_available: int
    is_active: bool


class TourSearchParams(BaseModel):
    destination_id: Optional[int] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_duration: Optional[int] = None
    max_duration: Optional[int] = None
    activity_type: Optional[str] = None
    min_rating: Optional[float] = None
    departure_after: Optional[date] = None


class TravelerDetail(BaseModel):
    name: str
    age: Optional[int] = None


class TourBookingCreate(BaseModel):
    package_id: int
    schedule_id: int
    traveler_count: int = 1
    traveler_details: Optional[List[TravelerDetail]] = None
    coupon_code: Optional[str] = None


class TourBookingOut(ORMBase):
    id: int
    booking_reference: str
    customer_id: int
    package_id: int
    schedule_id: int
    traveler_count: int
    price_per_person: float
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    status: BookingStatus
    created_at: datetime
