"""Travel memberships and subscription plans."""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.payment import MembershipPlan, UserMembership
from app.schemas.payment import MembershipPlanOut, MembershipSubscribeRequest, UserMembershipOut
from app.schemas.common import Msg
from app.services import stripe_service
from app.services.stripe_service import StripeServiceError
from app.config import settings
from app.utils.exceptions import not_found, bad_request

router = APIRouter(prefix="/memberships", tags=["Membership Plans"])


@router.get("/plans", response_model=list[MembershipPlanOut])
def list_plans(db: Session = Depends(get_db)):
    return db.query(MembershipPlan).filter(MembershipPlan.is_active == True).all()


@router.get("/me", response_model=UserMembershipOut | None)
def my_membership(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(UserMembership)
        .filter(UserMembership.user_id == current_user.id, UserMembership.status == "ACTIVE")
        .order_by(UserMembership.started_at.desc())
        .first()
    )


@router.post("/subscribe")
def subscribe(payload: MembershipSubscribeRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    plan = db.get(MembershipPlan, payload.plan_id)
    if not plan or not plan.is_active:
        raise not_found("Membership plan")

    price = plan.price_yearly if payload.billing_cycle == "YEARLY" else plan.price_monthly
    try:
        session = stripe_service.create_checkout_session(
            amount=price, currency=settings.STRIPE_CURRENCY,
            product_name=f"TravelMate Pro — {plan.name} ({payload.billing_cycle.title()})",
            customer_email=current_user.email,
            success_url=f"{settings.FRONTEND_URL}/membership/confirm?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/membership",
            metadata={"type": "membership", "user_id": str(current_user.id), "plan_id": str(plan.id),
                      "billing_cycle": payload.billing_cycle},
        )
        return {"checkout_url": session.url}
    except StripeServiceError as exc:
        raise bad_request(str(exc))


@router.get("/confirm", response_model=UserMembershipOut)
def confirm_subscription(session_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        session = stripe_service.retrieve_checkout_session(session_id)
    except StripeServiceError as exc:
        raise bad_request(str(exc))

    if session.payment_status != "paid":
        raise bad_request("Payment has not completed yet")

    metadata = session.metadata or {}
    if metadata.get("type") != "membership" or int(metadata.get("user_id", 0)) != current_user.id:
        raise bad_request("This checkout session does not belong to a membership purchase for this account")

    plan = db.get(MembershipPlan, int(metadata["plan_id"]))
    if not plan:
        raise not_found("Membership plan")

    billing_cycle = metadata.get("billing_cycle", "MONTHLY")
    duration = timedelta(days=365 if billing_cycle == "YEARLY" else 30)

    db.query(UserMembership).filter(UserMembership.user_id == current_user.id, UserMembership.status == "ACTIVE") \
        .update({UserMembership.status: "CANCELLED", UserMembership.cancelled_at: datetime.now(timezone.utc)})

    membership = UserMembership(
        user_id=current_user.id, plan_id=plan.id, billing_cycle=billing_cycle, status="ACTIVE",
        renews_at=datetime.now(timezone.utc) + duration,
        stripe_subscription_id=session.id,
    )
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership


@router.post("/me/cancel", response_model=Msg)
def cancel_membership(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    membership = db.query(UserMembership).filter(
        UserMembership.user_id == current_user.id, UserMembership.status == "ACTIVE"
    ).first()
    if not membership:
        raise not_found("Active membership")
    membership.status = "CANCELLED"
    membership.cancelled_at = datetime.now(timezone.utc)
    db.commit()
    return Msg(message="Membership cancelled")


@router.post("/plans", response_model=MembershipPlanOut, status_code=201)
def upsert_plan(tier: str, name: str, price_monthly: float, price_yearly: float, benefits: list[str],
                 db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    import json
    plan = MembershipPlan(tier=tier, name=name, price_monthly=price_monthly, price_yearly=price_yearly,
                           benefits=json.dumps(benefits))
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan
