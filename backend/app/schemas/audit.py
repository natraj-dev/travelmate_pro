from datetime import datetime
from typing import Optional
from app.schemas.common import ORMBase


class AuditLogOut(ORMBase):
    id: int
    user_id: Optional[int] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime


class SecurityLogOut(ORMBase):
    id: int
    user_id: Optional[int] = None
    event_type: str
    description: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime
