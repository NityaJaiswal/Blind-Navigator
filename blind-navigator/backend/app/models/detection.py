# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field
from datetime import datetime

class DetectionCreate(BaseModel):
    session_id: str
    label: str
    confidence: float
    color_detected: str

class DetectionResponse(BaseModel):
    id: str = Field(..., alias="_id")
    session_id: str
    label: str
    confidence: float
    color_detected: str
    timestamp: datetime

    class Config:
        populate_by_name = True