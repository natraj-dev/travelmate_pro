from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from app.models.customer import WishlistItemType, ReviewType
from app.schemas.common import ORMBase


class AddressCreate(BaseModel):
    label: str = "Home"
    line1: str
    line2: Optional[str] = None
    city: str
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: str
    is_primary: bool = False


class AddressUpdate(BaseModel):
    label: Optional[str] = None
    line1: Optional[str] = None
    line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    is_primary: Optional[bool] = None


class AddressOut(ORMBase):
    id: int
    user_id: int
    label: str
    line1: str
    line2: Optional[str] = None
    city: str
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: str
    is_primary: bool


class WishlistCreate(BaseModel):
    item_type: WishlistItemType
    item_id: int
    note: Optional[str] = None


class WishlistOut(ORMBase):
    id: int
    user_id: int
    item_type: WishlistItemType
    item_id: int
    note: Optional[str] = None
    created_at: datetime


class ReviewCreate(BaseModel):
    review_type: ReviewType
    item_id: int
    rating: int = Field(ge=1, le=5)
    title: Optional[str] = None
    comment: Optional[str] = None


class ReviewOut(ORMBase):
    id: int
    user_id: int
    review_type: ReviewType
    item_id: int
    rating: int
    title: Optional[str] = None
    comment: Optional[str] = None
    is_approved: bool
    operator_response: Optional[str] = None
    created_at: datetime


class ReviewResponseRequest(BaseModel):
    operator_response: str
