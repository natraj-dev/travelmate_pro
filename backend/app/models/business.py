from sqlalchemy import Column, Integer, String, Boolean, Float, Text, ForeignKey, Enum as SAEnum, DateTime
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.mixins import TimestampMixin
from app.models.enums import VerificationStatus, LeadStatus


class TravelAgentProfile(Base, TimestampMixin):
    """Travel Agent Management."""
    __tablename__ = "travel_agent_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    agency_name = Column(String(200), nullable=True)
    license_number = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    commission_rate_percent = Column(Float, default=10.0, nullable=False)
    verification_status = Column(SAEnum(
        VerificationStatus), default=VerificationStatus.PENDING, nullable=False, index=True)

    leads = relationship("Lead", back_populates="agent",
                         cascade="all, delete-orphan")
    commissions = relationship(
        "Commission", back_populates="agent", cascade="all, delete-orphan")


class AgentCustomerLink(Base, TimestampMixin):
    """Manage Customers — links an agent to the customers they manage."""
    __tablename__ = "agent_customer_links"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey(
        "travel_agent_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    notes = Column(Text, nullable=True)


class Lead(Base, TimestampMixin):
    """Customer Lead Management."""
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey(
        "travel_agent_profiles.id", ondelete="CASCADE"), nullable=False, index=True)

    full_name = Column(String(150), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(32), nullable=True)
    interested_destination = Column(String(150), nullable=True)
    budget = Column(Float, nullable=True)
    status = Column(SAEnum(LeadStatus), default=LeadStatus.NEW,
                    nullable=False, index=True)
    source = Column(String(50), nullable=True)
    follow_up_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    converted_at = Column(DateTime, nullable=True)

    agent = relationship("TravelAgentProfile", back_populates="leads")


class Commission(Base, TimestampMixin):
    """Commission Tracking."""
    __tablename__ = "commissions"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey(
        "travel_agent_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    source_booking_type = Column(String(20), nullable=False)
    source_booking_id = Column(Integer, nullable=False)
    booking_amount = Column(Float, nullable=False)
    commission_percent = Column(Float, nullable=False)
    commission_amount = Column(Float, nullable=False)
    status = Column(String(20), default="PENDING", nullable=False)

    agent = relationship("TravelAgentProfile", back_populates="commissions")


class Report(Base, TimestampMixin):
    """Reports & Export — metadata of a generated report file."""
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    generated_by_id = Column(Integer, ForeignKey(
        "users.id", ondelete="SET NULL"), nullable=True)
    report_type = Column(String(50), nullable=False)
    format = Column(String(10), nullable=False)
    file_path = Column(String(500), nullable=False)
    filters_applied = Column(Text, nullable=True)


class BusinessAnalyticsSnapshot(Base, TimestampMixin):
    """daily cached rollup so dashboards load instantly."""
    __tablename__ = "business_analytics_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    snapshot_date = Column(DateTime, nullable=False, index=True)
    total_customers = Column(Integer, default=0, nullable=False)
    total_hotels = Column(Integer, default=0, nullable=False)
    total_tours = Column(Integer, default=0, nullable=False)
    total_bookings = Column(Integer, default=0, nullable=False)
    total_revenue = Column(Float, default=0, nullable=False)
    total_refunds = Column(Float, default=0, nullable=False)
