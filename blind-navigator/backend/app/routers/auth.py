from fastapi import APIRouter, HTTPException, Depends, status
from bson import ObjectId
from app.db.mongo import get_database
from app.models.user import UserCreate, UserResponse, UserInDB
from app.models.auth import LoginRequest, TokenResponse
from app.core.security import hash_password, verify_password, create_access_token
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["Authentication"])

def format_doc(doc: dict) -> dict:
    if not doc:
        return doc
    doc = doc.copy()
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db=Depends(get_database)):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    
    # Hash password and store user
    hashed = hash_password(user_data.password)
    user_dict = {
        "name": user_data.name,
        "email": user_data.email,
        "role": user_data.role,
        "hashed_password": hashed,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_dict)
    inserted_user = await db.users.find_one({"_id": result.inserted_id})
    return format_doc(inserted_user)

@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest, db=Depends(get_database)):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    user_id_str = str(user["_id"])
    token_data = {
        "sub": user["email"],
        "id": user_id_str,
        "role": user["role"],
        "name": user["name"]
    }
    access_token = create_access_token(data=token_data)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user["role"],
        "user_name": user["name"],
        "user_id": user_id_str
    }
