"""Tour operator profiles and operational setup."""
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_roles, require_admin
from app.models.user import User
from app.models.tour import TourOperator, TourGuide
from app.models.enums import UserRole, VerificationStatus, NotificationType
from app.schemas.tour import TourOperatorCreate, TourOperatorOut, TourGuideCreate, TourGuideOut
from app.schemas.common import Msg
from app.services.file_service import save_image, save_document
from app.services.notification_service import notify
from app.utils.exceptions import not_found, forbidden, conflict
from app.utils.pagination import paginate, Page
from app.utils.audit import log_action

router = APIRouter(prefix="/tour-operators", tags=["Tour Operator Management"])


@router.post("", response_model=TourOperatorOut, status_code=201)
def register_operator(payload: TourOperatorCreate, db: Session = Depends(get_db),
                       current_user: User = Depends(require_roles(UserRole.TOUR_OPERATOR, UserRole.ADMIN))):
    if db.query(TourOperator).filter(TourOperator.user_id == current_user.id).first():
        raise conflict("You already have an operator profile")
    operator = TourOperator(user_id=current_user.id, **payload.model_dump())
    db.add(operator)
    db.commit()
    db.refresh(operator)
    return operator


@router.get("/me", response_model=TourOperatorOut)
def get_my_operator_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    operator = db.query(TourOperator).filter(TourOperator.user_id == current_user.id).first()
    if not operator:
        raise not_found("Operator profile")
    return operator


@router.get("", response_model=Page[TourOperatorOut])
def list_operators(verification_status: Optional[VerificationStatus] = None, page: int = 1, page_size: int = 20,
                    db: Session = Depends(get_db)):
    query = db.query(TourOperator)
    if verification_status:
        query = query.filter(TourOperator.verification_status == verification_status)
    query = query.order_by(TourOperator.created_at.desc())
    items, total, page, page_size, total_pages = paginate(query, page, page_size)
    return Page(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/{operator_id}", response_model=TourOperatorOut)
def get_operator(operator_id: int, db: Session = Depends(get_db)):
    operator = db.get(TourOperator, operator_id)
    if not operator:
        raise not_found("Operator")
    return operator


@router.post("/me/logo", response_model=TourOperatorOut)
def upload_logo(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    operator = db.query(TourOperator).filter(TourOperator.user_id == current_user.id).first()
    if not operator:
        raise not_found("Operator profile")
    operator.logo_url = save_image(file, "operator-logos")
    db.commit()
    db.refresh(operator)
    return operator


@router.post("/me/license-document", response_model=TourOperatorOut)
def upload_license(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    operator = db.query(TourOperator).filter(TourOperator.user_id == current_user.id).first()
    if not operator:
        raise not_found("Operator profile")
    operator.license_document_url = save_document(file, "operator-licenses")
    db.commit()
    db.refresh(operator)
    return operator


@router.put("/{operator_id}/verify", response_model=TourOperatorOut)
def verify_operator(operator_id: int, status: VerificationStatus, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    operator = db.get(TourOperator, operator_id)
    if not operator:
        raise not_found("Operator")
    operator.verification_status = status
    db.commit()
    db.refresh(operator)
    notify(db, operator.user_id, NotificationType.SYSTEM, "Operator verification update",
           f"Your operator profile verification status is now {status.value}.")
    log_action(db, current_user.id, "OPERATOR_VERIFIED", "TourOperator", operator.id, {"status": status.value})
    return operator


# ---- Guides ----
@router.get("/{operator_id}/guides", response_model=list[TourGuideOut])
def list_guides(operator_id: int, db: Session = Depends(get_db)):
    return db.query(TourGuide).filter(TourGuide.operator_id == operator_id, TourGuide.is_active == True).all()


@router.post("/me/guides", response_model=TourGuideOut, status_code=201)
def add_guide(payload: TourGuideCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    operator = db.query(TourOperator).filter(TourOperator.user_id == current_user.id).first()
    if not operator:
        raise not_found("Operator profile")
    guide = TourGuide(operator_id=operator.id, **payload.model_dump())
    db.add(guide)
    db.commit()
    db.refresh(guide)
    return guide


@router.delete("/me/guides/{guide_id}", response_model=Msg)
def remove_guide(guide_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    operator = db.query(TourOperator).filter(TourOperator.user_id == current_user.id).first()
    guide = db.get(TourGuide, guide_id)
    if not guide or not operator or guide.operator_id != operator.id:
        raise forbidden()
    guide.is_active = False
    db.commit()
    return Msg(message="Guide removed")
