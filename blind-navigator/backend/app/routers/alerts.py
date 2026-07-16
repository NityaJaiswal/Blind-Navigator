from fastapi import APIRouter, HTTPException, Depends, status, Query
from bson import ObjectId
from app.db.mongo import get_database
from app.models.alert import AlertCreate, AlertResponse
from app.core.security import get_current_user
from datetime import datetime
from typing import List, Optional

router = APIRouter(prefix="/alerts", tags=["Alerts"])

def format_doc(doc: dict) -> dict:
    if not doc:
        return doc
    doc = doc.copy()
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(alert_data: AlertCreate, db=Depends(get_database), current_user=Depends(get_current_user)):
    try:
        sess_obj_id = ObjectId(alert_data.session_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session ID format")
        
    session = await db.sessions.find_one({"_id": sess_obj_id})
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        
    if current_user["role"] != "caregiver" and current_user["id"] != session["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    alert_dict = alert_data.model_dump()
    alert_dict["scenario"] = alert_data.scenario
    alert_dict["action_taken"] = alert_data.action_taken
    
    result = await db.alerts.insert_one(alert_dict)
    inserted = await db.alerts.find_one({"_id": result.inserted_id})
    return format_doc(inserted)

@router.get("", response_model=List[AlertResponse])
async def list_alerts(
    session_id: str,
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    try:
        sess_obj_id = ObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session ID format")
        
    session = await db.sessions.find_one({"_id": sess_obj_id})
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        
    if current_user["role"] != "caregiver" and current_user["id"] != session["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    query = {"session_id": session_id}
    
    if from_date or to_date:
        time_query = {}
        if from_date:
            time_query["$gte"] = from_date
        if to_date:
            time_query["$lte"] = to_date
        query["timestamp"] = time_query
        
    cursor = db.alerts.find(query).sort("timestamp", -1).skip(skip).limit(limit)
    alerts_list = await cursor.to_list(length=limit)
    return [format_doc(a) for a in alerts_list]
