from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "Home Renovation AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # AI APIs
    OPENAI_API_KEY: str
    ANTHROPIC_API_KEY: str
    
    # Stripe
    STRIPE_SECRET_KEY: str
    STRIPE_PUBLISHABLE_KEY: str
    STRIPE_WEBHOOK_SECRET: str
    STRIPE_PRICE_ID_BASIC: str = "price_basic"
    STRIPE_PRICE_ID_PRO: str = "price_pro"
    
    # SendGrid
    SENDGRID_API_KEY: str
    FROM_EMAIL: str
    
    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"
    
    # File Upload
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: set = {".jpg", ".jpeg", ".png", ".webp"}
    
    # Usage Limits
    FREE_TIER_ANALYSES_PER_MONTH: int = 2
    BASIC_TIER_ANALYSES_PER_MONTH: int = 10
    PRO_TIER_ANALYSES_PER_MONTH: int = 100
    ENTERPRISE_TIER_UNLIMITED: bool = True
    
    # Image Generation
    FREE_IMAGE_SIZE: str = "512x512"
    BASIC_IMAGE_SIZE: str = "1024x1024"
    PRO_IMAGE_SIZE: str = "1792x1024"
    ENTERPRISE_IMAGE_SIZE: str = "1792x1024"
    
    # CORS
    BACKEND_CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:8000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
