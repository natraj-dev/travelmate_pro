"""
Central application configuration.

All values are sourced from environment variables / .env file so nothing
sensitive is hard-coded in source control.
"""

from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ------------------------------------------------------------------
    # Core
    # ------------------------------------------------------------------

    APP_NAME: str = "TravelMate Pro"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    API_PREFIX: str = "/api"

    # ------------------------------------------------------------------
    # Database
    # ------------------------------------------------------------------

    DATABASE_URL: str = (
        "mysql+pymysql://root:password@localhost:3306/travelmate_pro"
    )

    # ------------------------------------------------------------------
    # JWT / Authentication
    # ------------------------------------------------------------------

    JWT_SECRET_KEY: str = "change-this-secret-key-in-production"
    JWT_ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    EMAIL_TOKEN_EXPIRE_HOURS: int = 24

    # ------------------------------------------------------------------
    # Stripe
    # ------------------------------------------------------------------

    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_CURRENCY: str = "usd"

    # ------------------------------------------------------------------
    # Ollama - Local AI
    # ------------------------------------------------------------------

    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1"
    OLLAMA_TIMEOUT: int = 60

    # ------------------------------------------------------------------
    # OpenStreetMap / Location Services
    # ------------------------------------------------------------------

    NOMINATIM_BASE_URL: str = "https://nominatim.openstreetmap.org"
    OSRM_BASE_URL: str = "https://router.project-osrm.org"
    OVERPASS_BASE_URL: str = "https://overpass-api.de/api/interpreter"

    MAP_USER_AGENT: str = "TravelMate-Pro/1.0"

    # ------------------------------------------------------------------
    # SMTP
    # ------------------------------------------------------------------

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "no-reply@travelmatepro.com"
    SMTP_USE_TLS: bool = True

    # ------------------------------------------------------------------
    # Frontend / CORS
    # ------------------------------------------------------------------

    FRONTEND_URL: str = "http://localhost:5173"

    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # ------------------------------------------------------------------
    # Uploads
    # ------------------------------------------------------------------

    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    # ------------------------------------------------------------------
    # Rate limiting
    # ------------------------------------------------------------------

    RATE_LIMIT_AUTH: str = "10/minute"
    RATE_LIMIT_PAYMENT: str = "20/minute"
    RATE_LIMIT_AI: str = "30/minute"

    # ------------------------------------------------------------------
    # Platform business defaults
    # ------------------------------------------------------------------

    DEFAULT_COMMISSION_PERCENT: float = 10.0
    DEFAULT_TAX_PERCENT: float = 5.0


settings = Settings()
