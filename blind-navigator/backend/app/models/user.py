from pydantic import BaseModel, EmailStr, Field
from typing import Literal
from typing import Optional

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Literal["user", "caregiver"]

class UserInDB(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    email: EmailStr
    hashed_password: str
    role: Literal["user", "caregiver"]

    class Config:
        populate_by_name = True

class UserResponse(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    email: EmailStr
    role: str

    class Config:
        populate_by_name = True