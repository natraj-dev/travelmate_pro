from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field

from app.models.enums import (
    NotificationType,
    TicketStatus,
    TicketPriority,
    UserRole,
)
from app.schemas.common import ORMBase


class NotificationOut(ORMBase):
    id: int
    type: NotificationType
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime


# ============================================================
# IN-APP MESSAGING
# ============================================================

class MessageCreate(BaseModel):
    recipient_id: int
    content: str
    attachment_url: Optional[str] = None


class MessageOut(ORMBase):
    id: int
    sender_id: int
    recipient_id: int
    content: str
    attachment_url: Optional[str] = None
    is_read: bool
    created_at: datetime


class MessageContact(BaseModel):
    """
    A user that the current user is allowed to start
    a conversation with.
    """

    id: int
    name: str
    role: UserRole
    email: Optional[str] = None


class ConversationSummary(BaseModel):
    """
    Summary of an existing conversation for the
    current logged-in user.
    """

    other_user_id: int
    other_user_name: str
    other_user_role: UserRole
    last_message: str
    last_message_at: datetime
    unread_count: int


# ============================================================
# SUPPORT TICKETS
# ============================================================

class SupportTicketCreate(BaseModel):
    category: str
    subject: str
    description: str
    priority: TicketPriority = TicketPriority.MEDIUM


class SupportTicketReplyCreate(BaseModel):
    content: str
    attachment_url: Optional[str] = None


class SupportTicketMessageOut(ORMBase):
    id: int
    sender_id: int
    content: str
    attachment_url: Optional[str] = None
    created_at: datetime


class SupportTicketOut(ORMBase):
    id: int
    ticket_number: str
    customer_id: int
    assigned_to_id: Optional[int] = None
    category: str
    subject: str
    description: str
    priority: TicketPriority
    status: TicketStatus
    created_at: datetime
    replies: List[SupportTicketMessageOut] = Field(default_factory=list)


class SupportTicketUpdate(BaseModel):
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    assigned_to_id: Optional[int] = None
