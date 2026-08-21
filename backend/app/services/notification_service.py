"""
Notification System — creates in-app notifications.
Kept as a thin wrapper so routes stay declarative: notify(db, user_id, ...).
"""
from sqlalchemy.orm import Session

from app.models.communication import Notification
from app.models.enums import NotificationType


def notify(db: Session, user_id: int, type_: NotificationType, title: str, message: str, link: str | None = None) -> Notification:
    notification = Notification(user_id=user_id, type=type_, title=title, message=message, link=link)
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification
