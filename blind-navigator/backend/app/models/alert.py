from datetime import datetime
from typing import Literal
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field

class AlertCreate(BaseModel):
    session_id: str
    scenario: Literal["A", "B", "C"]  # A: Still object, B: Walking drop, C: Rapid drop
    distance_cm: float
    action_taken: str

class AlertResponse(BaseModel):
    id: str = Field(..., alias="_id")
    session_id: str
    scenario: Literal["A", "B", "C"]
    distance_cm: float
    action_taken: str
    timestamp: datetime

    class Config:
        populate_by_name = True