from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class Msg(BaseModel):
    message: str


class ORMBase(BaseModel):
    """Base for schemas that read directly from SQLAlchemy ORM instances."""
    model_config = {"from_attributes": True}


class TimestampedSchema(ORMBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
