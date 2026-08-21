"""Travel insurance plans and policy management."""
import json
from datetime import timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.document import InsurancePlan, InsurancePolicy
from app.schemas.document import InsurancePlanCreate, InsurancePlanOut, InsurancePurchaseRequest, InsurancePolicyOut
from app.utils.exceptions import not_found
from app.utils.reference import generate_policy_number

router = APIRouter(prefix="/insurance", tags=["Travel Insurance"])


@router.get("/plans", response_model=list[InsurancePlanOut])
def list_plans(db: Session = Depends(get_db)):
    return db.query(InsurancePlan).filter(InsurancePlan.is_active == True).all()


@router.post("/plans", response_model=InsurancePlanOut, status_code=201)
def create_plan(payload: InsurancePlanCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    data = payload.model_dump()
    coverage = data.pop("coverage_details", None)
    plan = InsurancePlan(coverage_details=json.dumps(coverage) if coverage else None, **data)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.post("/purchase", response_model=InsurancePolicyOut, status_code=201)
def purchase_policy(payload: InsurancePurchaseRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    plan = db.get(InsurancePlan, payload.plan_id)
    if not plan or not plan.is_active:
        raise not_found("Insurance plan")

    policy = InsurancePolicy(
        policy_number=generate_policy_number(), user_id=current_user.id, plan_id=plan.id,
        start_date=payload.start_date, end_date=payload.start_date + timedelta(days=plan.duration_days),
        linked_booking_type=payload.linked_booking_type, linked_booking_id=payload.linked_booking_id,
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


@router.get("/policies/mine", response_model=list[InsurancePolicyOut])
def my_policies(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(InsurancePolicy).filter(InsurancePolicy.user_id == current_user.id).order_by(InsurancePolicy.created_at.desc()).all()
