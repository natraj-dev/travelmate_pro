from sqlalchemy import Column, Integer, String, Boolean, Float, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.mixins import TimestampMixin
import enum


class Address(Base, TimestampMixin):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)

    label = Column(String(50), default="Home", nullable=False)
    line1 = Column(String(255), nullable=False)
    line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(100), nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="addresses")


class WishlistItemType(str, enum.Enum):
    HOTEL = "HOTEL"
    TOUR = "TOUR"
    DESTINATION = "DESTINATION"


class WishlistItem(Base, TimestampMixin):
    __tablename__ = "wishlist_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    item_type = Column(SAEnum(WishlistItemType), nullable=False, index=True)
    item_id = Column(Integer, nullable=False)
    note = Column(String(255), nullable=True)


class ReviewType(str, enum.Enum):
    HOTEL = "HOTEL"
    TOUR = "TOUR"
    ACTIVITY = "ACTIVITY"


class Review(Base, TimestampMixin):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    review_type = Column(SAEnum(ReviewType), nullable=False, index=True)
    item_id = Column(Integer, nullable=False, index=True)

    rating = Column(Integer, nullable=False)
    title = Column(String(200), nullable=True)
    comment = Column(Text, nullable=True)
    is_approved = Column(Boolean, default=True, nullable=False)
    is_flagged = Column(Boolean, default=False, nullable=False)
    operator_response = Column(Text, nullable=True)
