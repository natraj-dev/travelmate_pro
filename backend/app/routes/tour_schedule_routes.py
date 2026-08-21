"""Tour schedule timing and availability."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.tour import TourOperator, TourPackage, TourSchedule
from app.models.enums import UserRole
from app.schemas.tour import TourScheduleCreate, TourScheduleOut
from app.schemas.common import Msg
from app.utils.exceptions import not_found, forbidden

router = APIRouter(prefix="/tour-schedules", tags=["Tour Schedule Management"])


@router.get("/package/{package_id}", response_model=list[TourScheduleOut])
def list_schedules(package_id: int, upcoming_only: bool = True, db: Session = Depends(get_db)):
    query = db.query(TourSchedule).filter(TourSchedule.package_id == package_id, TourSchedule.is_active == True)
    if upcoming_only:
        from datetime import date
        query = query.filter(TourSchedule.departure_date >= date.today())
    return query.order_by(TourSchedule.departure_date).all()


@router.post("", response_model=TourScheduleOut, status_code=201)
def create_schedule(payload: TourScheduleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    package = db.get(TourPackage, payload.package_id)
    if not package:
        raise not_found("Tour package")
    if current_user.role != UserRole.ADMIN:
        operator = db.query(TourOperator).filter(TourOperator.user_id == current_user.id).first()
        if not operator or package.operator_id != operator.id:
            raise forbidden()
    schedule = TourSchedule(**payload.model_dump(), seats_available=payload.total_seats)
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.put("/{schedule_id}", response_model=TourScheduleOut)
def update_schedule(schedule_id: int, total_seats: int | None = None, is_active: bool | None = None,
                     db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    schedule = db.get(TourSchedule, schedule_id)
    if not schedule:
        raise not_found("Schedule")
    package = db.get(TourPackage, schedule.package_id)
    if current_user.role != UserRole.ADMIN:
        operator = db.query(TourOperator).filter(TourOperator.user_id == current_user.id).first()
        if not operator or package.operator_id != operator.id:
            raise forbidden()
    if total_seats is not None:
        diff = total_seats - schedule.total_seats
        schedule.total_seats = total_seats
        schedule.seats_available = max(0, schedule.seats_available + diff)
    if is_active is not None:
        schedule.is_active = is_active
    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/{schedule_id}", response_model=Msg)
def cancel_schedule(schedule_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    schedule = db.get(TourSchedule, schedule_id)
    if not schedule:
        raise not_found("Schedule")
    package = db.get(TourPackage, schedule.package_id)
    if current_user.role != UserRole.ADMIN:
        operator = db.query(TourOperator).filter(TourOperator.user_id == current_user.id).first()
        if not operator or package.operator_id != operator.id:
            raise forbidden()
    schedule.is_active = False
    db.commit()
    return Msg(message="Schedule cancelled")
