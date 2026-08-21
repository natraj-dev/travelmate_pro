"""
Checkout, billing, and Stripe payment handling.
"""

import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.payment import Payment, Transaction
from app.models.hotel import HotelBooking
from app.models.tour import TourBooking
from app.models.booking import ActivityBooking, TransportBooking
from app.models.enums import (
    PaymentStatus,
    BookingStatus,
    NotificationType,
    UserRole,
)
from app.schemas.payment import (
    CheckoutRequest,
    CheckoutResponse,
    PaymentOut,
)
from app.services import stripe_service
from app.services.stripe_service import StripeServiceError
from app.services.notification_service import notify
from app.services.email_service import send_booking_confirmation_email
from app.config import settings
from app.utils.exceptions import (
    not_found,
    forbidden,
    bad_request,
)
from app.utils.audit import log_action


router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)


_BOOKING_MODELS = {
    "HOTEL": (HotelBooking, "hotel_booking_id"),
    "TOUR": (TourBooking, "tour_booking_id"),
    "ACTIVITY": (ActivityBooking, "activity_booking_id"),
    "TRANSPORT": (TransportBooking, "transport_booking_id"),
}


def _get_booking(
    db: Session,
    booking_type: str,
    booking_id: int,
):
    booking_type = booking_type.upper()

    model_fk = _BOOKING_MODELS.get(booking_type)

    if not model_fk:
        raise bad_request(
            "booking_type must be one of HOTEL, TOUR, ACTIVITY, TRANSPORT"
        )

    model, fk_name = model_fk

    booking = db.get(model, booking_id)

    if not booking:
        raise not_found("Booking")

    return booking, fk_name


def _payment_already_recorded(
    db: Session,
    payment_id: int,
    event_type: str,
) -> bool:
    """
    Prevent duplicate CHARGE transaction records when
    Stripe retries the same webhook.
    """

    return (
        db.query(Transaction)
        .filter(
            Transaction.payment_id == payment_id,
            Transaction.transaction_type == "CHARGE",
            Transaction.status == "SUCCEEDED",
        )
        .first()
        is not None
    )


def _confirm_booking(
    db: Session,
    payment: Payment,
):
    """
    Confirm whichever booking belongs to the payment.
    """

    booking_entries = [
        ("hotel_booking_id", HotelBooking),
        ("tour_booking_id", TourBooking),
        ("activity_booking_id", ActivityBooking),
        ("transport_booking_id", TransportBooking),
    ]

    for fk_name, model in booking_entries:
        booking_id = getattr(payment, fk_name)

        if not booking_id:
            continue

        booking = db.get(model, booking_id)

        if not booking:
            continue

        if booking.status != BookingStatus.CONFIRMED:
            booking.status = BookingStatus.CONFIRMED

        customer = db.get(User, booking.customer_id)

        notify(
            db,
            booking.customer_id,
            NotificationType.PAYMENT_SUCCESS,
            "Payment successful",
            (
                f"Your payment for booking "
                f"{booking.booking_reference} was successful."
            ),
            link="/app/bookings",
        )

        notify(
            db,
            booking.customer_id,
            NotificationType.BOOKING_CONFIRMATION,
            "Booking confirmed",
            (
                f"Booking {booking.booking_reference} "
                f"is now confirmed."
            ),
            link="/app/bookings",
        )

        if customer:
            try:
                send_booking_confirmation_email(
                    customer.email,
                    customer.first_name,
                    booking.booking_reference,
                    (
                        f"Total paid: "
                        f"{payment.currency.upper()} "
                        f"{payment.amount:.2f}"
                    ),
                )
            except Exception:
                # Email failure must never undo a successful payment.
                pass

        break


