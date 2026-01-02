"""
Pydantic models for request/response validation
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime


class NoteCreate(BaseModel):
    """Request model for creating a new note"""
    title: str = Field(..., min_length=1, max_length=500, description="Note title")
    content: str = Field(..., min_length=1, description="Note content")
    user_id: str = Field(..., min_length=1, description="User identifier")
    tags: list[str] = Field(default_factory=list, description="Note tags")
    
    @field_validator('content')
    @classmethod
    def validate_content(cls, v: str) -> str:
        """Validate content is not empty or just whitespace"""
        if not v or not v.strip():
            raise ValueError("Content cannot be empty")
        return v.strip()
    
    @field_validator('title')
    @classmethod
    def validate_title(cls, v: str) -> str:
        """Validate title is not empty or just whitespace"""
        if not v or not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()


class NoteResponse(BaseModel):
    """Response model for a note"""
    id: str = Field(..., alias="_id", description="Note ID")
    title: str
    content: str
    user_id: str
    tags: list[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class SearchQuery(BaseModel):
    """Request model for vector search"""
    query: str = Field(..., min_length=1, description="Search query text")
    user_id: str = Field(..., min_length=1, description="User identifier")
    limit: int = Field(default=10, ge=1, le=50, description="Maximum results")
    
    @field_validator('query')
    @classmethod
    def validate_query(cls, v: str) -> str:
        """Validate query is not empty or just whitespace"""
        if not v or not v.strip():
            raise ValueError("Query cannot be empty")
        return v.strip()


class SearchResult(BaseModel):
    """Response model for a search result"""
    note: NoteResponse
    score: float = Field(..., description="Similarity score (0-1)")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class SearchResponse(BaseModel):
    """Response model for search results"""
    results: list[SearchResult]
    query: str
    count: int
    search_time_ms: float = 0.0


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    mongodb_connected: bool
    openai_configured: bool
