from fastapi import APIRouter, HTTPException, Depends, status, Query
from bson import ObjectId
from app.db.mongo import get_database
from app.models.detection import DetectionCreate, DetectionResponse
from app.core.security import get_current_user
from datetime import datetime
from typing import List, Optional

router = APIRouter(prefix="/detections", tags=["Detections"])

def format_doc(doc: dict) -> dict:
    if not doc:
        return doc
    doc = doc.copy()
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

@router.post("", response_model=DetectionResponse, status_code=status.HTTP_201_CREATED)
async def create_detection(detection_data: DetectionCreate, db=Depends(get_database), current_user=Depends(get_current_user)):
    # Verify session exists
    try:
        sess_obj_id = ObjectId(detection_data.session_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session ID format")
        
    session = await db.sessions.find_one({"_id": sess_obj_id})
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        
    # Check authorization
    if current_user["role"] != "caregiver" and current_user["id"] != session["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    detection_dict = detection_data.model_dump()
    result = await db.detections.insert_one(detection_dict)
    inserted = await db.detections.find_one({"_id": result.inserted_id})
    return format_doc(inserted)

@router.get("", response_model=List[DetectionResponse])
async def list_detections(
    session_id: str,
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    try:
        sess_obj_id = ObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session ID format")
        
    # Security check: verify access to this session
    session = await db.sessions.find_one({"_id": sess_obj_id})
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        
    if current_user["role"] != "caregiver" and current_user["id"] != session["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    cursor = db.detections.find({"session_id": session_id}).sort("timestamp", -1).skip(skip).limit(limit)
    detections_list = await cursor.to_list(length=limit)
    return [format_doc(d) for d in detections_list]
