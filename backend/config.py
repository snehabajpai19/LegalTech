from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env")

    DATABASE_URL: str
    CLIENT_ORIGIN: str
    GOOGLE_API_KEY: str | None = None
    HUGGINGFACEHUB_API_TOKEN: str | None = None
    GOOGLE_CLIENT_ID: str | None = None
    JWT_SECRET_KEY: str = Field(
        default="change-me-in-production",
        description="Secret used to sign backend access tokens.",
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    WKHTMLTOPDF_PATH: str | None = None

# Create a single instance of the settings to use in our app
settings = Settings()
