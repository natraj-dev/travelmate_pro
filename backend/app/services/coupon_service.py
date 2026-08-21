"""Shared coupon validation/discount logic () used by every booking type."""
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.payment import Coupon, CouponUsage
from app.models.enums import DiscountType


def validate_and_price_coupon(db: Session, code: str, user_id: int, order_amount: float) -> tuple[Coupon | None, float, str]:
    """Returns (coupon_or_none, discount_amount, message)."""
    coupon = db.query(Coupon).filter(Coupon.code == code.upper(), Coupon.is_active == True).first()
    if not coupon:
        return None, 0.0, "Invalid coupon code"

    now = datetime.now(timezone.utc)
    valid_until = coupon.valid_until
    if valid_until and valid_until.tzinfo is None:
        valid_until = valid_until.replace(tzinfo=timezone.utc)
    if valid_until and valid_until < now:
        return None, 0.0, "This coupon has expired"

    if coupon.user_specific_id and coupon.user_specific_id != user_id:
        return None, 0.0, "This coupon is not valid for your account"

    if order_amount < coupon.min_order_amount:
        return None, 0.0, f"Minimum order amount for this coupon is {coupon.min_order_amount:.2f}"

    if coupon.usage_limit is not None and coupon.usage_count >= coupon.usage_limit:
        return None, 0.0, "This coupon has reached its usage limit"

    user_usage_count = db.query(CouponUsage).filter(CouponUsage.coupon_id == coupon.id, CouponUsage.user_id == user_id).count()
    if user_usage_count >= coupon.per_user_limit:
        return None, 0.0, "You have already used this coupon the maximum number of times"

    if coupon.discount_type == DiscountType.PERCENTAGE:
        discount = order_amount * (coupon.discount_value / 100)
        if coupon.max_discount_amount:
            discount = min(discount, coupon.max_discount_amount)
    else:
        discount = min(coupon.discount_value, order_amount)

    return coupon, round(discount, 2), "Coupon applied successfully"


def record_coupon_usage(db: Session, coupon: Coupon, user_id: int, payment_id: int, discount_applied: float) -> None:
    coupon.usage_count += 1
    db.add(CouponUsage(coupon_id=coupon.id, user_id=user_id, payment_id=payment_id, discount_applied=discount_applied))
