"""Personalized travel recommendations and suggestions."""
import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.hotel import Hotel, HotelBooking
from app.models.tour import TourPackage, TourBooking
from app.models.customer import WishlistItem, WishlistItemType
from app.models.ai import AIRecommendation
from app.schemas.ai import AIRecommendationOut
from app.services.ai_service import explain_recommendation, AIServiceError

router = APIRouter(prefix="/ai/recommendations", tags=["AI Recommendation Engine"])


@router.get("", response_model=list[AIRecommendationOut])
async def get_recommendations(refresh: bool = False, limit: int = 6, db: Session = Depends(get_db),
                               current_user: User = Depends(get_current_user)):
    if not refresh:
        cached = (
            db.query(AIRecommendation)
            .filter(AIRecommendation.user_id == current_user.id)
            .order_by(AIRecommendation.score.desc())
            .limit(limit)
            .all()
        )
        if cached:
            return cached

    booked_hotel_cities = {
        row[0] for row in db.query(Hotel.city).join(HotelBooking, HotelBooking.hotel_id == Hotel.id)
        .filter(HotelBooking.customer_id == current_user.id).distinct()
    }
    booked_destination_ids = {
        row[0] for row in db.query(TourPackage.destination_id).join(TourBooking, TourBooking.package_id == TourPackage.id)
        .filter(TourBooking.customer_id == current_user.id, TourPackage.destination_id.isnot(None)).distinct()
    }
    wishlist = db.query(WishlistItem).filter(WishlistItem.user_id == current_user.id).all()
    wishlist_hotel_ids = {w.item_id for w in wishlist if w.item_type == WishlistItemType.HOTEL}
    wishlist_tour_ids = {w.item_id for w in wishlist if w.item_type == WishlistItemType.TOUR}

    candidates: list[tuple[str, object, float, str]] = []  # (type, item, score, based_on)

    if booked_hotel_cities:
        similar_hotels = (
            db.query(Hotel)
            .filter(Hotel.city.in_(booked_hotel_cities))
            .order_by(Hotel.rating_avg.desc())
            .limit(10)
            .all()
        )
        already_booked_ids = {
            row[0] for row in db.query(HotelBooking.hotel_id).filter(HotelBooking.customer_id == current_user.id)
        }
        for hotel in similar_hotels:
            if hotel.id not in already_booked_ids:
                candidates.append(("HOTEL", hotel, hotel.rating_avg, "BOOKING_HISTORY"))

    if booked_destination_ids:
        similar_tours = (
            db.query(TourPackage)
            .filter(TourPackage.destination_id.in_(booked_destination_ids), TourPackage.is_published == True)
            .order_by(TourPackage.rating_avg.desc())
            .limit(10)
            .all()
        )
        already_booked_ids = {
            row[0] for row in db.query(TourBooking.package_id).filter(TourBooking.customer_id == current_user.id)
        }
        for package in similar_tours:
            if package.id not in already_booked_ids:
                candidates.append(("TOUR", package, package.rating_avg, "BOOKING_HISTORY"))

    if wishlist_hotel_ids:
        wl_hotels = db.query(Hotel).filter(Hotel.id.in_(wishlist_hotel_ids)).all()
        cities = {h.city for h in wl_hotels}
        if cities:
            similar = db.query(Hotel).filter(Hotel.city.in_(cities), ~Hotel.id.in_(wishlist_hotel_ids)) \
                .order_by(Hotel.rating_avg.desc()).limit(5).all()
            for hotel in similar:
                candidates.append(("HOTEL", hotel, hotel.rating_avg + 0.5, "WISHLIST"))

    if wishlist_tour_ids:
        wl_tours = db.query(TourPackage).filter(TourPackage.id.in_(wishlist_tour_ids)).all()
        dest_ids = {t.destination_id for t in wl_tours if t.destination_id}
        if dest_ids:
            similar = db.query(TourPackage).filter(
                TourPackage.destination_id.in_(dest_ids), ~TourPackage.id.in_(wishlist_tour_ids), TourPackage.is_published == True
            ).order_by(TourPackage.rating_avg.desc()).limit(5).all()
            for package in similar:
                candidates.append(("TOUR", package, package.rating_avg + 0.5, "WISHLIST"))

    if not candidates:
        top_hotels = db.query(Hotel).filter(Hotel.is_active == True).order_by(Hotel.rating_avg.desc()).limit(4).all()
        top_tours = db.query(TourPackage).filter(TourPackage.is_published == True).order_by(TourPackage.rating_avg.desc()).limit(4).all()
        candidates = [("HOTEL", h, h.rating_avg, "PREFERENCES") for h in top_hotels] + \
                     [("TOUR", t, t.rating_avg, "PREFERENCES") for t in top_tours]

    # Deduplicate by (type, item_id), keep highest score
    best: dict[tuple[str, int], tuple[str, object, float, str]] = {}
    for type_, item, score, based_on in candidates:
        key = (type_, item.id)
        if key not in best or score > best[key][2]:
            best[key] = (type_, item, score, based_on)

    ranked = sorted(best.values(), key=lambda c: c[2], reverse=True)[:limit]

    db.query(AIRecommendation).filter(AIRecommendation.user_id == current_user.id).delete()

    results = []
    for type_, item, score, based_on in ranked:
        name = item.name if type_ == "HOTEL" else item.title
        try:
            reason = await explain_recommendation(name, type_, based_on)
        except AIServiceError:
            reason = f"Popular with travelers similar to you, based on your {based_on.replace('_', ' ').lower()}."

        rec = AIRecommendation(user_id=current_user.id, recommendation_type=type_, item_id=item.id,
                                reason=reason.strip('"'), score=score, based_on=based_on)
        db.add(rec)
        results.append(rec)

    db.commit()
    for r in results:
        db.refresh(r)
    return results
