# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field

class DeviceCreate(BaseModel):
    mac_address: str = Field(..., description="ESP32 BLE MAC Address")
    user_id: str

class DeviceResponse(BaseModel):
    id: str = Field(..., alias="_id")
    mac_address: str
    user_id: str

    class Config:
        populate_by_name = True