import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import os
import sys

# Add backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.security import hash_password

async def seed_db():
    print("Seeding database...")
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db_name = settings.MONGO_URI.split("/")[-1].split("?")[0]
    if not db_name:
        db_name = "blind_navigator"
    db = client[db_name]

    # Clean existing collections
    print("Dropping existing collections...")
    await db.users.delete_many({})
    await db.devices.delete_many({})
    await db.sessions.delete_many({})
    await db.detections.delete_many({})
    await db.alerts.delete_many({})

    # 1. Create a user (caregiver)
    print("Creating demo user...")
    caregiver_password = "password123"
    hashed_pwd = hash_password(caregiver_password)
    user_dict = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "caregiver",
        "hashed_password": hashed_pwd,
        "created_at": datetime.utcnow() - timedelta(days=5)
    }
    user_result = await db.users.insert_one(user_dict)
    user_id = str(user_result.inserted_id)

    # 2. Create a user (blind navigator user)
    patient_password = "password123"
    patient_hashed_pwd = hash_password(patient_password)
    patient_dict = {
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user",
        "hashed_password": patient_hashed_pwd,
        "created_at": datetime.utcnow() - timedelta(days=5)
    }
    patient_result = await db.users.insert_one(patient_dict)
    patient_id = str(patient_result.inserted_id)

    # 3. Create a device
    print("Creating demo device...")
    device_dict = {
        "device_name": "ESP32-Navigator-Band",
        "mac_address": "24:6F:28:1A:3B:5C",
        "user_id": patient_id,
        "registered_at": datetime.utcnow() - timedelta(days=4)
    }
    device_result = await db.devices.insert_one(device_dict)
    device_id = str(device_result.inserted_id)

    # 4. Create sessions
    print("Creating demo sessions...")
    now = datetime.utcnow()
    
    # Session 1: completed, 30 mins, 2 days ago
    s1_start = now - timedelta(days=2, hours=5)
    s1_end = s1_start + timedelta(minutes=30)
    s1_dict = {
        "user_id": patient_id,
        "device_id": device_id,
        "start_time": s1_start,
        "end_time": s1_end,
        "is_active": False
    }
    s1_result = await db.sessions.insert_one(s1_dict)
    s1_id = str(s1_result.inserted_id)

    # Session 2: completed, 45 mins, 1 day ago
    s2_start = now - timedelta(days=1, hours=3)
    s2_end = s2_start + timedelta(minutes=45)
    s2_dict = {
        "user_id": patient_id,
        "device_id": device_id,
        "start_time": s2_start,
        "end_time": s2_end,
        "is_active": False
    }
    s2_result = await db.sessions.insert_one(s2_dict)
    s2_id = str(s2_result.inserted_id)

    # Session 3: completed, 20 mins, 2 hours ago
    s3_start = now - timedelta(hours=2)
    s3_end = s3_start + timedelta(minutes=20)
    s3_dict = {
        "user_id": patient_id,
        "device_id": device_id,
        "start_time": s3_start,
        "end_time": s3_end,
        "is_active": False
    }
    s3_result = await db.sessions.insert_one(s3_dict)
    s3_id = str(s3_result.inserted_id)

    # 5. Create detection events for sessions
    print("Creating demo object detections...")
    detections = [
        # Session 1 detections
        {"session_id": s1_id, "label": "chair", "confidence": 0.88, "color": "blue", "timestamp": s1_start + timedelta(minutes=2), "bounding_box": {"x_min": 0.2, "y_min": 0.3, "x_max": 0.5, "y_max": 0.7}},
        {"session_id": s1_id, "label": "table", "confidence": 0.72, "color": "brown", "timestamp": s1_start + timedelta(minutes=5), "bounding_box": {"x_min": 0.1, "y_min": 0.4, "x_max": 0.8, "y_max": 0.9}},
        {"session_id": s1_id, "label": "door", "confidence": 0.91, "color": "white", "timestamp": s1_start + timedelta(minutes=15), "bounding_box": {"x_min": 0.4, "y_min": 0.1, "x_max": 0.7, "y_max": 0.9}},
        {"session_id": s1_id, "label": "stairs", "confidence": 0.65, "color": "grey", "timestamp": s1_start + timedelta(minutes=20), "bounding_box": {"x_min": 0.0, "y_min": 0.5, "x_max": 1.0, "y_max": 1.0}},
        
        # Session 2 detections
        {"session_id": s2_id, "label": "person", "confidence": 0.95, "color": "red", "timestamp": s2_start + timedelta(minutes=5), "bounding_box": {"x_min": 0.3, "y_min": 0.2, "x_max": 0.6, "y_max": 0.8}},
        {"session_id": s2_id, "label": "car", "confidence": 0.82, "color": "black", "timestamp": s2_start + timedelta(minutes=12), "bounding_box": {"x_min": 0.1, "y_min": 0.3, "x_max": 0.9, "y_max": 0.7}},
        {"session_id": s2_id, "label": "pothole", "confidence": 0.70, "color": "dark grey", "timestamp": s2_start + timedelta(minutes=25), "bounding_box": {"x_min": 0.4, "y_min": 0.6, "x_max": 0.6, "y_max": 0.8}},
        {"session_id": s2_id, "label": "pole", "confidence": 0.89, "color": "silver", "timestamp": s2_start + timedelta(minutes=30), "bounding_box": {"x_min": 0.45, "y_min": 0.1, "x_max": 0.55, "y_max": 0.9}},

        # Session 3 detections
        {"session_id": s3_id, "label": "chair", "confidence": 0.92, "color": "black", "timestamp": s3_start + timedelta(minutes=3), "bounding_box": {"x_min": 0.2, "y_min": 0.3, "x_max": 0.5, "y_max": 0.7}},
        {"session_id": s3_id, "label": "door", "confidence": 0.85, "color": "brown", "timestamp": s3_start + timedelta(minutes=10), "bounding_box": {"x_min": 0.4, "y_min": 0.1, "x_max": 0.7, "y_max": 0.9}},
        {"session_id": s3_id, "label": "couch", "confidence": 0.87, "color": "blue", "timestamp": s3_start + timedelta(minutes=15), "bounding_box": {"x_min": 0.1, "y_min": 0.4, "x_max": 0.9, "y_max": 0.9}}
    ]
    await db.detections.insert_many(detections)

    # 6. Create alert events
    print("Creating demo alerts...")
    alerts = [
        # Session 1 alerts
        {"session_id": s1_id, "scenario": "A", "distance": 120.0, "action_taken": "warned_user", "timestamp": s1_start + timedelta(minutes=2)},
        {"session_id": s1_id, "scenario": "B", "distance": 80.5, "action_taken": "warned_user", "timestamp": s1_start + timedelta(minutes=20)},
        
        # Session 2 alerts
        {"session_id": s2_id, "scenario": "B", "distance": 75.0, "action_taken": "warned_user", "timestamp": s2_start + timedelta(minutes=12)},
        {"session_id": s2_id, "scenario": "C", "distance": 45.2, "action_taken": "stop_override", "timestamp": s2_start + timedelta(minutes=25)},
        {"session_id": s2_id, "scenario": "A", "distance": 140.0, "action_taken": "warned_user", "timestamp": s2_start + timedelta(minutes=30)},

        # Session 3 alerts
        {"session_id": s3_id, "scenario": "B", "distance": 85.0, "action_taken": "warned_user", "timestamp": s3_start + timedelta(minutes=3)},
        {"session_id": s3_id, "scenario": "A", "distance": 130.0, "action_taken": "warned_user", "timestamp": s3_start + timedelta(minutes=10)}
    ]
    await db.alerts.insert_many(alerts)

    print("Database seeding completed successfully.")
    print("--------------------------------------")
    print(f"Caregiver Account: email: jane@example.com, password: {caregiver_password}")
    print(f"Patient Account:   email: john@example.com, password: {patient_password}")
    print(f"Patient ID:        {patient_id}")
    print(f"Device ID:         {device_id}")
    print("--------------------------------------")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_db())
