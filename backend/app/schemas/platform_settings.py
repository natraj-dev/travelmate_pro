from typing import Optional, List
from pydantic import BaseModel

from app.schemas.common import ORMBase


class PlatformSettingUpdate(BaseModel):
    category: str
    key: str
    value: str
    value_type: str = "STRING"
    description: Optional[str] = None
    is_secret: bool = False


class PlatformSettingOut(ORMBase):
    id: int
    category: str
    key: str
    value: Optional[str] = None
    value_type: str
    description: Optional[str] = None
    is_secret: bool


class AdminAnalyticsOut(BaseModel):
    total_customers: int
    total_hotels: int
    total_tours: int
    total_bookings: int
    total_revenue: float
    total_refunds: float
    pending_verifications: int
    open_support_tickets: int


class RevenueTrendPoint(BaseModel):
    period: str
    revenue: float
    bookings: int


class PopularDestinationStat(BaseModel):
    destination_id: int
    name: str
    booking_count: int
