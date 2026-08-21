from sqlalchemy import Column, Integer, String, Boolean, Float, Text, ForeignKey, Enum as SAEnum, DateTime, Date
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.mixins import TimestampMixin
from app.models.enums import VerificationStatus, BookingStatus


class TourOperator(Base, TimestampMixin):
    """Tour Operator Management."""
    __tablename__ = "tour_operators"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    company_name = Column(String(200), nullable=False)
    company_description = Column(Text, nullable=True)
    license_number = Column(String(100), nullable=True)
    license_document_url = Column(String(500), nullable=True)
    logo_url = Column(String(500), nullable=True)
    website = Column(String(255), nullable=True)
    years_in_business = Column(Integer, nullable=True)

    verification_status = Column(SAEnum(
        VerificationStatus), default=VerificationStatus.PENDING, nullable=False, index=True)
    rating_avg = Column(Float, default=0.0, nullable=False)

    packages = relationship(
        "TourPackage", back_populates="operator", cascade="all, delete-orphan")
    guides = relationship(
        "TourGuide", back_populates="operator", cascade="all, delete-orphan")


class TourGuide(Base, TimestampMixin):
    """Manage Guides."""
    __tablename__ = "tour_guides"

    id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(Integer, ForeignKey(
        "tour_operators.id", ondelete="CASCADE"), nullable=False, index=True)
    full_name = Column(String(150), nullable=False)
    languages = Column(String(255), nullable=True)
    phone = Column(String(32), nullable=True)
    photo_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    operator = relationship("TourOperator", back_populates="guides")


class TourPackage(Base, TimestampMixin):
    """Tour Package Management."""
    __tablename__ = "tour_packages"

    id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(Integer, ForeignKey(
        "tour_operators.id", ondelete="CASCADE"), nullable=False, index=True)
    destination_id = Column(Integer, ForeignKey(
        "destinations.id", ondelete="SET NULL"), nullable=True, index=True)

    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    included_services = Column(Text, nullable=True)
    excluded_services = Column(Text, nullable=True)
    duration_days = Column(Integer, nullable=False)
    duration_nights = Column(Integer, nullable=False)
    price_per_person = Column(Float, nullable=False)
    max_group_size = Column(Integer, default=20, nullable=False)
    activity_type = Column(String(100), nullable=True)
    cover_image_url = Column(String(500), nullable=True)
    images = Column(Text, nullable=True)
    rating_avg = Column(Float, default=0.0, nullable=False)
    review_count = Column(Integer, default=0, nullable=False)
    is_published = Column(Boolean, default=False, nullable=False, index=True)

    operator = relationship("TourOperator", back_populates="packages")
    destination = relationship("Destination", back_populates="tour_packages")
    schedules = relationship(
        "TourSchedule", back_populates="package", cascade="all, delete-orphan")
    bookings = relationship("TourBooking", back_populates="package")


class TourSchedule(Base, TimestampMixin):
    """Tour Schedule Management."""
    __tablename__ = "tour_schedules"

    id = Column(Integer, primary_key=True, index=True)
    package_id = Column(Integer, ForeignKey(
        "tour_packages.id", ondelete="CASCADE"), nullable=False, index=True)

    departure_date = Column(Date, nullable=False)
    return_date = Column(Date, nullable=False)
    departure_location = Column(String(200), nullable=False)
    total_seats = Column(Integer, nullable=False)
    seats_available = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    package = relationship("TourPackage", back_populates="schedules")
    bookings = relationship("TourBooking", back_populates="schedule")


class TourBooking(Base, TimestampMixin):
    """Tour Booking."""
    __tablename__ = "tour_bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_reference = Column(
        String(20), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    package_id = Column(Integer, ForeignKey(
        "tour_packages.id", ondelete="CASCADE"), nullable=False, index=True)
    schedule_id = Column(Integer, ForeignKey(
        "tour_schedules.id", ondelete="CASCADE"), nullable=False, index=True)

    traveler_count = Column(Integer, nullable=False, default=1)
    price_per_person = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    tax_amount = Column(Float, default=0, nullable=False)
    discount_amount = Column(Float, default=0, nullable=False)
    total_amount = Column(Float, nullable=False)

    status = Column(SAEnum(BookingStatus),
                    default=BookingStatus.PENDING, nullable=False, index=True)
    traveler_details = Column(Text, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    cancellation_reason = Column(String(500), nullable=True)

    package = relationship("TourPackage", back_populates="bookings")
    schedule = relationship("TourSchedule", back_populates="bookings")
    payment = relationship(
        "Payment", back_populates="tour_booking", uselist=False)
