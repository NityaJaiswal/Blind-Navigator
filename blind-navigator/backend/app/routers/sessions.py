from fastapi import APIRouter, HTTPException, Depends, status, Query
from bson import ObjectId
from app.db.mongo import get_database
from app.models.session import SessionStart, SessionCreate, SessionResponse
from app.core.security import get_current_user
from datetime import datetime
from typing import List, Optional

router = APIRouter(prefix="/sessions", tags=["Sessions"])

def format_doc(doc: dict) -> dict:
    if not doc:
        return doc
    doc = doc.copy()
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

@router.post("/start", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def start_session(session_data: SessionStart, db=Depends(get_database), current_user=Depends(get_current_user)):
    # Verify user access
    if current_user["role"] != "caregiver" and current_user["id"] != session_data.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to start a session for this user"
        )
        
    session_dict = {
        "user_id": session_data.user_id,
        "device_id": session_data.device_id,
        "start_time": datetime.utcnow(),
        "end_time": None,
        "is_active": True
    }
    
    result = await db.sessions.insert_one(session_dict)
    inserted = await db.sessions.find_one({"_id": result.inserted_id})
    return format_doc(inserted)

@router.post("/{id}/end", response_model=SessionResponse)
async def end_session(id: str, db=Depends(get_database), current_user=Depends(get_current_user)):
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session ID format")
        
    session = await db.sessions.find_one({"_id": obj_id})
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        
    if current_user["role"] != "caregiver" and current_user["id"] != session["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    updated = await db.sessions.find_one_and_update(
        {"_id": obj_id},
        {"$set": {"end_time": datetime.utcnow(), "is_active": False}},
        return_document=True
    )
    return format_doc(updated)

@router.get("", response_model=List[SessionResponse])
async def list_sessions(
    user_id: Optional[str] = None,
    limit: int = Query(10, ge=1, le=100),
    skip: int = Query(0, ge=0),
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    query = {}
    if user_id:
        query["user_id"] = user_id
        
    # Security filter: a standard user can only see their own sessions
    if current_user["role"] != "caregiver":
        query["user_id"] = current_user["id"]
        
    cursor = db.sessions.find(query).sort("start_time", -1).skip(skip).limit(limit)
    sessions_list = await cursor.to_list(length=limit)
    return [format_doc(s) for s in sessions_list]

@router.get("/{id}", response_model=SessionResponse)
async def get_session(id: str, db=Depends(get_database), current_user=Depends(get_current_user)):
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session ID format")
        
    session = await db.sessions.find_one({"_id": obj_id})
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        
    if current_user["role"] != "caregiver" and current_user["id"] != session["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    return format_doc(session)
