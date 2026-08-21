"""Coupon rules, promos, and discount validation."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.payment import Coupon
from app.schemas.payment import CouponCreate, CouponOut, CouponValidateRequest, CouponValidateResponse
from app.schemas.common import Msg
from app.services.coupon_service import validate_and_price_coupon
from app.utils.exceptions import not_found, conflict

router = APIRouter(prefix="/coupons", tags=["Coupons & Discounts"])


@router.get("", response_model=list[CouponOut])
def list_coupons(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(Coupon).order_by(Coupon.created_at.desc()).all()


@router.post("", response_model=CouponOut, status_code=201)
def create_coupon(payload: CouponCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    if db.query(Coupon).filter(Coupon.code == payload.code.upper()).first():
        raise conflict("A coupon with this code already exists")
    data = payload.model_dump()
    data["code"] = data["code"].upper()
    coupon = Coupon(**data)
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return coupon


@router.put("/{coupon_id}/deactivate", response_model=CouponOut)
def deactivate_coupon(coupon_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    coupon = db.get(Coupon, coupon_id)
    if not coupon:
        raise not_found("Coupon")
    coupon.is_active = False
    db.commit()
    db.refresh(coupon)
    return coupon


@router.delete("/{coupon_id}", response_model=Msg)
def delete_coupon(coupon_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    coupon = db.get(Coupon, coupon_id)
    if not coupon:
        raise not_found("Coupon")
    db.delete(coupon)
    db.commit()
    return Msg(message="Coupon deleted")


@router.post("/validate", response_model=CouponValidateResponse)
def validate_coupon(payload: CouponValidateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    coupon, discount, message = validate_and_price_coupon(db, payload.code, current_user.id, payload.order_amount)
    return CouponValidateResponse(valid=coupon is not None, discount_amount=discount, message=message)
