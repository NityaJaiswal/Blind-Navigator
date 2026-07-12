from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.db.mongo import connect_to_mongo, close_mongo_connection
from app.routers import auth, devices, sessions, detections, alerts, dashboard

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    await connect_to_mongo()
    yield
    # Shutdown actions
    await close_mongo_connection()

app = FastAPI(
    title="Blind Person Navigator API",
    version="1.0.0",
    description="Backend services for the Blind Person Navigator system, supporting authentication, sessions, devices, alerts, and object detection data.",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(devices.router)
app.include_router(sessions.router)
app.include_router(detections.router)
app.include_router(alerts.router)
app.include_router(dashboard.router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Blind Person Navigator API",
        "documentation": "/docs"
    }
