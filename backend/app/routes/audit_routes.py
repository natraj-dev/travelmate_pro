"""Platform audit trails and security events."""
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app.models.user import User, AuditLog, SecurityLog
from app.schemas.audit import AuditLogOut, SecurityLogOut
from app.utils.pagination import paginate, Page

router = APIRouter(prefix="/audit", tags=["Audit & Security Monitoring"])


@router.get("/logs", response_model=Page[AuditLogOut])
def list_audit_logs(action: Optional[str] = None, user_id: Optional[int] = None, entity_type: Optional[str] = None,
                     page: int = 1, page_size: int = 30, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    query = query.order_by(AuditLog.created_at.desc())
    items, total, page, page_size, total_pages = paginate(query, page, page_size)
    return Page(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/security-logs", response_model=Page[SecurityLogOut])
def list_security_logs(event_type: Optional[str] = None, user_id: Optional[int] = None,
                         page: int = 1, page_size: int = 30, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    query = db.query(SecurityLog)
    if event_type:
        query = query.filter(SecurityLog.event_type == event_type)
    if user_id:
        query = query.filter(SecurityLog.user_id == user_id)
    query = query.order_by(SecurityLog.created_at.desc())
    items, total, page, page_size, total_pages = paginate(query, page, page_size)
    return Page(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/api-activity-summary")
def api_activity_summary(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    from sqlalchemy import func
    action_counts = db.query(AuditLog.action, func.count(AuditLog.id)).group_by(AuditLog.action).all()
    event_counts = db.query(SecurityLog.event_type, func.count(SecurityLog.id)).group_by(SecurityLog.event_type).all()
    return {
        "audit_actions": {a: c for a, c in action_counts},
        "security_events": {e: c for e, c in event_counts},
    }
