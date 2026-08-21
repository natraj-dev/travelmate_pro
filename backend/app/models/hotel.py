from sqlalchemy import Column, Integer, String, Boolean, Float, Text, ForeignKey, Enum as SAEnum, DateTime, Date
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.mixins import TimestampMixin, utcnow
from app.models.enums import VerificationStatus, BookingStatus


class Hotel(Base, TimestampMixin):
    """A hotel listing managed by a registered hotel manager."""
    __tablename__ = "hotels"

    id = Column(Integer, primary_key=True, index=True)
    manager_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    destination_id = Column(Integer, ForeignKey(
        "destinations.id", ondelete="SET NULL"), nullable=True, index=True)

    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    address = Column(String(500), nullable=False)
    city = Column(String(100), nullable=False, index=True)
    country = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    star_rating = Column(Integer, default=3, nullable=False)
    rating_avg = Column(Float, default=0.0, nullable=False)
    review_count = Column(Integer, default=0, nullable=False)

    amenities = Column(Text, nullable=True)
    cover_image_url = Column(String(500), nullable=True)
    images = Column(Text, nullable=True)

    check_in_time = Column(String(10), default="14:00", nullable=False)
    check_out_time = Column(String(10), default="11:00", nullable=False)

    verification_status = Column(SAEnum(
        VerificationStatus), default=VerificationStatus.PENDING, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)

    destination = relationship("Destination", back_populates="hotels")
    rooms = relationship("Room", back_populates="hotel",
                         cascade="all, delete-orphan")
    bookings = relationship("HotelBooking", back_populates="hotel")


class RoomType(Base, TimestampMixin):
    """A reusable category such as Standard, Deluxe, or Suite."""
    __tablename__ = "room_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)

    rooms = relationship("Room", back_populates="room_type")


class Room(Base, TimestampMixin):
    """A bookable room configuration belonging to a hotel."""
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    hotel_id = Column(Integer, ForeignKey(
        "hotels.id", ondelete="CASCADE"), nullable=False, index=True)
    room_type_id = Column(Integer, ForeignKey(
        "room_types.id", ondelete="SET NULL"), nullable=True)

    room_number = Column(String(20), nullable=False)
    name = Column(String(150), nullable=False)
    price_per_night = Column(Float, nullable=False)
    capacity_adults = Column(Integer, default=2, nullable=False)
    capacity_children = Column(Integer, default=0, nullable=False)

    total_units = Column(Integer, default=1, nullable=False)
    available_units = Column(Integer, default=1, nullable=False)
    images = Column(Text, nullable=True)
    status = Column(String(20), default="ACTIVE", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    hotel = relationship("Hotel", back_populates="rooms")
    room_type = relationship("RoomType", back_populates="rooms")
    bookings = relationship("HotelBooking", back_populates="room")


class HotelBooking(Base, TimestampMixin):
    """A customer's reservation for a room at a hotel."""
    __tablename__ = "hotel_bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_reference = Column(
        String(20), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    hotel_id = Column(Integer, ForeignKey(
        "hotels.id", ondelete="CASCADE"), nullable=False, index=True)
    room_id = Column(Integer, ForeignKey(
        "rooms.id", ondelete="CASCADE"), nullable=False, index=True)

    check_in_date = Column(Date, nullable=False)
    check_out_date = Column(Date, nullable=False)
    nights = Column(Integer, nullable=False)
    rooms_booked = Column(Integer, default=1, nullable=False)
    guests_adults = Column(Integer, default=1, nullable=False)
    guests_children = Column(Integer, default=0, nullable=False)

    price_per_night = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    tax_amount = Column(Float, default=0, nullable=False)
    discount_amount = Column(Float, default=0, nullable=False)
    total_amount = Column(Float, nullable=False)

    status = Column(SAEnum(BookingStatus),
                    default=BookingStatus.PENDING, nullable=False, index=True)
    special_requests = Column(Text, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    cancellation_reason = Column(String(500), nullable=True)

    hotel = relationship("Hotel", back_populates="bookings")
    room = relationship("Room", back_populates="bookings")
    payment = relationship(
        "Payment", back_populates="hotel_booking", uselist=False)
