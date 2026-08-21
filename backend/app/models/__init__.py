"""
Importing this package registers every ORM model on `Base.metadata`, which is
required before `Base.metadata.create_all()` or Alembic autogenerate can see
the full schema. Import order matters only for readability here — SQLAlchemy
resolves relationship() string references lazily once all classes exist.
"""
from app.database import Base  # noqa: F401

from app.models.user import User, UserSession, Permission, RolePermission, AuditLog, SecurityLog  # noqa: F401
from app.models.travel import (  # noqa: F401
    DestinationCategory,
    Destination,
    TravelGuide,
    Activity,
    TransportOption,
    AirportTransfer,
)
from app.models.hotel import Hotel, RoomType, Room, HotelBooking  # noqa: F401
from app.models.tour import TourOperator, TourGuide, TourPackage, TourSchedule, TourBooking  # noqa: F401
from app.models.customer import Address, WishlistItem, Review  # noqa: F401
from app.models.booking import (  # noqa: F401
    ActivityBooking,
    TransportBooking,
    Itinerary,
    ItineraryDay,
    ItineraryItem,
)
from app.models.payment import (  # noqa: F401
    Payment,
    Transaction,
    Refund,
    Coupon,
    CouponUsage,
    MembershipPlan,
    UserMembership,
)
from app.models.ai import AIConversation, AIMessage, AIRecommendation, AIItinerary, AIInsight  # noqa: F401
from app.models.communication import Notification, Message, SupportTicket, SupportTicketMessage  # noqa: F401
from app.models.business import (  # noqa: F401
    TravelAgentProfile,
    AgentCustomerLink,
    Lead,
    Commission,
    Report,
    BusinessAnalyticsSnapshot,
)
from app.models.document import TravelDocument, InsurancePlan, InsurancePolicy  # noqa: F401
from app.models.platform_settings import PlatformSetting  # noqa: F401

__all__ = [
    "Base",
    "User", "UserSession", "Permission", "RolePermission", "AuditLog", "SecurityLog",
    "DestinationCategory", "Destination", "TravelGuide", "Activity", "TransportOption", "AirportTransfer",
    "Hotel", "RoomType", "Room", "HotelBooking",
    "TourOperator", "TourGuide", "TourPackage", "TourSchedule", "TourBooking",
    "Address", "WishlistItem", "Review",
    "ActivityBooking", "TransportBooking", "Itinerary", "ItineraryDay", "ItineraryItem",
    "Payment", "Transaction", "Refund", "Coupon", "CouponUsage", "MembershipPlan", "UserMembership",
    "AIConversation", "AIMessage", "AIRecommendation", "AIItinerary", "AIInsight",
    "Notification", "Message", "SupportTicket", "SupportTicketMessage",
    "TravelAgentProfile", "AgentCustomerLink", "Lead", "Commission", "Report", "BusinessAnalyticsSnapshot",
    "TravelDocument", "InsurancePlan", "InsurancePolicy",
    "PlatformSetting",
]
