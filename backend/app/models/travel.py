from sqlalchemy import Column, Integer, String, Boolean, Float, Text, ForeignKey, Enum as SAEnum, DateTime
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.mixins import TimestampMixin
from app.models.enums import DestinationCategoryType, TransportType


class DestinationCategory(Base, TimestampMixin):
    """Destination groupings such as beach, culture, adventure, family, and international travel."""
    __tablename__ = "destination_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(SAEnum(DestinationCategoryType), nullable=False, index=True)
    description = Column(String(500), nullable=True)

    destinations = relationship("Destination", back_populates="category")


class Destination(Base, TimestampMixin):
    """Primary destination entries that power public browsing, search, and trip planning."""
    __tablename__ = "destinations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    country = Column(String(100), nullable=False)
    region = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    travel_information = Column(Text, nullable=True)
    best_time_to_visit = Column(String(150), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    cover_image_url = Column(String(500), nullable=True)
    images = Column(Text, nullable=True)
    is_popular = Column(Boolean, default=False, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)

    category_id = Column(Integer, ForeignKey(
        "destination_categories.id", ondelete="SET NULL"), nullable=True)
    category = relationship("DestinationCategory",
                            back_populates="destinations")

    guides = relationship(
        "TravelGuide", back_populates="destination", cascade="all, delete-orphan")
    activities = relationship(
        "Activity", back_populates="destination", cascade="all, delete-orphan")
    hotels = relationship("Hotel", back_populates="destination")
    tour_packages = relationship("TourPackage", back_populates="destination")


class TravelGuide(Base, TimestampMixin):
    """Local travel advice and destination highlights that can be surfaced in the app."""
    __tablename__ = "travel_guides"

    id = Column(Integer, primary_key=True, index=True)
    destination_id = Column(Integer, ForeignKey(
        "destinations.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    local_tips = Column(Text, nullable=True)
    tourist_attractions = Column(Text, nullable=True)
    safety_information = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    author_id = Column(Integer, ForeignKey(
        "users.id", ondelete="SET NULL"), nullable=True)
    is_published = Column(Boolean, default=True, nullable=False)

    destination = relationship("Destination", back_populates="guides")


class Activity(Base, TimestampMixin):
    """Bookable activity records that can be attached to destinations and itineraries."""
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    destination_id = Column(Integer, ForeignKey(
        "destinations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    price = Column(Float, nullable=False, default=0)
    duration_hours = Column(Float, nullable=True)
    capacity_per_slot = Column(Integer, nullable=False, default=20)
    rating_avg = Column(Float, default=0.0, nullable=False)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    destination = relationship("Destination", back_populates="activities")
    bookings = relationship("ActivityBooking", back_populates="activity")


class TransportOption(Base, TimestampMixin):
    """Transport catalog entries for flights, buses, and rail options."""
    __tablename__ = "transport_options"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(SAEnum(TransportType), nullable=False, index=True)
    provider_name = Column(String(150), nullable=False)
    origin = Column(String(150), nullable=False)
    destination_name = Column(String(150), nullable=False)
    departure_time = Column(DateTime, nullable=False)
    arrival_time = Column(DateTime, nullable=False)
    price = Column(Float, nullable=False, default=0)
    seats_available = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, default=True, nullable=False)

    bookings = relationship(
        "TransportBooking", back_populates="transport_option")


class AirportTransfer(Base, TimestampMixin):
    """Scheduled airport transfer bookings and pickup details for travelers."""
    __tablename__ = "airport_transfers"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    pickup_location = Column(String(255), nullable=False)
    drop_location = Column(String(255), nullable=False)
    vehicle_type = Column(String(100), nullable=False, default="Sedan")
    scheduled_time = Column(DateTime, nullable=False)
    driver_name = Column(String(150), nullable=True)
    driver_phone = Column(String(32), nullable=True)
    status = Column(String(30), default="SCHEDULED", nullable=False)
    price = Column(Float, nullable=False, default=0)
    tracking_reference = Column(String(50), nullable=True)
