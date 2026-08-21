from sqlalchemy import Column, Integer, String, Text, Boolean

from app.database import Base
from app.models.mixins import TimestampMixin


class PlatformSetting(Base, TimestampMixin):
    __tablename__ = "platform_settings"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(50), nullable=False, index=True)
    key = Column(String(100), nullable=False, index=True)
    value = Column(Text, nullable=True)
    value_type = Column(String(20), default="STRING", nullable=False)
    description = Column(String(255), nullable=True)
    is_secret = Column(Boolean, default=False, nullable=False)
