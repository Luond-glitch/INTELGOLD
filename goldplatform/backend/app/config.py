from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False
    )

    database_url: str
    secret_key: str
    frontend_origin: str = "http://localhost:5173"
    cookie_secure: bool = False
    google_client_id: str = ""
    session_hours: int = 8
    remember_days: int = 30

    # AI providers (added for Phase 3)
    gemini_api_key: str = ""
    openai_api_key: str = ""
    cohere_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    openai_model: str = "gpt-4o-mini"
    cohere_model: str = "command-r-08-2024"

    support_email: str = ""   # shown on Contact and Support when set
    support_phone: str = ""


settings = Settings()
