"""Room inventory, pricing, and room management."""
import json
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.hotel import Hotel, Room, RoomType
from app.models.enums import UserRole
from app.schemas.hotel import RoomCreate, RoomUpdate, RoomOut, RoomTypeCreate, RoomTypeOut
from app.schemas.common import Msg
from app.services.file_service import save_image
from app.utils.exceptions import not_found, forbidden

router = APIRouter(prefix="/rooms", tags=["Room Management"])


def _check_hotel_ownership(db: Session, hotel_id: int, user: User) -> Hotel:
    hotel = db.get(Hotel, hotel_id)
    if not hotel:
        raise not_found("Hotel")
    if hotel.manager_id != user.id and user.role != UserRole.ADMIN:
        raise forbidden("You do not manage this hotel")
    return hotel


@router.get("/types", response_model=list[RoomTypeOut])
def list_room_types(db: Session = Depends(get_db)):
    return db.query(RoomType).order_by(RoomType.name).all()


@router.post("/types", response_model=RoomTypeOut, status_code=201)
def create_room_type(payload: RoomTypeCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    room_type = RoomType(**payload.model_dump())
    db.add(room_type)
    db.commit()
    db.refresh(room_type)
    return room_type


@router.get("/hotel/{hotel_id}", response_model=list[RoomOut])
def list_hotel_rooms(hotel_id: int, db: Session = Depends(get_db)):
    return db.query(Room).filter(Room.hotel_id == hotel_id, Room.is_active == True).all()


@router.post("", response_model=RoomOut, status_code=201)
def create_room(payload: RoomCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _check_hotel_ownership(db, payload.hotel_id, current_user)
    room = Room(**payload.model_dump(), available_units=payload.total_units)
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


@router.put("/{room_id}", response_model=RoomOut)
def update_room(room_id: int, payload: RoomUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    room = db.get(Room, room_id)
    if not room:
        raise not_found("Room")
    _check_hotel_ownership(db, room.hotel_id, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(room, field, value)
    db.commit()
    db.refresh(room)
    return room


@router.post("/{room_id}/images", response_model=RoomOut)
def upload_room_image(room_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    room = db.get(Room, room_id)
    if not room:
        raise not_found("Room")
    _check_hotel_ownership(db, room.hotel_id, current_user)
    url = save_image(file, "rooms")
    images = json.loads(room.images) if room.images else []
    images.append(url)
    room.images = json.dumps(images)
    db.commit()
    db.refresh(room)
    return room


@router.delete("/{room_id}", response_model=Msg)
def delete_room(room_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    room = db.get(Room, room_id)
    if not room:
        raise not_found("Room")
    _check_hotel_ownership(db, room.hotel_id, current_user)
    room.is_active = False
    db.commit()
    return Msg(message="Room deactivated")
