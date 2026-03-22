from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env")
    
    # Define our settings
    DATABASE_URL: str
    CLIENT_ORIGIN: str
    google_api_key: str
    huggingfacehub_api_token: str

# Create a single instance of the settings to use in our app
settings = Settings()
