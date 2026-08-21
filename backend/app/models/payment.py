from sqlalchemy import Column, Integer, String, Boolean, Float, Text, ForeignKey, Enum as SAEnum, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.mixins import TimestampMixin, utcnow
from app.models.enums import PaymentStatus, RefundStatus, DiscountType, MembershipTier


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)

    hotel_booking_id = Column(Integer, ForeignKey(
        "hotel_bookings.id", ondelete="SET NULL"), nullable=True, unique=True)
    tour_booking_id = Column(Integer, ForeignKey(
        "tour_bookings.id", ondelete="SET NULL"), nullable=True, unique=True)
    activity_booking_id = Column(Integer, ForeignKey(
        "activity_bookings.id", ondelete="SET NULL"), nullable=True, unique=True)
    transport_booking_id = Column(Integer, ForeignKey(
        "transport_bookings.id", ondelete="SET NULL"), nullable=True, unique=True)

    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="usd", nullable=False)
    coupon_id = Column(Integer, ForeignKey(
        "coupons.id", ondelete="SET NULL"), nullable=True)

    stripe_payment_intent_id = Column(String(255), nullable=True, index=True)
    stripe_checkout_session_id = Column(String(255), nullable=True, index=True)
    stripe_customer_id = Column(String(255), nullable=True)

    status = Column(SAEnum(PaymentStatus),
                    default=PaymentStatus.PENDING, nullable=False, index=True)
    idempotency_key = Column(String(255), nullable=True, unique=True)
    failure_reason = Column(String(500), nullable=True)
    paid_at = Column(DateTime, nullable=True)

    hotel_booking = relationship("HotelBooking", back_populates="payment")
    tour_booking = relationship("TourBooking", back_populates="payment")
    activity_booking = relationship(
        "ActivityBooking", back_populates="payment")
    transport_booking = relationship(
        "TransportBooking", back_populates="payment")
    transactions = relationship(
        "Transaction", back_populates="payment", cascade="all, delete-orphan")
    refunds = relationship(
        "Refund", back_populates="payment", cascade="all, delete-orphan")


class Transaction(Base, TimestampMixin):
    """immutable ledger entry for every payment lifecycle event."""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(Integer, ForeignKey(
        "payments.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_type = Column(String(30), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(30), nullable=False)
    gateway_reference = Column(String(255), nullable=True)
    raw_response = Column(Text, nullable=True)

    payment = relationship("Payment", back_populates="transactions")


class Refund(Base, TimestampMixin):
    """Refund Management."""
    __tablename__ = "refunds"

    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(Integer, ForeignKey(
        "payments.id", ondelete="CASCADE"), nullable=False, index=True)
    requested_by_id = Column(Integer, ForeignKey(
        "users.id", ondelete="SET NULL"), nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey(
        "users.id", ondelete="SET NULL"), nullable=True)

    amount = Column(Float, nullable=False)
    reason = Column(String(500), nullable=True)
    admin_notes = Column(String(500), nullable=True)
    status = Column(SAEnum(RefundStatus),
                    default=RefundStatus.REQUESTED, nullable=False, index=True)
    stripe_refund_id = Column(String(255), nullable=True)
    processed_at = Column(DateTime, nullable=True)

    payment = relationship("Payment", back_populates="refunds")


class Coupon(Base, TimestampMixin):
    """Coupon & Discount Management."""
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    discount_type = Column(SAEnum(DiscountType), nullable=False)
    discount_value = Column(Float, nullable=False)
    min_order_amount = Column(Float, default=0, nullable=False)
    max_discount_amount = Column(Float, nullable=True)
    usage_limit = Column(Integer, nullable=True)
    usage_count = Column(Integer, default=0, nullable=False)
    per_user_limit = Column(Integer, default=1, nullable=False)
    user_specific_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=True)
    valid_from = Column(DateTime, default=utcnow, nullable=False)
    valid_until = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    usages = relationship(
        "CouponUsage", back_populates="coupon", cascade="all, delete-orphan")


class CouponUsage(Base, TimestampMixin):
    __tablename__ = "coupon_usages"
    __table_args__ = (UniqueConstraint("coupon_id", "user_id",
                      "payment_id", name="uq_coupon_user_payment"),)

    id = Column(Integer, primary_key=True, index=True)
    coupon_id = Column(Integer, ForeignKey(
        "coupons.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    payment_id = Column(Integer, ForeignKey(
        "payments.id", ondelete="SET NULL"), nullable=True)
    discount_applied = Column(Float, nullable=False)

    coupon = relationship("Coupon", back_populates="usages")


class MembershipPlan(Base, TimestampMixin):
    """Basic / Premium / Enterprise plan definitions."""
    __tablename__ = "membership_plans"

    id = Column(Integer, primary_key=True, index=True)
    tier = Column(SAEnum(MembershipTier), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    price_monthly = Column(Float, nullable=False)
    price_yearly = Column(Float, nullable=False)
    benefits = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    subscriptions = relationship("UserMembership", back_populates="plan")


class UserMembership(Base, TimestampMixin):
    __tablename__ = "user_memberships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(Integer, ForeignKey("membership_plans.id",
                     ondelete="CASCADE"), nullable=False, index=True)

    billing_cycle = Column(String(10), default="MONTHLY",
                           nullable=False)
    status = Column(String(20), default="ACTIVE", nullable=False)
    started_at = Column(DateTime, default=utcnow, nullable=False)
    renews_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    stripe_subscription_id = Column(String(255), nullable=True)

    plan = relationship("MembershipPlan", back_populates="subscriptions")
