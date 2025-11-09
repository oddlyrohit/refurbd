
from functools import lru_cache
from pydantic import BaseSettings, AnyHttpUrl
from typing import List, Optional
import os

class Settings(BaseSettings):
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    API_PREFIX: str = os.getenv("API_PREFIX", "/api")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/postgres")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me")
    JWT_EXPIRES_MIN: int = int(os.getenv("JWT_EXPIRES_MIN", "43200"))  # default 30 days
    CORS_ORIGINS_RAW: str = os.getenv("CORS_ORIGINS", "")

    @property
    def CORS_ORIGINS(self) -> List[str]:
        raw = self.CORS_ORIGINS_RAW.strip()
        if not raw:
            return ["http://localhost:3000"]
        return [o.strip() for o in raw.split(",") if o.strip()]

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
