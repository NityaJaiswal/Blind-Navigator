from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class DeviceCreate(BaseModel):
    device_name: str
    mac_address: str
    user_id: str

class DeviceResponse(DeviceCreate):
    id: str = Field(..., alias="_id")
    registered_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
