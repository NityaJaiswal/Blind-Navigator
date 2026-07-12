from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class ScenarioEnum(str, Enum):
    A = "A"
    B = "B"
    C = "C"

class ActionEnum(str, Enum):
    WARNED_USER = "warned_user"
    STOP_OVERRIDE = "stop_override"
    MUTE = "mute"

class AlertCreate(BaseModel):
    session_id: str
    scenario: ScenarioEnum
    distance: float
    action_taken: ActionEnum
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AlertResponse(AlertCreate):
    id: str = Field(..., alias="_id")

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "60c72b2f9b1d8b2bad8e9a3a",
                "session_id": "60c72b2f9b1d8b2bad8e9a2d",
                "scenario": "B",
                "distance": 85.5,
                "action_taken": "warned_user",
                "timestamp": "2026-07-12T10:06:00"
            }
        }
