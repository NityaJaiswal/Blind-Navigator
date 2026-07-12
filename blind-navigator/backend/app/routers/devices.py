from fastapi import APIRouter, HTTPException, Depends, status
from bson import ObjectId
from app.db.mongo import get_database
from app.models.device import DeviceCreate, DeviceResponse
from app.core.security import get_current_user
from datetime import datetime

router = APIRouter(prefix="/devices", tags=["Devices"])

def format_doc(doc: dict) -> dict:
    if not doc:
        return doc
    doc = doc.copy()
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

@router.post("", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
async def register_device(device_data: DeviceCreate, db=Depends(get_database), current_user=Depends(get_current_user)):
    # Verify user_id matches or requester is authorized
    if current_user["role"] != "caregiver" and current_user["id"] != device_data.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to register device for this user"
        )
    
    # Check if MAC address already registered
    existing_device = await db.devices.find_one({"mac_address": device_data.mac_address})
    if existing_device:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Device with this MAC address already registered."
        )
        
    device_dict = {
        "device_name": device_data.device_name,
        "mac_address": device_data.mac_address,
        "user_id": device_data.user_id,
        "registered_at": datetime.utcnow()
    }
    
    result = await db.devices.insert_one(device_dict)
    inserted = await db.devices.find_one({"_id": result.inserted_id})
    return format_doc(inserted)

@router.get("/{id}", response_model=DeviceResponse)
async def get_device(id: str, db=Depends(get_database), current_user=Depends(get_current_user)):
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid device ID format")
        
    device = await db.devices.find_one({"_id": obj_id})
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
        
    if current_user["role"] != "caregiver" and current_user["id"] != device["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    return format_doc(device)
