from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SessionStart(BaseModel):
    user_id: str
    device_id: str

class SessionCreate(SessionStart):
    start_time: datetime = Field(default_factory=datetime.utcnow)

class SessionResponse(SessionCreate):
    id: str = Field(..., alias="_id")
    end_time: Optional[datetime] = None
    is_active: bool = True

    class Config:
        populate_by_name = True
