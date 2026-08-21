from sqlalchemy import Column, Integer, String, Boolean, Float, Text, ForeignKey, Enum as SAEnum, DateTime
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.mixins import TimestampMixin
from app.models.enums import DocumentType


class TravelDocument(Base, TimestampMixin):
    __tablename__ = "travel_documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(SAEnum(DocumentType), nullable=False, index=True)
    document_number = Column(String(100), nullable=True)
    issuing_country = Column(String(100), nullable=True)
    expiry_date = Column(DateTime, nullable=True)
    file_url = Column(String(500), nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    verified_by_id = Column(Integer, ForeignKey(
        "users.id", ondelete="SET NULL"), nullable=True)


class InsurancePlan(Base, TimestampMixin):
    __tablename__ = "insurance_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    coverage_details = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    duration_days = Column(Integer, nullable=False, default=7)
    is_active = Column(Boolean, default=True, nullable=False)

    policies = relationship("InsurancePolicy", back_populates="plan")


class InsurancePolicy(Base, TimestampMixin):
    __tablename__ = "insurance_policies"

    id = Column(Integer, primary_key=True, index=True)
    policy_number = Column(String(30), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(Integer, ForeignKey("insurance_plans.id",
                     ondelete="CASCADE"), nullable=False, index=True)

    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    status = Column(String(20), default="ACTIVE", nullable=False)
    policy_document_url = Column(String(500), nullable=True)
    linked_booking_type = Column(String(20), nullable=True)
    linked_booking_id = Column(Integer, nullable=True)

    plan = relationship("InsurancePlan", back_populates="policies")
