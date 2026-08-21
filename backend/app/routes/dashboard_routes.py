"""Role-based dashboard data and summary widgets."""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.user import User
from app.models.hotel import Hotel, HotelBooking
from app.models.tour import TourOperator, TourPackage, TourBooking, TourSchedule
from app.models.business import TravelAgentProfile, Lead, Commission
from app.models.booking import Itinerary
from app.models.customer import WishlistItem, Review
from app.models.payment import Payment
from app.models.enums import UserRole, BookingStatus, PaymentStatus, LeadStatus
from app.utils.exceptions import not_found

router = APIRouter(prefix="/dashboard", tags=["Dashboards"])


@router.get("/hotel-manager")
def hotel_manager_dashboard(db: Session = Depends(get_db),
                             current_user: User = Depends(require_roles(UserRole.HOTEL_MANAGER, UserRole.ADMIN))):
    hotel_ids = [h.id for h in db.query(Hotel.id).filter(Hotel.manager_id == current_user.id)]
    hotels = db.query(Hotel).filter(Hotel.manager_id == current_user.id).all()

    bookings_query = db.query(HotelBooking).filter(HotelBooking.hotel_id.in_(hotel_ids)) if hotel_ids else db.query(HotelBooking).filter(False)
    total_bookings = bookings_query.count()
    confirmed_bookings = bookings_query.filter(HotelBooking.status == BookingStatus.CONFIRMED).count()
    revenue = bookings_query.filter(HotelBooking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED])) \
        .with_entities(func.coalesce(func.sum(HotelBooking.total_amount), 0)).scalar()

    today = datetime.now(timezone.utc).date()
    occupied_today = bookings_query.filter(
        HotelBooking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED]),
        HotelBooking.check_in_date <= today, HotelBooking.check_out_date > today,
    ).count()

    recent_bookings = bookings_query.order_by(HotelBooking.created_at.desc()).limit(8).all()
    recent_reviews = db.query(Review).filter(Review.review_type == "HOTEL", Review.item_id.in_(hotel_ids)).order_by(Review.created_at.desc()).limit(5).all() if hotel_ids else []

    return {
        "total_hotels": len(hotels),
        "total_bookings": total_bookings,
        "confirmed_bookings": confirmed_bookings,
        "occupied_rooms_today": occupied_today,
        "total_revenue": float(revenue or 0),
        "average_rating": round(sum(h.rating_avg for h in hotels) / len(hotels), 2) if hotels else 0,
        "recent_bookings": [{
            "id": b.id, "reference": b.booking_reference, "check_in": str(b.check_in_date),
            "check_out": str(b.check_out_date), "amount": b.total_amount, "status": b.status.value,
        } for b in recent_bookings],
        "recent_reviews": [{"id": r.id, "rating": r.rating, "comment": r.comment} for r in recent_reviews],
    }


@router.get("/tour-operator")
def tour_operator_dashboard(db: Session = Depends(get_db),
                             current_user: User = Depends(require_roles(UserRole.TOUR_OPERATOR, UserRole.ADMIN))):
    operator = db.query(TourOperator).filter(TourOperator.user_id == current_user.id).first()
    if not operator:
        raise not_found("Operator profile")

    package_ids = [p.id for p in db.query(TourPackage.id).filter(TourPackage.operator_id == operator.id)]
    active_tours = db.query(TourPackage).filter(TourPackage.operator_id == operator.id, TourPackage.is_published == True).count()

    bookings_query = db.query(TourBooking).filter(TourBooking.package_id.in_(package_ids)) if package_ids else db.query(TourBooking).filter(False)
    total_bookings = bookings_query.count()
    revenue = bookings_query.filter(TourBooking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED])) \
        .with_entities(func.coalesce(func.sum(TourBooking.total_amount), 0)).scalar()

    seats_available = db.query(func.coalesce(func.sum(TourSchedule.seats_available), 0)) \
        .filter(TourSchedule.package_id.in_(package_ids)).scalar() if package_ids else 0

    customer_count = bookings_query.with_entities(TourBooking.customer_id).distinct().count()

    top_packages = db.query(TourPackage).filter(TourPackage.operator_id == operator.id) \
        .order_by(TourPackage.review_count.desc()).limit(5).all()

    return {
        "active_tours": active_tours,
        "total_bookings": total_bookings,
        "total_revenue": float(revenue or 0),
        "seats_available": int(seats_available or 0),
        "unique_customers": customer_count,
        "top_packages": [{"id": p.id, "title": p.title, "bookings": len(p.bookings), "rating": p.rating_avg} for p in top_packages],
    }


@router.get("/agent")
def travel_agent_dashboard(db: Session = Depends(get_db),
                            current_user: User = Depends(require_roles(UserRole.TRAVEL_AGENT, UserRole.ADMIN))):
    agent = db.query(TravelAgentProfile).filter(TravelAgentProfile.user_id == current_user.id).first()
    if not agent:
        raise not_found("Agent profile")

    active_customers = db.query(func.count()).select_from(
        db.query(Lead.id).filter(Lead.agent_id == agent.id, Lead.status == LeadStatus.CONVERTED).subquery()
    ).scalar()
    total_leads = db.query(Lead).filter(Lead.agent_id == agent.id).count()
    open_leads = db.query(Lead).filter(Lead.agent_id == agent.id, Lead.status.in_([LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED])).count()

    commissions = db.query(Commission).filter(Commission.agent_id == agent.id).all()
    total_commission = sum(c.commission_amount for c in commissions)
    pending_commission = sum(c.commission_amount for c in commissions if c.status == "PENDING")

    recent_leads = db.query(Lead).filter(Lead.agent_id == agent.id).order_by(Lead.created_at.desc()).limit(6).all()

    return {
        "converted_customers": active_customers,
        "total_leads": total_leads,
        "open_leads": open_leads,
        "total_commission_earned": round(total_commission, 2),
        "pending_commission": round(pending_commission, 2),
        "recent_leads": [{"id": l.id, "name": l.full_name, "status": l.status.value, "destination": l.interested_destination} for l in recent_leads],
    }


@router.get("/customer")
def customer_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    upcoming_hotel = db.query(HotelBooking).filter(
        HotelBooking.customer_id == current_user.id, HotelBooking.status == BookingStatus.CONFIRMED,
        HotelBooking.check_in_date >= datetime.now(timezone.utc).date(),
    ).order_by(HotelBooking.check_in_date).limit(5).all()

    upcoming_tours = db.query(TourBooking).filter(
        TourBooking.customer_id == current_user.id, TourBooking.status == BookingStatus.CONFIRMED,
    ).order_by(TourBooking.created_at.desc()).limit(5).all()

    wishlist_count = db.query(WishlistItem).filter(WishlistItem.user_id == current_user.id).count()
    itinerary_count = db.query(Itinerary).filter(Itinerary.customer_id == current_user.id).count()
    total_spent = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
        Payment.customer_id == current_user.id, Payment.status == PaymentStatus.SUCCEEDED
    ).scalar()

    return {
        "upcoming_hotel_bookings": [{
            "id": b.id, "reference": b.booking_reference, "check_in": str(b.check_in_date), "hotel_id": b.hotel_id,
        } for b in upcoming_hotel],
        "upcoming_tour_bookings": [{"id": b.id, "reference": b.booking_reference, "package_id": b.package_id} for b in upcoming_tours],
        "wishlist_count": wishlist_count,
        "saved_itineraries": itinerary_count,
        "total_spent": float(total_spent or 0),
    }
