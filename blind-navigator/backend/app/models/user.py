from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = Field(default="user", description="Either 'user' or 'caregiver'")

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str = Field(..., alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "60c72b2f9b1d8b2bad8e9a2c",
                "name": "Jane Doe",
                "email": "jane@example.com",
                "role": "caregiver",
                "created_at": "2026-07-12T10:00:00"
            }
        }

class UserInDB(UserBase):
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
