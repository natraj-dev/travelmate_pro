"""Destination catalog and public travel browsing."""
from typing import Optional
from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import require_admin, get_current_user
from app.models.user import User
from app.models.travel import Destination
from app.schemas.travel import DestinationCreate, DestinationUpdate, DestinationOut
from app.schemas.common import Msg
from app.services.file_service import save_image
from app.utils.exceptions import not_found
from app.utils.pagination import paginate, Page

router = APIRouter(prefix="/destinations", tags=["Destinations"])


@router.get("", response_model=Page[DestinationOut])
def list_destinations(
    q: Optional[str] = None,
    category_id: Optional[int] = None,
    country: Optional[str] = None,
    popular_only: bool = False,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    query = db.query(Destination).options(joinedload(Destination.category)).filter(Destination.is_active == True)
    if q:
        query = query.filter(Destination.name.ilike(f"%{q}%"))
    if category_id:
        query = query.filter(Destination.category_id == category_id)
    if country:
        query = query.filter(Destination.country.ilike(f"%{country}%"))
    if popular_only:
        query = query.filter(Destination.is_popular == True)
    query = query.order_by(Destination.name)

    items, total, page, page_size, total_pages = paginate(query, page, page_size)
    return Page(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/popular", response_model=list[DestinationOut])
def popular_destinations(limit: int = 8, db: Session = Depends(get_db)):
    return (
        db.query(Destination)
        .filter(Destination.is_popular == True, Destination.is_active == True)
        .limit(limit)
        .all()
    )


@router.get("/{destination_id}", response_model=DestinationOut)
def get_destination(destination_id: int, db: Session = Depends(get_db)):
    destination = db.query(Destination).options(joinedload(Destination.category)).filter(Destination.id == destination_id).first()
    if not destination:
        raise not_found("Destination")
    return destination


@router.post("", response_model=DestinationOut, status_code=201)
def create_destination(payload: DestinationCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    destination = Destination(**payload.model_dump())
    db.add(destination)
    db.commit()
    db.refresh(destination)
    return destination


@router.put("/{destination_id}", response_model=DestinationOut)
def update_destination(destination_id: int, payload: DestinationUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    destination = db.get(Destination, destination_id)
    if not destination:
        raise not_found("Destination")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(destination, field, value)
    db.commit()
    db.refresh(destination)
    return destination


@router.delete("/{destination_id}", response_model=Msg)
def delete_destination(destination_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    destination = db.get(Destination, destination_id)
    if not destination:
        raise not_found("Destination")
    destination.is_active = False
    db.commit()
    return Msg(message="Destination deactivated")


@router.post("/{destination_id}/images", response_model=DestinationOut)
def upload_destination_image(destination_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    destination = db.get(Destination, destination_id)
    if not destination:
        raise not_found("Destination")
    url = save_image(file, "destinations")
    if not destination.cover_image_url:
        destination.cover_image_url = url
    import json
    images = json.loads(destination.images) if destination.images else []
    images.append(url)
    destination.images = json.dumps(images)
    db.commit()
    db.refresh(destination)
    return destination
