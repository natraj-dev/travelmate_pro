from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, Enum as SAEnum, DateTime
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.mixins import TimestampMixin
from app.models.enums import AIRole


class AIConversation(Base, TimestampMixin):
    """one chat thread per customer with the AI travel assistant."""
    __tablename__ = "ai_conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), default="New conversation", nullable=False)

    messages = relationship("AIMessage", back_populates="conversation",
                            cascade="all, delete-orphan", order_by="AIMessage.created_at")


class AIMessage(Base, TimestampMixin):
    __tablename__ = "ai_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey(
        "ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(SAEnum(AIRole), nullable=False)
    content = Column(Text, nullable=False)

    conversation = relationship("AIConversation", back_populates="messages")


class AIRecommendation(Base, TimestampMixin):
    """AI Recommendation Engine output, cached per user."""
    __tablename__ = "ai_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    recommendation_type = Column(String(30), nullable=False)
    item_id = Column(Integer, nullable=False)
    reason = Column(String(500), nullable=True)
    score = Column(Float, default=0.0, nullable=False)
    based_on = Column(String(50), nullable=True)


class AIItinerary(Base, TimestampMixin):
    """AI-assisted itinerary drafts, before a user saves one to Itinerary."""
    __tablename__ = "ai_itineraries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    destination_name = Column(String(150), nullable=False)
    duration_days = Column(Integer, nullable=False)
    budget = Column(Float, nullable=True)
    interests = Column(String(255), nullable=True)
    generated_plan = Column(Text, nullable=False)
    saved_itinerary_id = Column(Integer, ForeignKey(
        "itineraries.id", ondelete="SET NULL"), nullable=True)


class AIInsight(Base, TimestampMixin):
    """AI Business Insights for admins/operators — revenue & demand forecasting."""
    __tablename__ = "ai_insights"

    id = Column(Integer, primary_key=True, index=True)
    generated_for_role = Column(String(30), nullable=False)
    generated_for_id = Column(Integer, nullable=True)
    insight_type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    summary = Column(Text, nullable=False)
    data_snapshot = Column(Text, nullable=True)
