from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from app.models.enums import DocumentType
from app.schemas.common import ORMBase


class TravelDocumentOut(ORMBase):
    id: int
    user_id: int
    document_type: DocumentType
    document_number: Optional[str] = None
    issuing_country: Optional[str] = None
    expiry_date: Optional[datetime] = None
    file_url: str
    is_verified: bool
    created_at: datetime


class InsurancePlanOut(ORMBase):
    id: int
    name: str
    description: Optional[str] = None
    coverage_details: Optional[str] = None
    price: float
    duration_days: int
    is_active: bool


class InsurancePlanCreate(BaseModel):
    name: str
    description: Optional[str] = None
    coverage_details: Optional[list[str]] = None
    price: float
    duration_days: int = 7


class InsurancePurchaseRequest(BaseModel):
    plan_id: int
    start_date: datetime
    linked_booking_type: Optional[str] = None
    linked_booking_id: Optional[int] = None


class InsurancePolicyOut(ORMBase):
    id: int
    policy_number: str
    user_id: int
    plan_id: int
    start_date: datetime
    end_date: datetime
    status: str
    created_at: datetime