@router.post(
    "/checkout",
    response_model=CheckoutResponse,
)
def create_checkout(
    payload: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a Stripe Checkout Session or PaymentIntent.
    """

    booking_type = payload.booking_type.upper()

    booking, fk_name = _get_booking(
        db,
        booking_type,
        payload.booking_id,
    )

    if booking.customer_id != current_user.id:
        raise forbidden()

    if booking.status != BookingStatus.PENDING:
        raise bad_request(
            f"This booking is {booking.status.value.lower()} "
            "and cannot be paid for again"
        )

    payment = (
        db.query(Payment)
        .filter(
            getattr(Payment, fk_name) == booking.id,
            Payment.customer_id == current_user.id,
        )
        .first()
    )

    if payment and payment.status == PaymentStatus.SUCCEEDED:
        raise bad_request(
            "This booking has already been paid for"
        )

    if not payment:
        payment = Payment(
            customer_id=current_user.id,
            amount=booking.total_amount,
            currency=settings.STRIPE_CURRENCY.lower(),
            **{fk_name: booking.id},
        )

        db.add(payment)
        db.flush()

    payment.amount = booking.total_amount
    payment.currency = settings.STRIPE_CURRENCY.lower()

    if not payment.idempotency_key:
        payment.idempotency_key = uuid.uuid4().hex

    db.commit()
    db.refresh(payment)

    metadata = {
        "payment_id": str(payment.id),
        "booking_type": booking_type,
        "booking_id": str(booking.id),
        "customer_id": str(current_user.id),
    }

    try:
        if payload.payment_method == "payment_intent":
            intent = stripe_service.create_payment_intent(
                amount=booking.total_amount,
                currency=settings.STRIPE_CURRENCY,
                customer_email=current_user.email,
                metadata=metadata,
                idempotency_key=payment.idempotency_key,
            )

            payment.stripe_payment_intent_id = intent.id

            db.commit()

            return CheckoutResponse(
                payment_id=payment.id,
                client_secret=intent.client_secret,
                amount=payment.amount,
                currency=payment.currency,
            )

        session = stripe_service.create_checkout_session(
            amount=booking.total_amount,
            currency=settings.STRIPE_CURRENCY,
            product_name=(
                f"TravelMate Pro — "
                f"{booking_type.title()} Booking"
            ),
            customer_email=current_user.email,
            success_url=(
                f"{settings.FRONTEND_URL}"
                f"/payment/success"
                f"?session_id={{CHECKOUT_SESSION_ID}}"
                f"&payment_id={payment.id}"
            ),
            cancel_url=(
                f"{settings.FRONTEND_URL}"
                f"/payment/cancel"
                f"?payment_id={payment.id}"
            ),
            metadata=metadata,
            idempotency_key=payment.idempotency_key,
        )

        payment.stripe_checkout_session_id = session.id

        db.commit()

        return CheckoutResponse(
            payment_id=payment.id,
            checkout_url=session.url,
            amount=payment.amount,
            currency=payment.currency,
        )

    except StripeServiceError as exc:
        db.rollback()
        raise bad_request(str(exc))


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Stripe webhook.

    Stripe is the source of truth for payment completion.
    """

    payload_bytes = await request.body()

    sig_header = request.headers.get(
        "stripe-signature",
        "",
    )

    try:
        event = stripe_service.verify_webhook_signature(
            payload_bytes,
            sig_header,
        )
    except StripeServiceError as exc:
        raise bad_request(str(exc))

    event_type = event["type"]
    data_object = event["data"]["object"]

    metadata = data_object.get("metadata", {}) or {}

    payment_id = metadata.get("payment_id")

    if not payment_id:
        return {"received": True}

    try:
        payment_id = int(payment_id)
    except (TypeError, ValueError):
        return {"received": True}

    payment = db.get(
        Payment,
        payment_id,
    )

    if not payment:
        return {"received": True}

    # ---------------------------------------------------------
    # SUCCESS
    # ---------------------------------------------------------

    if event_type in (
        "checkout.session.completed",
        "payment_intent.succeeded",
    ):
        if payment.status == PaymentStatus.SUCCEEDED:
            return {"received": True}

        payment.status = PaymentStatus.SUCCEEDED
        payment.paid_at = datetime.now(timezone.utc)

        payment_intent_id = (
            data_object.get("payment_intent")
            or data_object.get("id")
        )

        if payment_intent_id:
            payment.stripe_payment_intent_id = (
                payment_intent_id
            )

        if not _payment_already_recorded(
            db,
            payment.id,
            event_type,
        ):
            db.add(
                Transaction(
                    payment_id=payment.id,
                    transaction_type="CHARGE",
                    amount=payment.amount,
                    status="SUCCEEDED",
                    gateway_reference=(
                        payment.stripe_payment_intent_id
                    ),
                    raw_response=json.dumps(
                        data_object
                    )[:5000],
                )
            )

        _confirm_booking(
            db,
            payment,
        )

        db.commit()

    # ---------------------------------------------------------
    # FAILURE
    # ---------------------------------------------------------

    elif event_type in (
        "payment_intent.payment_failed",
        "checkout.session.async_payment_failed",
    ):
        payment.status = PaymentStatus.FAILED

        last_error = data_object.get(
            "last_payment_error"
        )

        if isinstance(last_error, dict):
            payment.failure_reason = (
                last_error.get("message")
                or "Payment failed"
            )
        else:
            payment.failure_reason = "Payment failed"

        db.add(
            Transaction(
                payment_id=payment.id,
                transaction_type="CHARGE",
                amount=payment.amount,
                status="FAILED",
                gateway_reference=(
                    data_object.get("id")
                ),
                raw_response=json.dumps(
                    data_object
                )[:5000],
            )
        )

        notify(
            db,
            payment.customer_id,
            NotificationType.PAYMENT_FAILURE,
            "Payment failed",
            (
                "Your recent payment attempt was "
                "unsuccessful. Please try again."
            ),
            link="/app/bookings",
        )

        db.commit()

    return {"received": True}


@router.get(
    "/mine",
    response_model=list[PaymentOut],
)
def my_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Payment)
        .filter(
            Payment.customer_id == current_user.id
        )
        .order_by(Payment.created_at.desc())
        .all()
    )


