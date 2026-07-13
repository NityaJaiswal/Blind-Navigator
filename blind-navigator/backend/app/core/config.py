import os
from pydantic import BaseModel
from dotenv import load_dotenv

# Resolve path to .env file at monorepo root
# config.py is in backend/app/core/, so going up 3 levels reaches 'BLIND AI APP'
base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
dotenv_path = os.path.join(base_dir, ".env")

if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

class Settings(BaseModel):
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/blind_navigator")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-key-change-me")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

settings = Settings()