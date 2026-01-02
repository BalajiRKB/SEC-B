"""
Configuration management for the FastAPI backend
Loads environment variables and provides app settings
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # API Configuration
    app_name: str = "Notes RAG API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Google Gemini Configuration
    gemini_api_key: str
    gemini_embedding_model: str = "models/text-embedding-004"
    gemini_embedding_dimensions: int = 768
    
    # MongoDB Configuration
    mongodb_uri: str
    mongodb_database: str = "notes_rag"
    mongodb_collection: str = "notes"
    mongodb_vector_index_name: str = "vector_index"
    
    # CORS Configuration
    cors_origins: list[str] = [
        "http://localhost:19000",  # Expo dev server
        "http://localhost:19002",  # Expo devtools
        "exp://localhost:19000",   # Expo Go
        "*"                         # Allow all for development
    ]
    
    # Vector Search Configuration
    vector_search_limit: int = 10
    vector_search_num_candidates: int = 100
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
