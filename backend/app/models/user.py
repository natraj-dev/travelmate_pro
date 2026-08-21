from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum as SAEnum, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.mixins import TimestampMixin, utcnow
from app.models.enums import UserRole


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(32), nullable=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.CUSTOMER,
                  nullable=False, index=True)

    profile_picture_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    last_login_at = Column(DateTime, nullable=True)

    travel_preferences = Column(Text, nullable=True)
    emergency_contact_name = Column(String(150), nullable=True)
    emergency_contact_phone = Column(String(32), nullable=True)
    emergency_contact_relation = Column(String(50), nullable=True)

    sessions = relationship(
        "UserSession", back_populates="user", cascade="all, delete-orphan")
    addresses = relationship(
        "Address", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan")

    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"


class UserSession(Base):
    """One active refresh session per user device, used to manage login lifecycle and token rotation."""
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_token = Column(String(64), unique=True,
                           index=True, nullable=False)
    device_info = Column(String(255), nullable=True)
    ip_address = Column(String(64), nullable=True)
    user_agent = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    last_active_at = Column(DateTime, default=utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)

    user = relationship("User", back_populates="sessions")


class Permission(Base):
    """Fine-grained permissions that admins can assign to roles for platform access control."""
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), unique=True, nullable=False,
                  index=True)
    description = Column(String(255), nullable=True)

    role_links = relationship(
        "RolePermission", back_populates="permission", cascade="all, delete-orphan")


class RolePermission(Base):
    """Maps a UserRole to a Permission — lets admins fine-tune RBAC beyond the default matrix."""
    __tablename__ = "role_permissions"
    __table_args__ = (UniqueConstraint(
        "role", "permission_id", name="uq_role_permission"),)

    id = Column(Integer, primary_key=True, index=True)
    role = Column(SAEnum(UserRole), nullable=False, index=True)
    permission_id = Column(Integer, ForeignKey(
        "permissions.id", ondelete="CASCADE"), nullable=False)

    permission = relationship("Permission", back_populates="role_links")


class AuditLog(Base):
    """Tracks sensitive mutations across the platform for security and admin review."""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey(
        "users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=True)
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False, index=True)


class SecurityLog(Base):
    """Captures login, auth, and security-related events for monitoring and investigation."""
    __tablename__ = "security_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey(
        "users.id", ondelete="SET NULL"), nullable=True, index=True)
    event_type = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    ip_address = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False, index=True)
