"""Hotel listings, verification, and management."""
import json
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_roles, require_admin
from app.models.user import User
from app.models.hotel import Hotel
from app.models.enums import UserRole, VerificationStatus
from app.schemas.hotel import HotelCreate, HotelUpdate, HotelOut
from app.schemas.common import Msg
from app.services.file_service import save_image
from app.services.notification_service import notify
from app.models.enums import NotificationType
from app.utils.exceptions import not_found, forbidden
from app.utils.pagination import paginate, Page
from app.utils.audit import log_action

router = APIRouter(prefix="/hotels", tags=["Hotel Management"])


@router.get("", response_model=Page[HotelOut])
def list_hotels(
    mine_only: bool = False,
    verification_status: Optional[VerificationStatus] = None,
    page: int = 1, page_size: int = 20,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    query = db.query(Hotel)
    if mine_only:
        query = query.filter(Hotel.manager_id == current_user.id)
    elif current_user.role != UserRole.ADMIN:
        query = query.filter(Hotel.is_active == True, Hotel.verification_status == VerificationStatus.APPROVED)
    if verification_status:
        query = query.filter(Hotel.verification_status == verification_status)
    query = query.order_by(Hotel.created_at.desc())
    items, total, page, page_size, total_pages = paginate(query, page, page_size)
    return Page(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/{hotel_id}", response_model=HotelOut)
def get_hotel(hotel_id: int, db: Session = Depends(get_db)):
    hotel = db.get(Hotel, hotel_id)
    if not hotel:
        raise not_found("Hotel")
    return hotel


@router.post("", response_model=HotelOut, status_code=201)
def register_hotel(payload: HotelCreate, db: Session = Depends(get_db),
                    current_user: User = Depends(require_roles(UserRole.HOTEL_MANAGER, UserRole.ADMIN))):
    data = payload.model_dump()
    amenities = data.pop("amenities", None)
    hotel = Hotel(manager_id=current_user.id, amenities=json.dumps(amenities) if amenities else None, **data)
    db.add(hotel)
    db.commit()
    db.refresh(hotel)
    log_action(db, current_user.id, "HOTEL_REGISTERED", "Hotel", hotel.id)
    return hotel


@router.put("/{hotel_id}", response_model=HotelOut)
def update_hotel(hotel_id: int, payload: HotelUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    hotel = db.get(Hotel, hotel_id)
    if not hotel:
        raise not_found("Hotel")
    if hotel.manager_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise forbidden()
    data = payload.model_dump(exclude_unset=True)
    amenities = data.pop("amenities", None)
    if amenities is not None:
        hotel.amenities = json.dumps(amenities)
    for field, value in data.items():
        setattr(hotel, field, value)
    db.commit()
    db.refresh(hotel)
    return hotel


@router.post("/{hotel_id}/images", response_model=HotelOut)
def upload_hotel_image(hotel_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    hotel = db.get(Hotel, hotel_id)
    if not hotel:
        raise not_found("Hotel")
    if hotel.manager_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise forbidden()
    url = save_image(file, "hotels")
    if not hotel.cover_image_url:
        hotel.cover_image_url = url
    images = json.loads(hotel.images) if hotel.images else []
    images.append(url)
    hotel.images = json.dumps(images)
    db.commit()
    db.refresh(hotel)
    return hotel


@router.put("/{hotel_id}/verify", response_model=HotelOut)
def verify_hotel(hotel_id: int, status: VerificationStatus, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    hotel = db.get(Hotel, hotel_id)
    if not hotel:
        raise not_found("Hotel")
    hotel.verification_status = status
    db.commit()
    db.refresh(hotel)
    notify(db, hotel.manager_id, NotificationType.SYSTEM, "Hotel verification update",
           f"Your hotel '{hotel.name}' verification status is now {status.value}.")
    log_action(db, current_user.id, "HOTEL_VERIFIED", "Hotel", hotel.id, {"status": status.value})
    return hotel


@router.delete("/{hotel_id}", response_model=Msg)
def deactivate_hotel(hotel_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    hotel = db.get(Hotel, hotel_id)
    if not hotel:
        raise not_found("Hotel")
    if hotel.manager_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise forbidden()
    hotel.is_active = False
    db.commit()
    return Msg(message="Hotel deactivated")
