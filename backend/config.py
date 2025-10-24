# backend/config.py

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):

    model_config = SettingsConfigDict(env_file=".env")
    
    # Define our settings
    DATABASE_URL: str
    CLIENT_ORIGIN: str

# Create a single instance of the settings to use in our app
settings = Settings()