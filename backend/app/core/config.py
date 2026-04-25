from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # LLM
    groq_api_key: str
    groq_model: str = "llama-3.3-70b-versatile"

    # Database
    database_url: str = "postgresql+asyncpg://casefile:casefile@localhost:5432/casefile_db"

    # Auth
    secret_key: str = "change_me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # File storage
    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 50

    # App
    environment: str = "development"
    log_level: str = "INFO"
    cors_origins: str = "http://localhost:5173"
    cors_origin_regex: str | None = None

    @field_validator("database_url")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+asyncpg://", 1)
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
