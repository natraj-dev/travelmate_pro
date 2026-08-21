"""
Stripe Payment Integration.

Handles Stripe Checkout, PaymentIntents, refunds, and webhook verification.

No raw card information is handled by TravelMate Pro.
"""

import logging

import stripe

from app.config import settings

logger = logging.getLogger("travelmate.stripe")

stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeServiceError(Exception):
    """Raised when a Stripe operation fails."""


def _ensure_configured():
    if not settings.STRIPE_SECRET_KEY:
        raise StripeServiceError("Stripe secret key is not configured.")

    if not settings.STRIPE_SECRET_KEY.startswith(("sk_test_", "sk_live_")):
        raise StripeServiceError("Invalid Stripe secret key configuration.")


def create_payment_intent(
    amount: float,
    currency: str,
    customer_email: str,
    metadata: dict,
    idempotency_key: str | None = None,
):
    _ensure_configured()

    try:
        params = {
            "amount": int(round(amount * 100)),
            "currency": currency.lower(),
            "receipt_email": customer_email,
            "metadata": metadata,
            "automatic_payment_methods": {
                "enabled": True,
            },
        }

        if idempotency_key:
            params["idempotency_key"] = idempotency_key

        return stripe.PaymentIntent.create(**params)

    except stripe.error.StripeError as exc:
        logger.exception("Stripe PaymentIntent creation failed")
        raise StripeServiceError(str(exc)) from exc


def create_checkout_session(
    amount: float,
    currency: str,
    product_name: str,
    customer_email: str,
    success_url: str,
    cancel_url: str,
    metadata: dict,
    idempotency_key: str | None = None,
):
    _ensure_configured()

    try:
        params = {
            "mode": "payment",
            "payment_method_types": ["card"],
            "customer_email": customer_email,
            "line_items": [
                {
                    "price_data": {
                        "currency": currency.lower(),
                        "unit_amount": int(round(amount * 100)),
                        "product_data": {
                            "name": product_name,
                        },
                    },
                    "quantity": 1,
                }
            ],
            "success_url": success_url,
            "cancel_url": cancel_url,
            "metadata": metadata,
        }

        if idempotency_key:
            params["idempotency_key"] = idempotency_key

        return stripe.checkout.Session.create(**params)

    except stripe.error.StripeError as exc:
        logger.exception("Stripe Checkout session creation failed")
        raise StripeServiceError(str(exc)) from exc


def retrieve_checkout_session(session_id: str):
    _ensure_configured()

    try:
        return stripe.checkout.Session.retrieve(session_id)
    except stripe.error.StripeError as exc:
        raise StripeServiceError(str(exc)) from exc


def retrieve_payment_intent(payment_intent_id: str):
    _ensure_configured()

    try:
        return stripe.PaymentIntent.retrieve(payment_intent_id)
    except stripe.error.StripeError as exc:
        raise StripeServiceError(str(exc)) from exc


def create_refund(
    payment_intent_id: str,
    amount: float | None = None,
):
    _ensure_configured()

    try:
        params = {
            "payment_intent": payment_intent_id,
        }

        if amount is not None:
            params["amount"] = int(round(amount * 100))

        return stripe.Refund.create(**params)

    except stripe.error.StripeError as exc:
        logger.exception("Stripe refund failed")
        raise StripeServiceError(str(exc)) from exc


def verify_webhook_signature(
    payload: bytes,
    sig_header: str,
):
    _ensure_configured()

    if not settings.STRIPE_WEBHOOK_SECRET:
        raise StripeServiceError(
            "Stripe webhook secret is not configured."
        )

    try:
        return stripe.Webhook.construct_event(
            payload,
            sig_header,
            settings.STRIPE_WEBHOOK_SECRET,
        )

    except ValueError as exc:
        logger.warning("Invalid Stripe webhook payload")
        raise StripeServiceError(
            "Invalid webhook payload"
        ) from exc

    except stripe.error.SignatureVerificationError as exc:
        logger.warning("Invalid Stripe webhook signature")
        raise StripeServiceError(
            "Invalid webhook signature"
        ) from exc
