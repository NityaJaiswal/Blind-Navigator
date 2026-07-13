# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class SessionStart(BaseModel):
    user_id: str
    device_id: Optional[str] = None

class SessionCreate(BaseModel):
    user_id: str

class SessionResponse(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    start_time: datetime
    end_time: Optional[datetime] = None

    class Config:
        populate_by_name = True