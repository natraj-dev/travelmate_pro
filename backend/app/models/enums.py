import enum


class UserRole(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    TOUR_OPERATOR = "TOUR_OPERATOR"
    HOTEL_MANAGER = "HOTEL_MANAGER"
    TRAVEL_AGENT = "TRAVEL_AGENT"
    ADMIN = "ADMIN"


class VerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"
    PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED"


class RefundStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    PROCESSED = "PROCESSED"


class DiscountType(str, enum.Enum):
    PERCENTAGE = "PERCENTAGE"
    FIXED = "FIXED"


class MembershipTier(str, enum.Enum):
    BASIC = "BASIC"
    PREMIUM = "PREMIUM"
    ENTERPRISE = "ENTERPRISE"


class NotificationType(str, enum.Enum):
    BOOKING_CONFIRMATION = "BOOKING_CONFIRMATION"
    PAYMENT_SUCCESS = "PAYMENT_SUCCESS"
    PAYMENT_FAILURE = "PAYMENT_FAILURE"
    REFUND_UPDATE = "REFUND_UPDATE"
    TRAVEL_REMINDER = "TRAVEL_REMINDER"
    CHECK_IN_REMINDER = "CHECK_IN_REMINDER"
    PROMOTIONAL = "PROMOTIONAL"
    MESSAGE = "MESSAGE"
    SYSTEM = "SYSTEM"


class TicketStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class TicketPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class LeadStatus(str, enum.Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    QUALIFIED = "QUALIFIED"
    CONVERTED = "CONVERTED"
    LOST = "LOST"


class DestinationCategoryType(str, enum.Enum):
    DOMESTIC = "DOMESTIC"
    INTERNATIONAL = "INTERNATIONAL"
    BEACH = "BEACH"
    MOUNTAINS = "MOUNTAINS"
    ADVENTURE = "ADVENTURE"
    CULTURAL = "CULTURAL"
    FAMILY = "FAMILY"


class TransportType(str, enum.Enum):
    FLIGHT = "FLIGHT"
    BUS = "BUS"
    TRAIN = "TRAIN"
    AIRPORT_TRANSFER = "AIRPORT_TRANSFER"


class DocumentType(str, enum.Enum):
    PASSPORT = "PASSPORT"
    VISA = "VISA"
    ID = "ID"
    BOOKING = "BOOKING"
    OTHER = "OTHER"


class AIRole(str, enum.Enum):
    USER = "USER"
    ASSISTANT = "ASSISTANT"
    SYSTEM = "SYSTEM"
