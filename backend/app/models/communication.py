from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, Enum as SAEnum, DateTime
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.mixins import TimestampMixin, utcnow
from app.models.enums import NotificationType, TicketStatus, TicketPriority


class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(SAEnum(NotificationType), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(String(500), nullable=False)
    link = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="notifications")


class Message(Base, TimestampMixin):
    """In-App Messaging between customer and agent / hotel manager / tour operator / support."""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    thread_key = Column(String(80), nullable=False, index=True)
    content = Column(Text, nullable=False)
    attachment_url = Column(String(500), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime, nullable=True)


class SupportTicket(Base, TimestampMixin):
    """Customer Support & Complaints."""
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String(20), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_to_id = Column(Integer, ForeignKey(
        "users.id", ondelete="SET NULL"), nullable=True, index=True)

    category = Column(String(50), nullable=False)
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(SAEnum(TicketPriority),
                      default=TicketPriority.MEDIUM, nullable=False)
    status = Column(SAEnum(TicketStatus),
                    default=TicketStatus.OPEN, nullable=False, index=True)
    resolved_at = Column(DateTime, nullable=True)

    replies = relationship("SupportTicketMessage", back_populates="ticket",
                           cascade="all, delete-orphan", order_by="SupportTicketMessage.created_at")


class SupportTicketMessage(Base, TimestampMixin):
    __tablename__ = "support_ticket_messages"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey(
        "support_tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    attachment_url = Column(String(500), nullable=True)

    ticket = relationship("SupportTicket", back_populates="replies")