@router.get("/confirm-checkout", response_model=PaymentOut)
def confirm_checkout(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Confirm a Stripe Checkout session after returning from Stripe."""

    try:
        session = stripe_service.retrieve_checkout_session(session_id)
    except StripeServiceError as exc:
        raise bad_request(str(exc))

    metadata = session.get("metadata", {}) or {}
    payment_id = metadata.get("payment_id")

    if not payment_id:
        raise bad_request("Payment information not found in Stripe session")

    payment = db.get(Payment, int(payment_id))

    if not payment:
        raise not_found("Payment")

    if payment.customer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise forbidden()

    # If webhook already processed it, simply return it.
    if payment.status == PaymentStatus.SUCCEEDED:
        return payment

    # Stripe Checkout payment status
    if session.payment_status == "paid":
        payment.status = PaymentStatus.SUCCEEDED
        payment.paid_at = datetime.now(timezone.utc)

        payment.stripe_checkout_session_id = session.id

        payment_intent_id = session.payment_intent

        if payment_intent_id:
            payment.stripe_payment_intent_id = payment_intent_id

        db.add(
            Transaction(
                payment_id=payment.id,
                transaction_type="CHARGE",
                amount=payment.amount,
                status="SUCCEEDED",
                gateway_reference=payment_intent_id or session.id,
                raw_response=json.dumps(dict(session))[:5000],
            )
        )

        for fk_name, model in [
            ("hotel_booking_id", HotelBooking),
            ("tour_booking_id", TourBooking),
            ("activity_booking_id", ActivityBooking),
            ("transport_booking_id", TransportBooking),
        ]:
            booking_id = getattr(payment, fk_name)

            if booking_id:
                booking = db.get(model, booking_id)

                if booking:
                    booking.status = BookingStatus.CONFIRMED

        db.commit()
        db.refresh(payment)

    return payment


@router.get(
    "/{payment_id}",
    response_model=PaymentOut,
)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment = db.get(
        Payment,
        payment_id,
    )

    if not payment:
        raise not_found("Payment")

    if (
        payment.customer_id != current_user.id
        and current_user.role != UserRole.ADMIN
    ):
        raise forbidden()

    return payment


@router.get(
    "/{payment_id}/status",
    response_model=PaymentOut,
)
def check_payment_status(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Check payment status after returning from Stripe Checkout.
    """

    payment = db.get(
        Payment,
        payment_id,
    )

    if not payment:
        raise not_found("Payment")

    if (
        payment.customer_id != current_user.id
        and current_user.role != UserRole.ADMIN
    ):
        raise forbidden()

    if (
        payment.status == PaymentStatus.PENDING
        and payment.stripe_payment_intent_id
    ):
        try:
            intent = stripe_service.retrieve_payment_intent(
                payment.stripe_payment_intent_id
            )

            if intent.status == "succeeded":
                payment.status = PaymentStatus.SUCCEEDED
                payment.paid_at = datetime.now(timezone.utc)

                _confirm_booking(
                    db,
                    payment,
                )

                db.commit()

        except StripeServiceError:
            pass

    return payment
