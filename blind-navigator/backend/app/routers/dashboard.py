from fastapi import APIRouter, HTTPException, Depends, status, Query
from bson import ObjectId
from app.db.mongo import get_database
from app.core.security import get_current_user
from typing import Dict, Any, List

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary")
async def get_dashboard_summary(
    user_id: str,
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    # Only caregivers can see dashboard summaries, or the user themselves
    if current_user["role"] != "caregiver" and current_user["id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    # Get all session ids for this user
    sessions_cursor = db.sessions.find({"user_id": user_id}, {"_id": 1, "start_time": 1, "end_time": 1})
    sessions = await sessions_cursor.to_list(length=1000)
    session_ids = [str(s["_id"]) for s in sessions]
    
    total_sessions = len(sessions)
    total_active_seconds = 0
    for s in sessions:
        if s.get("end_time") and s.get("start_time"):
            delta = s["end_time"] - s["start_time"]
            total_active_seconds += int(delta.total_seconds())
            
    # If no sessions, return empty dashboard structure
    if not session_ids:
        return {
            "total_sessions": 0,
            "total_active_seconds": 0,
            "total_alerts": 0,
            "alert_counts_by_scenario": {"A": 0, "B": 0, "C": 0},
            "top_detections": []
        }
        
    # Aggregate Alerts by Scenario
    alert_pipeline = [
        {"$match": {"session_id": {"$in": session_ids}}},
        {"$group": {"_id": "$scenario", "count": {"$sum": 1}}}
    ]
    alert_cursor = db.alerts.aggregate(alert_pipeline)
    alerts_agg = await alert_cursor.to_list(length=10)
    
    alert_counts = {"A": 0, "B": 0, "C": 0}
    total_alerts = 0
    for agg in alerts_agg:
        scenario = agg["_id"]
        count = agg["count"]
        if scenario in alert_counts:
            alert_counts[scenario] = count
        total_alerts += count
        
    # Aggregate top detections
    detection_pipeline = [
        {"$match": {"session_id": {"$in": session_ids}}},
        {"$group": {"_id": "$label", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    detection_cursor = db.detections.aggregate(detection_pipeline)
    detections_agg = await detection_cursor.to_list(length=10)
    
    top_detections = [{"label": d["_id"], "count": d["count"]} for d in detections_agg]
    
    return {
        "total_sessions": total_sessions,
        "total_active_seconds": total_active_seconds,
        "total_alerts": total_alerts,
        "alert_counts_by_scenario": alert_counts,
        "top_detections": top_detections
    }
