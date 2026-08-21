"""Payment transactions and financial history."""
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.payment import Payment, Transaction
from app.schemas.payment import TransactionOut, PaymentOut
from app.utils.exceptions import not_found, forbidden
from app.utils.pagination import paginate, Page

router = APIRouter(prefix="/transactions", tags=["Payment & Transaction Management"])


@router.get("", response_model=Page[PaymentOut])
def list_all_payments(status_filter: Optional[str] = None, page: int = 1, page_size: int = 20,
                       db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    """Admin-wide payment history / financial log ()."""
    query = db.query(Payment)
    if status_filter:
        query = query.filter(Payment.status == status_filter)
    query = query.order_by(Payment.created_at.desc())
    items, total, page, page_size, total_pages = paginate(query, page, page_size)
    return Page(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/payment/{payment_id}", response_model=list[TransactionOut])
def get_payment_transactions(payment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    payment = db.get(Payment, payment_id)
    if not payment:
        raise not_found("Payment")
    if payment.customer_id != current_user.id and current_user.role.value != "ADMIN":
        raise forbidden()
    return db.query(Transaction).filter(Transaction.payment_id == payment_id).order_by(Transaction.created_at.desc()).all()


@router.get("/search", response_model=Page[PaymentOut])
def search_transactions(reference: Optional[str] = None, min_amount: Optional[float] = None,
                         max_amount: Optional[float] = None, page: int = 1, page_size: int = 20,
                         db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    query = db.query(Payment)
    if reference:
        query = query.filter(
            (Payment.stripe_payment_intent_id.ilike(f"%{reference}%")) |
            (Payment.stripe_checkout_session_id.ilike(f"%{reference}%"))
        )
    if min_amount:
        query = query.filter(Payment.amount >= min_amount)
    if max_amount:
        query = query.filter(Payment.amount <= max_amount)
    query = query.order_by(Payment.created_at.desc())
    items, total, page, page_size, total_pages = paginate(query, page, page_size)
    return Page(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)
