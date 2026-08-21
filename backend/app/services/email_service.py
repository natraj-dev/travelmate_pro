"""
Transactional email service (registration verification, password reset,
booking confirmations, etc). Uses plain smtplib so no extra provider SDK
is required — swap in SendGrid/SES later by only touching this file.
"""
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

logger = logging.getLogger("travelmate.email")


def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Best-effort send — returns False (and logs) instead of raising, so a
    flaky SMTP provider never breaks a booking or signup flow."""
    if not settings.SMTP_HOST:
        logger.info("SMTP not configured — skipping email to %s: %s", to_email, subject)
        return False

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = to_email
    message.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USER:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], message.as_string())
        return True
    except Exception as exc:  # noqa: BLE001 — never let email failures break the request
        logger.error("Failed to send email to %s: %s", to_email, exc)
        return False


def send_verification_email(to_email: str, first_name: str, token: str) -> None:
    link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    send_email(
        to_email, "Verify your TravelMate Pro account",
        f"<p>Hi {first_name},</p><p>Welcome to TravelMate Pro. Please verify your email:</p>"
        f"<p><a href='{link}'>Verify my email</a></p>",
    )


def send_password_reset_email(to_email: str, first_name: str, token: str) -> None:
    link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    send_email(
        to_email, "Reset your TravelMate Pro password",
        f"<p>Hi {first_name},</p><p>Click below to reset your password (valid 1 hour):</p>"
        f"<p><a href='{link}'>Reset my password</a></p>",
    )


def send_booking_confirmation_email(to_email: str, first_name: str, reference: str, summary: str) -> None:
    send_email(
        to_email, f"Booking confirmed — {reference}",
        f"<p>Hi {first_name},</p><p>Your booking <strong>{reference}</strong> is confirmed.</p>"
        f"<p>{summary}</p>",
    )
