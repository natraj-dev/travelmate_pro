from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel

from app.models.enums import AIRole
from app.schemas.common import ORMBase


class AIChatRequest(BaseModel):
    conversation_id: Optional[int] = None
    message: str


class AIMessageOut(ORMBase):
    id: int
    role: AIRole
    content: str
    created_at: datetime


class AIConversationOut(ORMBase):
    id: int
    title: str
    created_at: datetime
    messages: List[AIMessageOut] = []


class AIChatResponse(BaseModel):
    conversation_id: int
    reply: str


class AIItineraryRequest(BaseModel):
    destination: str
    duration_days: int
    budget: Optional[float] = None
    interests: Optional[str] = None
    travelers: int = 1


class AIItineraryResponse(BaseModel):
    id: int
    destination_name: str
    duration_days: int
    budget: Optional[float] = None
    plan: Any


class AISaveItineraryRequest(BaseModel):
    ai_itinerary_id: int
    title: Optional[str] = None


class AIRecommendationOut(ORMBase):
    id: int
    recommendation_type: str
    item_id: int
    reason: Optional[str] = None
    score: float
    based_on: Optional[str] = None


class AIInsightOut(ORMBase):
    id: int
    insight_type: str
    title: str
    summary: str
    created_at: datetime
