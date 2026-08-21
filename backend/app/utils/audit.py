"""Helper to write an AuditLog row without cluttering route handlers."""
import json
from sqlalchemy.orm import Session

from app.models.user import AuditLog


def log_action(db: Session, user_id, action: str, entity_type: str = None,
                entity_id: int = None, details: dict = None, ip_address: str = None) -> None:
    entry = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=json.dumps(details) if details else None,
        ip_address=ip_address,
    )
    db.add(entry)
    db.commit()
