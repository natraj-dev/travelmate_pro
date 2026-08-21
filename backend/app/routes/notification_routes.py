"""Push and in-app notification delivery and tracking."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.communication import Notification
from app.schemas.communication import NotificationOut
from app.schemas.common import Msg
from app.utils.exceptions import not_found, forbidden
from app.utils.pagination import paginate, Page

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=Page[NotificationOut])
def list_notifications(unread_only: bool = False, page: int = 1, page_size: int = 20,
                        db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    query = query.order_by(Notification.created_at.desc())
    items, total, page, page_size, total_pages = paginate(query, page, page_size)
    return Page(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/unread-count")
def unread_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read == False).count()
    return {"unread_count": count}


@router.put("/{notification_id}/read", response_model=NotificationOut)
def mark_read(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notification = db.get(Notification, notification_id)
    if not notification:
        raise not_found("Notification")
    if notification.user_id != current_user.id:
        raise forbidden()
    notification.is_read = True
    notification.read_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(notification)
    return notification


@router.put("/read-all", response_model=Msg)
def mark_all_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read == False).update(
        {Notification.is_read: True, Notification.read_at: datetime.now(timezone.utc)}
    )
    db.commit()
    return Msg(message="All notifications marked as read")


@router.delete("/{notification_id}", response_model=Msg)
def delete_notification(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notification = db.get(Notification, notification_id)
    if not notification:
        raise not_found("Notification")
    if notification.user_id != current_user.id:
        raise forbidden()
    db.delete(notification)
    db.commit()
    return Msg(message="Notification deleted")
