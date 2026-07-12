from motor.motor_asyncio import AsyncIOMotorClient
import logging
from app.core.config import settings

logger = logging.getLogger("blind_navigator_db")

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

def get_database():
    return db_instance.db

async def connect_to_mongo():
    logger.info("Connecting to MongoDB...")
    db_instance.client = AsyncIOMotorClient(settings.MONGO_URI)
    # Extract database name from URI or default to blind_navigator
    db_name = settings.MONGO_URI.split("/")[-1].split("?")[0]
    if not db_name:
        db_name = "blind_navigator"
    db_instance.db = db_instance.client[db_name]
    logger.info(f"Connected to MongoDB database: {db_name}")
    await create_indexes()

async def close_mongo_connection():
    logger.info("Closing MongoDB connection...")
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB connection closed.")

async def create_indexes():
    if db_instance.db is not None:
        logger.info("Creating database indexes...")
        
        # User collection unique email index
        await db_instance.db.users.create_index("email", unique=True)
        
        # Sessions collection indexes
        await db_instance.db.sessions.create_index([("user_id", 1), ("start_time", -1)])
        
        # Detections collection indexes
        await db_instance.db.detections.create_index([("session_id", 1), ("timestamp", -1)])
        
        # Alerts collection indexes
        await db_instance.db.alerts.create_index([("session_id", 1), ("timestamp", -1)])
        
        logger.info("Database indexes created successfully.")
