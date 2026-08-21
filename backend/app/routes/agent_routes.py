"""Travel agent management and customer assignments."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import get_current_user, require_roles, require_admin
from app.models.user import User
from app.models.business import TravelAgentProfile, AgentCustomerLink
from app.models.enums import UserRole, VerificationStatus, NotificationType
from app.schemas.business import TravelAgentProfileCreate, TravelAgentProfileOut
from app.schemas.auth import UserOut
from app.schemas.common import Msg
from app.services.notification_service import notify
from app.utils.exceptions import not_found, conflict, forbidden
from app.utils.pagination import paginate, Page
from app.utils.audit import log_action

router = APIRouter(prefix="/agents", tags=["Travel Agent Management"])


def _get_my_agent(db: Session, user: User) -> TravelAgentProfile:
    agent = db.query(TravelAgentProfile).filter(TravelAgentProfile.user_id == user.id).first()
    if not agent:
        raise not_found("Agent profile — register as a travel agent first")
    return agent


@router.post("", response_model=TravelAgentProfileOut, status_code=201)
def register_agent(payload: TravelAgentProfileCreate, db: Session = Depends(get_db),
                    current_user: User = Depends(require_roles(UserRole.TRAVEL_AGENT, UserRole.ADMIN))):
    if db.query(TravelAgentProfile).filter(TravelAgentProfile.user_id == current_user.id).first():
        raise conflict("You already have an agent profile")
    agent = TravelAgentProfile(user_id=current_user.id, **payload.model_dump())
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


@router.get("/me", response_model=TravelAgentProfileOut)
def get_my_agent_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return _get_my_agent(db, current_user)


@router.get("", response_model=Page[TravelAgentProfileOut])
def list_agents(verification_status: VerificationStatus | None = None, page: int = 1, page_size: int = 20,
                 db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    query = db.query(TravelAgentProfile)
    if verification_status:
        query = query.filter(TravelAgentProfile.verification_status == verification_status)
    items, total, page, page_size, total_pages = paginate(query.order_by(TravelAgentProfile.created_at.desc()), page, page_size)
    return Page(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.put("/{agent_id}/verify", response_model=TravelAgentProfileOut)
def verify_agent(agent_id: int, status: VerificationStatus, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    agent = db.get(TravelAgentProfile, agent_id)
    if not agent:
        raise not_found("Agent")
    agent.verification_status = status
    db.commit()
    db.refresh(agent)
    notify(db, agent.user_id, NotificationType.SYSTEM, "Agent verification update",
           f"Your travel agent verification status is now {status.value}.")
    log_action(db, current_user.id, "AGENT_VERIFIED", "TravelAgentProfile", agent.id, {"status": status.value})
    return agent


# ---- Managed customers ----
@router.get("/me/customers", response_model=list[UserOut])
def list_my_customers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    agent = _get_my_agent(db, current_user)
    links = db.query(AgentCustomerLink).filter(AgentCustomerLink.agent_id == agent.id).all()
    customer_ids = [link.customer_id for link in links]
    return db.query(User).filter(User.id.in_(customer_ids)).all() if customer_ids else []


@router.post("/me/customers/{customer_id}", response_model=Msg, status_code=201)
def link_customer(customer_id: int, notes: str = "", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    agent = _get_my_agent(db, current_user)
    customer = db.get(User, customer_id)
    if not customer or customer.role != UserRole.CUSTOMER:
        raise not_found("Customer")
    existing = db.query(AgentCustomerLink).filter(
        AgentCustomerLink.agent_id == agent.id, AgentCustomerLink.customer_id == customer_id
    ).first()
    if existing:
        raise conflict("This customer is already linked to your account")
    db.add(AgentCustomerLink(agent_id=agent.id, customer_id=customer_id, notes=notes))
    db.commit()
    return Msg(message="Customer linked to your agent account")
