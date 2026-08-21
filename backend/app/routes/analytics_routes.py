"""Operational analytics and dashboard reporting."""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app.models.user import User
from app.models.hotel import Hotel, HotelBooking
from app.models.tour import TourPackage, TourBooking
from app.models.travel import Destination
from app.models.payment import Payment, Refund
from app.models.business import TravelAgentProfile
from app.models.communication import SupportTicket
from app.models.enums import UserRole, VerificationStatus, PaymentStatus, RefundStatus, TicketStatus, BookingStatus
from app.schemas.platform_settings import AdminAnalyticsOut, RevenueTrendPoint, PopularDestinationStat

router = APIRouter(prefix="/analytics", tags=["Business Analytics"])


@router.get("/admin", response_model=AdminAnalyticsOut)
def admin_analytics(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    total_customers = db.query(User).filter(User.role == UserRole.CUSTOMER).count()
    total_hotels = db.query(Hotel).count()
    total_tours = db.query(TourPackage).count()
    total_bookings = db.query(HotelBooking).count() + db.query(TourBooking).count()
    total_revenue = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(Payment.status == PaymentStatus.SUCCEEDED).scalar()
    total_refunds = db.query(func.coalesce(func.sum(Refund.amount), 0)).filter(Refund.status == RefundStatus.PROCESSED).scalar()

    pending_hotels = db.query(Hotel).filter(Hotel.verification_status == VerificationStatus.PENDING).count()
    from app.models.tour import TourOperator
    pending_operators = db.query(TourOperator).filter(TourOperator.verification_status == VerificationStatus.PENDING).count()
    pending_agents = db.query(TravelAgentProfile).filter(TravelAgentProfile.verification_status == VerificationStatus.PENDING).count()

    open_tickets = db.query(SupportTicket).filter(SupportTicket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS])).count()

    return AdminAnalyticsOut(
        total_customers=total_customers, total_hotels=total_hotels, total_tours=total_tours,
        total_bookings=total_bookings, total_revenue=float(total_revenue or 0), total_refunds=float(total_refunds or 0),
        pending_verifications=pending_hotels + pending_operators + pending_agents,
        open_support_tickets=open_tickets,
    )


@router.get("/revenue-trend", response_model=list[RevenueTrendPoint])
def revenue_trend(days: int = 30, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    payments = db.query(Payment).filter(Payment.status == PaymentStatus.SUCCEEDED, Payment.paid_at >= since).all()

    buckets: dict[str, dict] = {}
    for p in payments:
        key = p.paid_at.strftime("%Y-%m-%d") if p.paid_at else "unknown"
        buckets.setdefault(key, {"revenue": 0.0, "bookings": 0})
        buckets[key]["revenue"] += p.amount
        buckets[key]["bookings"] += 1

    return [RevenueTrendPoint(period=k, revenue=round(v["revenue"], 2), bookings=v["bookings"])
            for k, v in sorted(buckets.items())]


@router.get("/popular-destinations", response_model=list[PopularDestinationStat])
def popular_destinations(limit: int = 8, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    tour_counts = (
        db.query(TourPackage.destination_id, func.count(TourBooking.id).label("cnt"))
        .join(TourBooking, TourBooking.package_id == TourPackage.id)
        .filter(TourPackage.destination_id.isnot(None))
        .group_by(TourPackage.destination_id)
        .all()
    )
    counts: dict[int, int] = {}
    for dest_id, cnt in tour_counts:
        counts[dest_id] = counts.get(dest_id, 0) + cnt

    hotel_counts = (
        db.query(Hotel.destination_id, func.count(HotelBooking.id).label("cnt"))
        .join(HotelBooking, HotelBooking.hotel_id == Hotel.id)
        .filter(Hotel.destination_id.isnot(None))
        .group_by(Hotel.destination_id)
        .all()
    )
    for dest_id, cnt in hotel_counts:
        counts[dest_id] = counts.get(dest_id, 0) + cnt

    ranked = sorted(counts.items(), key=lambda kv: kv[1], reverse=True)[:limit]
    results = []
    for dest_id, cnt in ranked:
        destination = db.get(Destination, dest_id)
        if destination:
            results.append(PopularDestinationStat(destination_id=dest_id, name=destination.name, booking_count=cnt))
    return results


@router.get("/seasonal-demand")
def seasonal_demand(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    monthly: dict[str, int] = {}
    for (check_in,) in db.query(HotelBooking.check_in_date).all():
        key = check_in.strftime("%B")
        monthly[key] = monthly.get(key, 0) + 1
    for (created,) in db.query(TourBooking.created_at).all():
        key = created.strftime("%B")
        monthly[key] = monthly.get(key, 0) + 1
    return {"monthly_demand": monthly}
