"""Support tickets and customer issue handling."""
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.communication import SupportTicket, SupportTicketMessage
from app.models.enums import TicketStatus, UserRole
from app.schemas.communication import (
    SupportTicketCreate, SupportTicketOut, SupportTicketUpdate, SupportTicketReplyCreate, SupportTicketMessageOut,
)
from app.utils.exceptions import not_found, forbidden
from app.utils.reference import generate_ticket_number
from app.utils.pagination import paginate, Page

router = APIRouter(prefix="/support", tags=["Customer Support"])


@router.post("/tickets", response_model=SupportTicketOut, status_code=201)
def create_ticket(payload: SupportTicketCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = SupportTicket(ticket_number=generate_ticket_number(), customer_id=current_user.id, **payload.model_dump())
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.get("/tickets/mine", response_model=list[SupportTicketOut])
def my_tickets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(SupportTicket)
        .options(joinedload(SupportTicket.replies))
        .filter(SupportTicket.customer_id == current_user.id)
        .order_by(SupportTicket.created_at.desc())
        .all()
    )


@router.get("/tickets", response_model=Page[SupportTicketOut])
def list_all_tickets(status_filter: Optional[TicketStatus] = None, page: int = 1, page_size: int = 20,
                      db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    query = db.query(SupportTicket)
    if status_filter:
        query = query.filter(SupportTicket.status == status_filter)
    query = query.order_by(SupportTicket.created_at.desc())
    items, total, page, page_size, total_pages = paginate(query, page, page_size)
    return Page(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/tickets/{ticket_id}", response_model=SupportTicketOut)
def get_ticket(ticket_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = db.query(SupportTicket).options(joinedload(SupportTicket.replies)).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise not_found("Support ticket")
    if ticket.customer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise forbidden()
    return ticket


@router.put("/tickets/{ticket_id}", response_model=SupportTicketOut)
def update_ticket(ticket_id: int, payload: SupportTicketUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    ticket = db.get(SupportTicket, ticket_id)
    if not ticket:
        raise not_found("Support ticket")
    data = payload.model_dump(exclude_unset=True)
    if data.get("status") in (TicketStatus.RESOLVED, TicketStatus.CLOSED) and ticket.status not in (TicketStatus.RESOLVED, TicketStatus.CLOSED):
        ticket.resolved_at = datetime.now(timezone.utc)
    for field, value in data.items():
        setattr(ticket, field, value)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.post("/tickets/{ticket_id}/replies", response_model=SupportTicketMessageOut, status_code=201)
def reply_to_ticket(ticket_id: int, payload: SupportTicketReplyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = db.get(SupportTicket, ticket_id)
    if not ticket:
        raise not_found("Support ticket")
    if ticket.customer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise forbidden()
    reply = SupportTicketMessage(ticket_id=ticket_id, sender_id=current_user.id, **payload.model_dump())
    db.add(reply)
    if ticket.status == TicketStatus.OPEN and current_user.role == UserRole.ADMIN:
        ticket.status = TicketStatus.IN_PROGRESS
    db.commit()
    db.refresh(reply)
    return reply
