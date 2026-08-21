from datetime import datetime
from typing import Optional, List, Literal

from pydantic import BaseModel, Field

from app.models.enums import (
    PaymentStatus,
    RefundStatus,
    DiscountType,
    MembershipTier,
)
from app.schemas.common import ORMBase


# ============================================================
# CHECKOUT
# ============================================================

class CheckoutRequest(BaseModel):
    """
    Create a Stripe checkout/payment intent for a booking.

    booking_type determines which booking table is used.
    """

    booking_type: Literal[
        "HOTEL",
        "TOUR",
        "ACTIVITY",
        "TRANSPORT",
    ] = Field(
        description="Type of booking being paid for."
    )

    booking_id: int = Field(
        gt=0,
        description="ID of the booking being paid for.",
    )

    payment_method: Literal[
        "checkout_session",
        "payment_intent",
    ] = Field(
        default="checkout_session",
        description="Stripe payment flow to use.",
    )


class CheckoutResponse(BaseModel):
    """
    Response returned after creating a Stripe payment.
    """

    payment_id: int
    checkout_url: Optional[str] = None
    client_secret: Optional[str] = None
    amount: float
    currency: str


# ============================================================
# PAYMENTS
# ============================================================

class PaymentOut(ORMBase):
    id: int
    customer_id: int

    amount: float
    currency: str
    status: PaymentStatus

    stripe_payment_intent_id: Optional[str] = None
    stripe_checkout_session_id: Optional[str] = None

    paid_at: Optional[datetime] = None
    created_at: datetime


# ============================================================
# TRANSACTIONS
# ============================================================

class TransactionOut(ORMBase):
    id: int
    payment_id: int

    transaction_type: str
    amount: float
    status: str

    created_at: datetime


# ============================================================
# REFUNDS
# ============================================================

class RefundRequestCreate(BaseModel):
    payment_id: int

    amount: float = Field(
        gt=0,
        description="Refund amount in the payment currency.",
    )

    reason: Optional[str] = None


class RefundReviewRequest(BaseModel):
    approve: bool
    admin_notes: Optional[str] = None


class RefundOut(ORMBase):
    id: int
    payment_id: int

    amount: float
    reason: Optional[str] = None

    status: RefundStatus

    admin_notes: Optional[str] = None
    created_at: datetime


# ============================================================
# COUPONS
# ============================================================

class CouponCreate(BaseModel):
    code: str = Field(
        min_length=1,
        max_length=50,
    )

    description: Optional[str] = None

    discount_type: DiscountType

    discount_value: float = Field(
        gt=0,
        description="Percentage or fixed discount value.",
    )

    min_order_amount: float = Field(
        default=0,
        ge=0,
    )

    max_discount_amount: Optional[float] = Field(
        default=None,
        gt=0,
    )

    usage_limit: Optional[int] = Field(
        default=None,
        gt=0,
    )

    per_user_limit: int = Field(
        default=1,
        gt=0,
    )

    user_specific_id: Optional[int] = Field(
        default=None,
        gt=0,
    )

    valid_until: Optional[datetime] = None


class CouponOut(ORMBase):
    id: int

    code: str
    description: Optional[str] = None

    discount_type: DiscountType
    discount_value: float

    min_order_amount: float
    max_discount_amount: Optional[float] = None

    usage_limit: Optional[int] = None
    usage_count: int
    per_user_limit: int

    valid_from: datetime
    valid_until: Optional[datetime] = None

    is_active: bool


class CouponValidateRequest(BaseModel):
    code: str = Field(
        min_length=1,
        max_length=50,
    )

    order_amount: float = Field(
        gt=0,
    )


class CouponValidateResponse(BaseModel):
    valid: bool

    discount_amount: float = Field(
        default=0,
        ge=0,
    )

    message: str


# ============================================================
# MEMBERSHIP PLANS
# ============================================================

class MembershipPlanOut(ORMBase):
    id: int

    tier: MembershipTier
    name: str

    price_monthly: float
    price_yearly: float

    benefits: Optional[str] = None
    is_active: bool


class MembershipSubscribeRequest(BaseModel):
    plan_id: int = Field(
        gt=0,
    )

    billing_cycle: Literal[
        "MONTHLY",
        "YEARLY",
    ] = "MONTHLY"


class UserMembershipOut(ORMBase):
    id: int
    user_id: int
    plan_id: int

    billing_cycle: str
    status: str

    started_at: datetime
    renews_at: Optional[datetime] = None

    plan: Optional[MembershipPlanOut] = None
