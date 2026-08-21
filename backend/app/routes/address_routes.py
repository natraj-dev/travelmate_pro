"""Customer address management and delivery details."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.customer import Address
from app.schemas.customer import AddressCreate, AddressUpdate, AddressOut
from app.schemas.common import Msg
from app.utils.exceptions import not_found, forbidden

router = APIRouter(prefix="/addresses", tags=["Customer Addresses"])


@router.get("", response_model=list[AddressOut])
def list_my_addresses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Address).filter(Address.user_id == current_user.id).order_by(Address.is_primary.desc()).all()


@router.post("", response_model=AddressOut, status_code=201)
def add_address(payload: AddressCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if payload.is_primary:
        db.query(Address).filter(Address.user_id == current_user.id).update({Address.is_primary: False})
    address = Address(user_id=current_user.id, **payload.model_dump())
    db.add(address)
    db.commit()
    db.refresh(address)
    return address


@router.put("/{address_id}", response_model=AddressOut)
def update_address(address_id: int, payload: AddressUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    address = db.get(Address, address_id)
    if not address:
        raise not_found("Address")
    if address.user_id != current_user.id:
        raise forbidden()
    data = payload.model_dump(exclude_unset=True)
    if data.get("is_primary"):
        db.query(Address).filter(Address.user_id == current_user.id).update({Address.is_primary: False})
    for field, value in data.items():
        setattr(address, field, value)
    db.commit()
    db.refresh(address)
    return address


@router.delete("/{address_id}", response_model=Msg)
def delete_address(address_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    address = db.get(Address, address_id)
    if not address:
        raise not_found("Address")
    if address.user_id != current_user.id:
        raise forbidden()
    db.delete(address)
    db.commit()
    return Msg(message="Address deleted")


@router.put("/{address_id}/primary", response_model=AddressOut)
def set_primary_address(address_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    address = db.get(Address, address_id)
    if not address:
        raise not_found("Address")
    if address.user_id != current_user.id:
        raise forbidden()
    db.query(Address).filter(Address.user_id == current_user.id).update({Address.is_primary: False})
    address.is_primary = True
    db.commit()
    db.refresh(address)
    return address
