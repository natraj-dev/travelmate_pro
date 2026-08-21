"""In-app messaging between users and staff."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.communication import Message
from app.models.enums import NotificationType, UserRole
from app.schemas.communication import (
    MessageCreate,
    MessageOut,
    ConversationSummary,
    MessageContact,
)
from app.schemas.common import Msg
from app.services.notification_service import notify
from app.utils.exceptions import not_found, forbidden

router = APIRouter(prefix="/messages", tags=["In-App Messaging"])


# ---------------------------------------------------------------------------
# Messaging permissions
# ---------------------------------------------------------------------------

MESSAGEABLE_ROLES = {
    UserRole.CUSTOMER: {
        UserRole.HOTEL_MANAGER,
        UserRole.TOUR_OPERATOR,
        UserRole.TRAVEL_AGENT,
        UserRole.ADMIN,
    },
    UserRole.HOTEL_MANAGER: {
        UserRole.CUSTOMER,
        UserRole.TRAVEL_AGENT,
        UserRole.ADMIN,
    },
    UserRole.TOUR_OPERATOR: {
        UserRole.CUSTOMER,
        UserRole.TRAVEL_AGENT,
        UserRole.ADMIN,
    },
    UserRole.TRAVEL_AGENT: {
        UserRole.CUSTOMER,
        UserRole.HOTEL_MANAGER,
        UserRole.TOUR_OPERATOR,
        UserRole.ADMIN,
    },
    UserRole.ADMIN: {
        UserRole.CUSTOMER,
        UserRole.HOTEL_MANAGER,
        UserRole.TOUR_OPERATOR,
        UserRole.TRAVEL_AGENT,
    },
}


def _thread_key(user_a: int, user_b: int) -> str:
    """Create a deterministic thread key for two users."""
    lo, hi = sorted([user_a, user_b])
    return f"{lo}-{hi}"


def _can_message(sender: User, recipient: User) -> bool:
    """Check whether sender is allowed to message recipient."""
    if sender.id == recipient.id:
        return False

    allowed_roles = MESSAGEABLE_ROLES.get(sender.role, set())

    return recipient.role in allowed_roles


# ---------------------------------------------------------------------------
# Available contacts
# ---------------------------------------------------------------------------

@router.get(
    "/contacts",
    response_model=list[MessageContact],
)
def list_contacts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return users that the current user is allowed to start
    a new conversation with.
    """

    allowed_roles = MESSAGEABLE_ROLES.get(current_user.role, set())

    if not allowed_roles:
        return []

    contacts = (
        db.query(User)
        .filter(
            User.id != current_user.id,
            User.is_active.is_(True),
            User.role.in_(allowed_roles),
        )
        .order_by(User.first_name, User.last_name)
        .all()
    )

    return [
        MessageContact(
            id=user.id,
            name=user.full_name(),
            email=user.email,
            role=user.role.value if hasattr(
                user.role, "value") else str(user.role),
        )
        for user in contacts
    ]


# ---------------------------------------------------------------------------
# Existing conversations
# ---------------------------------------------------------------------------

@router.get(
    "/conversations",
    response_model=list[ConversationSummary],
)
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return all existing conversations for the current user.
    """

    threads = (
        db.query(Message.thread_key)
        .filter(
            or_(
                Message.sender_id == current_user.id,
                Message.recipient_id == current_user.id,
            )
        )
        .distinct()
        .all()
    )

    summaries = []

    for (thread_key,) in threads:

        last_msg = (
            db.query(Message)
            .filter(Message.thread_key == thread_key)
            .order_by(Message.created_at.desc(), Message.id.desc())
            .first()
        )

        if not last_msg:
            continue

        # Determine the other participant.
        if last_msg.sender_id == current_user.id:
            other_id = last_msg.recipient_id
        else:
            other_id = last_msg.sender_id

        other_user = db.get(User, other_id)

        if not other_user:
            continue

        unread = (
            db.query(Message)
            .filter(
                Message.thread_key == thread_key,
                Message.recipient_id == current_user.id,
                Message.is_read.is_(False),
            )
            .count()
        )

        summaries.append(
            ConversationSummary(
                other_user_id=other_user.id,
                other_user_name=other_user.full_name(),
                other_user_role=(
                    other_user.role.value
                    if hasattr(other_user.role, "value")
                    else str(other_user.role)
                ),
                last_message=last_msg.content,
                last_message_at=last_msg.created_at,
                unread_count=unread,
            )
        )

    return sorted(
        summaries,
        key=lambda item: item.last_message_at,
        reverse=True,
    )


# ---------------------------------------------------------------------------
# Get conversation thread
# ---------------------------------------------------------------------------

@router.get(
    "/thread/{other_user_id}",
    response_model=list[MessageOut],
)
def get_thread(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return the complete conversation between the current user
    and another allowed user.
    """

    if other_user_id == current_user.id:
        raise forbidden()

    other_user = db.get(User, other_user_id)

    if not other_user:
        raise not_found("User")

    if not _can_message(current_user, other_user):
        raise forbidden()

    key = _thread_key(current_user.id, other_user_id)

    messages = (
        db.query(Message)
        .filter(Message.thread_key == key)
        .order_by(Message.created_at.asc(), Message.id.asc())
        .all()
    )

    # Mark incoming messages as read.
    (
        db.query(Message)
        .filter(
            Message.thread_key == key,
            Message.recipient_id == current_user.id,
            Message.is_read.is_(False),
        )
        .update(
            {
                Message.is_read: True,
                Message.read_at: datetime.now(timezone.utc),
            },
            synchronize_session=False,
        )
    )

    db.commit()

    return messages


# ---------------------------------------------------------------------------
# Send message
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=MessageOut,
    status_code=201,
)
def send_message(
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send a message to an allowed user.

    The message is committed independently from the notification.
    Therefore a notification failure cannot make an already-sent
    message appear as failed.
    """

    if not payload.content or not payload.content.strip():
        raise forbidden()

    if payload.recipient_id == current_user.id:
        raise forbidden()

    recipient = db.get(User, payload.recipient_id)

    if not recipient:
        raise not_found("Recipient")

    if not recipient.is_active:
        raise forbidden()

    if not _can_message(current_user, recipient):
        raise forbidden()

    message = Message(
        sender_id=current_user.id,
        recipient_id=recipient.id,
        thread_key=_thread_key(
            current_user.id,
            recipient.id,
        ),
        content=payload.content.strip(),
        attachment_url=payload.attachment_url,
    )

    # First save the actual message.
    db.add(message)
    db.commit()
    db.refresh(message)

    # Notification is secondary.
    # If notification fails, the message must still be successful.
    try:
        notify(
            db,
            recipient.id,
            NotificationType.MESSAGE,
            f"New message from {current_user.full_name()}",
            message.content[:120],
            link="/messages",
        )
    except Exception:
        db.rollback()

    return message


# ---------------------------------------------------------------------------
# Delete message
# ---------------------------------------------------------------------------

@router.delete(
    "/{message_id}",
    response_model=Msg,
)
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a message sent by the current user."""

    message = db.get(Message, message_id)

    if not message:
        raise not_found("Message")

    if message.sender_id != current_user.id:
        raise forbidden()

    db.delete(message)
    db.commit()

    return Msg(message="Message deleted")
