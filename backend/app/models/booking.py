from sqlalchemy import Column, Integer, String, Boolean, Float, Text, ForeignKey, Enum as SAEnum, DateTime, Date
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.mixins import TimestampMixin
from app.models.enums import BookingStatus


class ActivityBooking(Base, TimestampMixin):
    __tablename__ = "activity_bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_reference = Column(
        String(20), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_id = Column(Integer, ForeignKey(
        "activities.id", ondelete="CASCADE"), nullable=False, index=True)

    activity_date = Column(Date, nullable=False)
    participants = Column(Integer, default=1, nullable=False)
    price_per_person = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(SAEnum(BookingStatus),
                    default=BookingStatus.PENDING, nullable=False, index=True)
    cancelled_at = Column(DateTime, nullable=True)

    activity = relationship("Activity", back_populates="bookings")
    payment = relationship(
        "Payment", back_populates="activity_booking", uselist=False)


class TransportBooking(Base, TimestampMixin):
    __tablename__ = "transport_bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_reference = Column(
        String(20), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    transport_option_id = Column(Integer, ForeignKey(
        "transport_options.id", ondelete="CASCADE"), nullable=False, index=True)

    seats_booked = Column(Integer, default=1, nullable=False)
    price_per_seat = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(SAEnum(BookingStatus),
                    default=BookingStatus.PENDING, nullable=False, index=True)
    passenger_details = Column(Text, nullable=True)

    transport_option = relationship(
        "TransportOption", back_populates="bookings")
    payment = relationship(
        "Payment", back_populates="transport_booking", uselist=False)


class Itinerary(Base, TimestampMixin):
    """Travel Itinerary Management — a customer-built, day-by-day trip plan."""
    __tablename__ = "itineraries"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"),
                      nullable=True, index=True)

    title = Column(String(200), nullable=False)
    destination_id = Column(Integer, ForeignKey(
        "destinations.id", ondelete="SET NULL"), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    budget = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    is_ai_generated = Column(Boolean, default=False, nullable=False)
    is_shared = Column(Boolean, default=False, nullable=False)

    days = relationship("ItineraryDay", back_populates="itinerary",
                        cascade="all, delete-orphan", order_by="ItineraryDay.day_number")


class ItineraryDay(Base, TimestampMixin):
    __tablename__ = "itinerary_days"

    id = Column(Integer, primary_key=True, index=True)
    itinerary_id = Column(Integer, ForeignKey(
        "itineraries.id", ondelete="CASCADE"), nullable=False, index=True)
    day_number = Column(Integer, nullable=False)
    date = Column(Date, nullable=True)
    summary = Column(String(255), nullable=True)

    itinerary = relationship("Itinerary", back_populates="days")
    items = relationship("ItineraryItem", back_populates="day",
                         cascade="all, delete-orphan", order_by="ItineraryItem.sort_order")


class ItineraryItem(Base, TimestampMixin):
    """A single entry in a day: hotel stay, tour, activity, or transport leg."""
    __tablename__ = "itinerary_items"

    id = Column(Integer, primary_key=True, index=True)
    day_id = Column(Integer, ForeignKey("itinerary_days.id",
                    ondelete="CASCADE"), nullable=False, index=True)

    item_type = Column(String(30), nullable=False)
    reference_id = Column(Integer, nullable=True)
    title = Column(String(200), nullable=False)
    time_slot = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    estimated_cost = Column(Float, nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)

    day = relationship("ItineraryDay", back_populates="items")
