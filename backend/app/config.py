"""
Configuration module for the PDF OCR microservice.
Loads settings from environment variables with pydantic-settings.
"""
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application settings
    app_name: str = Field(default="pdf-ocr-service", alias="APP_NAME")
    app_version: str = Field(default="1.0.0", alias="APP_VERSION")
    debug: bool = Field(default=False, alias="DEBUG")
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8000, alias="PORT")
    
    # Typhoon OCR API settings
    typhoon_api_key: str = Field(..., alias="TYPHOON_API_KEY")
    typhoon_api_url: str = Field(
        default="https://api.opentyphoon.ai/v1/ocr",
        alias="TYPHOON_API_URL"
    )
    typhoon_rate_limit: float = Field(default=2.0, alias="TYPHOON_RATE_LIMIT")
    
    # Redis settings
    redis_host: str = Field(default="localhost", alias="REDIS_HOST")
    redis_port: int = Field(default=6379, alias="REDIS_PORT")
    redis_db: int = Field(default=0, alias="REDIS_DB")
    redis_password: Optional[str] = Field(default=None, alias="REDIS_PASSWORD")
    
    # Database settings
    database_url: str = Field(..., alias="DATABASE_URL")
    
    # Celery settings
    celery_broker_url: str = Field(
        default="redis://localhost:6379/0",
        alias="CELERY_BROKER_URL"
    )
    celery_result_backend: str = Field(
        default="redis://localhost:6379/0",
        alias="CELERY_RESULT_BACKEND"
    )
    
    # File storage settings
    upload_dir: str = Field(default="/tmp/uploads", alias="UPLOAD_DIR")
    max_file_size: int = Field(default=10485760, alias="MAX_FILE_SIZE")  # 10MB
    
    # Webhook settings
    webhook_timeout: int = Field(default=30, alias="WEBHOOK_TIMEOUT")
    webhook_retry_count: int = Field(default=3, alias="WEBHOOK_RETRY_COUNT")
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": False
    }


# Global settings instance
settings = Settings()
