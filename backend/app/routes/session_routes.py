"""Session lifecycle and refresh-token handling."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, UserSession
from app.schemas.auth import SessionOut
from app.schemas.common import Msg
from app.utils.exceptions import not_found, forbidden

router = APIRouter(prefix="/sessions", tags=["Session Management"])


@router.get("", response_model=list[SessionOut])
def list_my_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(UserSession)
        .filter(UserSession.user_id == current_user.id, UserSession.is_active == True)
        .order_by(UserSession.last_active_at.desc())
        .all()
    )


@router.delete("/{session_id}", response_model=Msg)
def revoke_session(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.get(UserSession, session_id)
    if not session:
        raise not_found("Session")
    if session.user_id != current_user.id:
        raise forbidden()
    session.is_active = False
    db.commit()
    return Msg(message="Session revoked")
