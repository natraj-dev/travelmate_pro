"""Authentication, login, and session access flows."""
import jwt
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.dependencies import get_current_user
from app.models.user import User, UserSession, SecurityLog
from app.models.enums import UserRole
from app.security import (
    hash_password, verify_password, create_access_token, create_refresh_token,
    create_email_verification_token, create_password_reset_token, decode_token,
)
from app.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse, RefreshRequest, UserOut,
    ForgotPasswordRequest, ResetPasswordRequest, VerifyEmailRequest, ChangePasswordRequest,
)
from app.schemas.common import Msg
from app.services.email_service import send_verification_email, send_password_reset_email
from app.utils.exceptions import bad_request, conflict
from app.utils.audit import log_action

router = APIRouter(prefix="/auth", tags=["Authentication"])
limiter = Limiter(key_func=get_remote_address)


def _issue_tokens(db: Session, user: User, request: Request) -> TokenResponse:
    import uuid
    session_id = uuid.uuid4().hex
    refresh_token = create_refresh_token(user.id, session_id)
    access_token = create_access_token(user.id, user.role.value)

    session = UserSession(
        user_id=user.id,
        session_token=session_id,
        device_info=request.headers.get("user-agent", "Unknown device")[:255],
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent", "")[:255],
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(session)
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    return TokenResponse(access_token=access_token, refresh_token=refresh_token, user=UserOut.model_validate(user))


@router.post("/register", response_model=TokenResponse, status_code=201)
@limiter.limit(settings.RATE_LIMIT_AUTH)
def register(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise conflict("An account with this email already exists")

    if payload.role == UserRole.ADMIN:
        raise bad_request("Admin accounts cannot be created through public registration")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone=payload.phone,
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_email_verification_token(user.id)
    send_verification_email(user.email, user.first_name, token)
    log_action(db, user.id, "USER_REGISTERED", "User", user.id)

    return _issue_tokens(db, user, request)


@router.post("/login", response_model=TokenResponse)
@limiter.limit(settings.RATE_LIMIT_AUTH)
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        db.add(SecurityLog(
            user_id=user.id if user else None,
            event_type="LOGIN_FAILED",
            description=f"Failed login attempt for {payload.email}",
            ip_address=request.client.host if request.client else None,
        ))
        db.commit()
        raise bad_request("Incorrect email or password")

    if not user.is_active:
        raise bad_request("This account has been deactivated. Please contact support.")

    db.add(SecurityLog(user_id=user.id, event_type="LOGIN_SUCCESS",
                        ip_address=request.client.host if request.client else None))
    db.commit()

    return _issue_tokens(db, user, request)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(request: Request, payload: RefreshRequest, db: Session = Depends(get_db)):
    try:
        claims = decode_token(payload.refresh_token)
    except jwt.PyJWTError:
        raise bad_request("Invalid or expired refresh token")

    if claims.get("type") != "refresh":
        raise bad_request("Invalid token type")

    session = db.query(UserSession).filter(UserSession.session_token == claims.get("sid")).first()
    if not session or not session.is_active or session.expires_at < datetime.now(timezone.utc):
        raise bad_request("Session has expired. Please log in again.")

    user = db.get(User, int(claims["sub"]))
    if not user or not user.is_active:
        raise bad_request("Account is no longer active")

    # Rotate: invalidate old session, issue a brand new one.
    session.is_active = False
    db.commit()

    return _issue_tokens(db, user, request)


@router.post("/logout", response_model=Msg)
def logout(payload: RefreshRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        claims = decode_token(payload.refresh_token)
        session = db.query(UserSession).filter(UserSession.session_token == claims.get("sid")).first()
        if session and session.user_id == current_user.id:
            session.is_active = False
            db.commit()
    except jwt.PyJWTError:
        pass
    return Msg(message="Logged out successfully")


@router.post("/logout-all", response_model=Msg)
def logout_all_devices(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(UserSession).filter(UserSession.user_id == current_user.id, UserSession.is_active == True).update(
        {UserSession.is_active: False}
    )
    db.commit()
    log_action(db, current_user.id, "LOGOUT_ALL_DEVICES", "User", current_user.id)
    return Msg(message="Logged out from all devices")


@router.post("/forgot-password", response_model=Msg)
@limiter.limit(settings.RATE_LIMIT_AUTH)
def forgot_password(request: Request, payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        token = create_password_reset_token(user.id)
        send_password_reset_email(user.email, user.first_name, token)
    # Always the same response — never reveal whether an email exists.
    return Msg(message="If an account exists for this email, a reset link has been sent")


@router.post("/reset-password", response_model=Msg)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        claims = decode_token(payload.token)
    except jwt.PyJWTError:
        raise bad_request("This reset link is invalid or has expired")

    if claims.get("type") != "password_reset":
        raise bad_request("Invalid token type")

    user = db.get(User, int(claims["sub"]))
    if not user:
        raise bad_request("Account not found")

    user.password_hash = hash_password(payload.new_password)
    db.query(UserSession).filter(UserSession.user_id == user.id).update({UserSession.is_active: False})
    db.commit()
    log_action(db, user.id, "PASSWORD_RESET", "User", user.id)
    return Msg(message="Password has been reset successfully. Please log in with your new password.")


@router.post("/verify-email", response_model=Msg)
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    try:
        claims = decode_token(payload.token)
    except jwt.PyJWTError:
        raise bad_request("This verification link is invalid or has expired")

    if claims.get("type") != "email_verify":
        raise bad_request("Invalid token type")

    user = db.get(User, int(claims["sub"]))
    if not user:
        raise bad_request("Account not found")

    user.is_verified = True
    db.commit()
    return Msg(message="Email verified successfully")


@router.post("/resend-verification", response_model=Msg)
def resend_verification(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.is_verified:
        return Msg(message="Your email is already verified")
    token = create_email_verification_token(current_user.id)
    send_verification_email(current_user.email, current_user.first_name, token)
    return Msg(message="Verification email sent")


@router.post("/change-password", response_model=Msg)
def change_password(payload: ChangePasswordRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise bad_request("Current password is incorrect")
    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    log_action(db, current_user.id, "PASSWORD_CHANGED", "User", current_user.id)
    return Msg(message="Password changed successfully")


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
