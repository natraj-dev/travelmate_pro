"""Customer leads and sales pipeline tracking."""
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.business import TravelAgentProfile, Lead
from app.models.enums import LeadStatus
from app.schemas.business import LeadCreate, LeadUpdate, LeadOut
from app.schemas.common import Msg
from app.utils.exceptions import not_found, forbidden

router = APIRouter(prefix="/leads", tags=["Customer Lead Management"])


def _get_my_agent(db: Session, user: User) -> TravelAgentProfile:
    agent = db.query(TravelAgentProfile).filter(TravelAgentProfile.user_id == user.id).first()
    if not agent:
        raise not_found("Agent profile — register as a travel agent first")
    return agent


@router.get("", response_model=list[LeadOut])
def list_leads(status_filter: Optional[LeadStatus] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    agent = _get_my_agent(db, current_user)
    query = db.query(Lead).filter(Lead.agent_id == agent.id)
    if status_filter:
        query = query.filter(Lead.status == status_filter)
    return query.order_by(Lead.created_at.desc()).all()


@router.post("", response_model=LeadOut, status_code=201)
def create_lead(payload: LeadCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    agent = _get_my_agent(db, current_user)
    lead = Lead(agent_id=agent.id, source=payload.source or "MANUAL", **payload.model_dump(exclude={"source"}))
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.get("/{lead_id}", response_model=LeadOut)
def get_lead(lead_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    agent = _get_my_agent(db, current_user)
    lead = db.get(Lead, lead_id)
    if not lead or lead.agent_id != agent.id:
        raise not_found("Lead")
    return lead


@router.put("/{lead_id}", response_model=LeadOut)
def update_lead(lead_id: int, payload: LeadUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    agent = _get_my_agent(db, current_user)
    lead = db.get(Lead, lead_id)
    if not lead or lead.agent_id != agent.id:
        raise not_found("Lead")
    data = payload.model_dump(exclude_unset=True)
    if data.get("status") == LeadStatus.CONVERTED and lead.status != LeadStatus.CONVERTED:
        lead.converted_at = datetime.now(timezone.utc)
    for field, value in data.items():
        setattr(lead, field, value)
    db.commit()
    db.refresh(lead)
    return lead


@router.delete("/{lead_id}", response_model=Msg)
def delete_lead(lead_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    agent = _get_my_agent(db, current_user)
    lead = db.get(Lead, lead_id)
    if not lead or lead.agent_id != agent.id:
        raise not_found("Lead")
    db.delete(lead)
    db.commit()
    return Msg(message="Lead deleted")
