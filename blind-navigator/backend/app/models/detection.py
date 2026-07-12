from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class BoundingBox(BaseModel):
    x_min: float
    y_min: float
    x_max: float
    y_max: float

class DetectionCreate(BaseModel):
    session_id: str
    label: str
    confidence: float
    color: Optional[str] = None
    bounding_box: Optional[BoundingBox] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class DetectionResponse(DetectionCreate):
    id: str = Field(..., alias="_id")

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "60c72b2f9b1d8b2bad8e9a2f",
                "session_id": "60c72b2f9b1d8b2bad8e9a2d",
                "label": "chair",
                "confidence": 0.89,
                "color": "red",
                "bounding_box": {
                    "x_min": 0.1,
                    "y_min": 0.2,
                    "x_max": 0.5,
                    "y_max": 0.8
                },
                "timestamp": "2026-07-12T10:05:00"
            }
        }
