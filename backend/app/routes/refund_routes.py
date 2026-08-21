"""Refund processing and status handling."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.payment import Payment, Refund, Transaction
from app.models.enums import RefundStatus, PaymentStatus, NotificationType
from app.schemas.payment import RefundRequestCreate, RefundReviewRequest, RefundOut
from app.services import stripe_service
from app.services.stripe_service import StripeServiceError
from app.services.notification_service import notify
from app.utils.exceptions import not_found, forbidden, bad_request
from app.utils.pagination import paginate, Page
from app.utils.audit import log_action

router = APIRouter(prefix="/refunds", tags=["Refund Management"])


@router.post("", response_model=RefundOut, status_code=201)
def request_refund(payload: RefundRequestCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    payment = db.get(Payment, payload.payment_id)
    if not payment:
        raise not_found("Payment")
    if payment.customer_id != current_user.id:
        raise forbidden()
    if payment.status != PaymentStatus.SUCCEEDED:
        raise bad_request("Only successful payments are eligible for a refund")
    if payload.amount > payment.amount:
        raise bad_request("Refund amount cannot exceed the original payment amount")

    refund = Refund(payment_id=payment.id, requested_by_id=current_user.id, amount=payload.amount, reason=payload.reason)
    db.add(refund)
    db.commit()
    db.refresh(refund)
    return refund


@router.get("/mine", response_model=list[RefundOut])
def my_refunds(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(Refund)
        .join(Payment, Refund.payment_id == Payment.id)
        .filter(Payment.customer_id == current_user.id)
        .order_by(Refund.created_at.desc())
        .all()
    )


@router.get("", response_model=Page[RefundOut])
def list_refunds(status_filter: RefundStatus | None = None, page: int = 1, page_size: int = 20,
                  db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    query = db.query(Refund)
    if status_filter:
        query = query.filter(Refund.status == status_filter)
    query = query.order_by(Refund.created_at.desc())
    items, total, page, page_size, total_pages = paginate(query, page, page_size)
    return Page(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.put("/{refund_id}/review", response_model=RefundOut)
def review_refund(refund_id: int, payload: RefundReviewRequest, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    refund = db.get(Refund, refund_id)
    if not refund:
        raise not_found("Refund request")
    if refund.status != RefundStatus.REQUESTED:
        raise bad_request(f"Refund is already {refund.status.value.lower()}")

    refund.reviewed_by_id = current_user.id
    refund.admin_notes = payload.admin_notes

    if not payload.approve:
        refund.status = RefundStatus.REJECTED
        db.commit()
        db.refresh(refund)
        notify(db, refund.requested_by_id, NotificationType.REFUND_UPDATE, "Refund request rejected",
               payload.admin_notes or "Your refund request was not approved.")
        return refund

    refund.status = RefundStatus.APPROVED
    payment = db.get(Payment, refund.payment_id)

    try:
        stripe_refund = stripe_service.create_refund(payment.stripe_payment_intent_id, amount=refund.amount)
        refund.stripe_refund_id = stripe_refund.id
        refund.status = RefundStatus.PROCESSED
        refund.processed_at = datetime.now(timezone.utc)

        payment.status = PaymentStatus.REFUNDED if refund.amount >= payment.amount else PaymentStatus.PARTIALLY_REFUNDED
        db.add(Transaction(payment_id=payment.id, transaction_type="REFUND", amount=refund.amount,
                            status="SUCCEEDED", gateway_reference=stripe_refund.id))
    except StripeServiceError as exc:
        db.commit()
        raise bad_request(f"Refund approved but Stripe processing failed: {exc}")

    db.commit()
    db.refresh(refund)
    notify(db, refund.requested_by_id, NotificationType.REFUND_UPDATE, "Refund processed",
           f"Your refund of {payment.currency.upper()} {refund.amount:.2f} has been processed.")
    log_action(db, current_user.id, "REFUND_PROCESSED", "Refund", refund.id, {"amount": refund.amount})
    return refund
