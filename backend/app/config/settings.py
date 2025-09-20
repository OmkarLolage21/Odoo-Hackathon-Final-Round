from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    # Load env from backend/.env regardless of CWD
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[2] / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    # Database Configuration
    DATABASE_URL: str
    
    # JWT Configuration
    SECRET_KEY: str
    ALGORITHM: str = Field(default="HS256", description="JWT signing algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=15, description="Access token expiration in minutes"
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(
        default=7, description="Refresh token expiration in days"
    )
    
    # Application Configuration
    APP_NAME: str = Field(default="Odoo Hackathon API", description="Application name")
    APP_VERSION: str = Field(default="1.0.0", description="Application version")
    DEBUG: bool = Field(default=True, description="Debug mode")
    
    # CORS Configuration
    ALLOWED_ORIGINS: list[str] = Field(
        default=["http://localhost:5173", "http://localhost:3001"],
        description="Allowed CORS origins"
    )
    
    # Security Configuration
    PASSWORD_MIN_LENGTH: int = Field(default=8, description="Minimum password length")
    PASSWORD_MAX_LENGTH: int = Field(default=128, description="Maximum password length")
    USERNAME_MIN_LENGTH: int = Field(default=3, description="Minimum username length")
    USERNAME_MAX_LENGTH: int = Field(default=30, description="Maximum username length")
    
    # Note: model_config above handles env_file


# Global settings instance
settings = Settings()
