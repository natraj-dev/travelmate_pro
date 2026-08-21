"""Business insights and trend summaries for staff."""
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin, get_current_user
from app.models.user import User
from app.models.ai import AIInsight
from app.models.payment import Payment
from app.models.hotel import HotelBooking, Hotel
from app.models.tour import TourBooking, TourPackage, TourOperator
from app.models.enums import PaymentStatus, UserRole
from app.schemas.ai import AIInsightOut
from app.services.ai_service import generate_business_insight, AIServiceError
from app.utils.exceptions import bad_request, not_found

router = APIRouter(prefix="/ai/insights", tags=["AI Business Insights"])


@router.post("/generate", response_model=AIInsightOut)
async def generate_insight(insight_type: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in (UserRole.ADMIN, UserRole.TOUR_OPERATOR, UserRole.HOTEL_MANAGER):
        from app.utils.exceptions import forbidden
        raise forbidden()

    if insight_type.upper() == "REVENUE_FORECAST":
        total_revenue = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(Payment.status == PaymentStatus.SUCCEEDED).scalar()
        payment_count = db.query(Payment).filter(Payment.status == PaymentStatus.SUCCEEDED).count()
        snapshot = {"total_revenue": float(total_revenue or 0), "successful_payments": payment_count}
    elif insight_type.upper() == "DEMAND_PREDICTION":
        hotel_bookings = db.query(HotelBooking).count()
        tour_bookings = db.query(TourBooking).count()
        snapshot = {"hotel_bookings": hotel_bookings, "tour_bookings": tour_bookings}
    elif insight_type.upper() == "RETENTION":
        repeat_customers = (
            db.query(HotelBooking.customer_id, func.count(HotelBooking.id).label("cnt"))
            .group_by(HotelBooking.customer_id).having(func.count(HotelBooking.id) > 1).count()
        )
        total_customers = db.query(User).filter(User.role == UserRole.CUSTOMER).count()
        snapshot = {"repeat_customers": repeat_customers, "total_customers": total_customers}
    elif insight_type.upper() == "PACKAGE_PERFORMANCE":
        top_packages = db.query(TourPackage).order_by(TourPackage.review_count.desc()).limit(5).all()
        snapshot = {"top_packages": [{"title": p.title, "reviews": p.review_count, "rating": p.rating_avg} for p in top_packages]}
    else:
        raise bad_request("insight_type must be one of REVENUE_FORECAST, DEMAND_PREDICTION, RETENTION, PACKAGE_PERFORMANCE")

    try:
        summary = await generate_business_insight(insight_type, snapshot)
    except AIServiceError as exc:
        raise bad_request(str(exc))

    import json
    insight = AIInsight(
        generated_for_role=current_user.role.value, generated_for_id=current_user.id,
        insight_type=insight_type.upper(), title=insight_type.replace("_", " ").title(),
        summary=summary, data_snapshot=json.dumps(snapshot),
    )
    db.add(insight)
    db.commit()
    db.refresh(insight)
    return insight


@router.get("", response_model=list[AIInsightOut])
def list_insights(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(AIInsight)
        .filter(AIInsight.generated_for_id == current_user.id)
        .order_by(AIInsight.created_at.desc())
        .limit(20)
        .all()
    )
