from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

from app.models.enums import VerificationStatus, LeadStatus
from app.schemas.common import ORMBase


class TravelAgentProfileCreate(BaseModel):
    agency_name: Optional[str] = None
    license_number: Optional[str] = None
    bio: Optional[str] = None


class TravelAgentProfileOut(ORMBase):
    id: int
    user_id: int
    agency_name: Optional[str] = None
    license_number: Optional[str] = None
    bio: Optional[str] = None
    commission_rate_percent: float
    verification_status: VerificationStatus


class LeadCreate(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    interested_destination: Optional[str] = None
    budget: Optional[float] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[datetime] = None


class LeadUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    interested_destination: Optional[str] = None
    budget: Optional[float] = None
    status: Optional[LeadStatus] = None
    notes: Optional[str] = None
    follow_up_date: Optional[datetime] = None


class LeadOut(ORMBase):
    id: int
    agent_id: int
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    interested_destination: Optional[str] = None
    budget: Optional[float] = None
    status: LeadStatus
    source: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime


class CommissionOut(ORMBase):
    id: int
    agent_id: int
    source_booking_type: str
    source_booking_id: int
    booking_amount: float
    commission_percent: float
    commission_amount: float
    status: str
    created_at: datetime


class ReportGenerateRequest(BaseModel):
    report_type: str  # BOOKING | REVENUE | HOTEL | TOUR | CUSTOMER | AGENT
    format: str        # PDF | CSV | EXCEL
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None


class ReportOut(ORMBase):
    id: int
    report_type: str
    format: str
    file_path: str
    created_at: datetime
