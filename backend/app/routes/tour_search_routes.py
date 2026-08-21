"""Tour discovery, search, and filtering."""
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.tour import TourPackage, TourSchedule
from app.schemas.tour import TourPackageOut
from app.utils.pagination import paginate, Page

router = APIRouter(prefix="/tours/search", tags=["Tour Search"])


@router.get("", response_model=Page[TourPackageOut])
def search_tours(
    destination_id: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_duration: Optional[int] = None,
    max_duration: Optional[int] = None,
    activity_type: Optional[str] = None,
    min_rating: Optional[float] = None,
    departure_after: Optional[date] = None,
    page: int = 1, page_size: int = 20,
    db: Session = Depends(get_db),
):
    query = db.query(TourPackage).filter(TourPackage.is_published == True)
    if destination_id:
        query = query.filter(TourPackage.destination_id == destination_id)
    if min_price:
        query = query.filter(TourPackage.price_per_person >= min_price)
    if max_price:
        query = query.filter(TourPackage.price_per_person <= max_price)
    if min_duration:
        query = query.filter(TourPackage.duration_days >= min_duration)
    if max_duration:
        query = query.filter(TourPackage.duration_days <= max_duration)
    if activity_type:
        query = query.filter(TourPackage.activity_type.ilike(f"%{activity_type}%"))
    if min_rating:
        query = query.filter(TourPackage.rating_avg >= min_rating)
    if departure_after:
        package_ids_with_dep = (
            db.query(TourSchedule.package_id)
            .filter(TourSchedule.departure_date >= departure_after, TourSchedule.is_active == True)
            .distinct()
        )
        query = query.filter(TourPackage.id.in_(package_ids_with_dep.subquery().select()))

    query = query.order_by(TourPackage.rating_avg.desc())
    items, total, page, page_size, total_pages = paginate(query, page, page_size)
    return Page(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)
