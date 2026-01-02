"""
Notes API routes
Handles note creation and retrieval
"""

from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
import logging

from app.models.schemas import NoteCreate, NoteResponse, SearchQuery, SearchResponse, SearchResult
from app.services.mongodb_service import MongoDBService, get_mongodb
from app.services.gemini_service import generate_note_embedding, generate_query_embedding

router = APIRouter(prefix="/api", tags=["notes"])
logger = logging.getLogger(__name__)


@router.post(
    "/notes",
    response_model=NoteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new note",
    description="Create a note with automatic embedding generation and MongoDB storage"
)
async def create_note(
    note: NoteCreate,
    db: MongoDBService = Depends(get_mongodb)
) -> NoteResponse:
    """
    Create a new note with vector embedding
    
    - **title**: Note title (required, non-empty)
    - **content**: Note content (required, non-empty)
    - **user_id**: User identifier (required)
    - **tags**: Optional list of tags
    
    Returns the created note with ID and timestamps
    """
    try:
        # Generate embedding from title, content, and tags
        logger.info(f"Generating embedding for note: {note.title}")
        embedding = await generate_note_embedding(
            title=note.title,
            content=note.content,
            tags=note.tags
        )
        
        # Store in MongoDB
        logger.info(f"Storing note in MongoDB for user: {note.user_id}")
        note_id = await db.create_note(
            title=note.title,
            content=note.content,
            user_id=note.user_id,
            tags=note.tags,
            embedding=embedding
        )
        
        # Fetch and return the created note
        created_note = await db.get_note(note_id)
        
        if not created_note:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve created note"
            )
        
        logger.info(f"Note created successfully: {note_id}")
        return NoteResponse(**created_note)
        
    except ValueError as e:
        # Validation errors
        logger.warning(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        # Internal errors
        logger.error(f"Error creating note: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create note: {str(e)}"
        )


@router.post(
    "/search",
    response_model=SearchResponse,
    summary="Search notes with vector similarity",
    description="Search user's notes using semantic similarity with MongoDB Atlas Vector Search"
)
async def search_notes(
    query: SearchQuery,
    db: MongoDBService = Depends(get_mongodb)
) -> SearchResponse:
    """
    Search notes using vector similarity
    
    - **query**: Search query text (required, non-empty)
    - **user_id**: User identifier (required)
    - **limit**: Maximum results to return (1-50, default 10)
    
    Returns semantically similar notes with similarity scores
    """
    import time
    start_time = time.time()
    
    try:
        # Generate embedding for the search query
        logger.info(f"Generating embedding for search query: {query.query[:50]}...")
        query_embedding = await generate_query_embedding(query.query)
        
        # Perform vector search
        logger.info(f"Searching notes for user: {query.user_id}")
        results = await db.vector_search(
            query_embedding=query_embedding,
            user_id=query.user_id,
            limit=query.limit
        )
        
        # Format results
        search_results = [
            SearchResult(
                note=NoteResponse(**result),
                score=result.get("score", 0.0)
            )
            for result in results
        ]
        
        search_time_ms = (time.time() - start_time) * 1000
        logger.info(f"Found {len(search_results)} results in {search_time_ms:.2f}ms")
        
        return SearchResponse(
            results=search_results,
            query=query.query,
            count=len(search_results),
            search_time_ms=search_time_ms
        )
        
    except ValueError as e:
        # Validation errors
        logger.warning(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        # Internal errors
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )


@router.get(
    "/notes/{user_id}",
    response_model=List[NoteResponse],
    summary="List user's notes",
    description="Get all notes for a specific user"
)
async def list_user_notes(
    user_id: str,
    limit: int = 100,
    db: MongoDBService = Depends(get_mongodb)
) -> List[NoteResponse]:
    """
    List all notes for a user
    
    - **user_id**: User identifier
    - **limit**: Maximum number of notes to return
    """
    try:
        notes = await db.list_notes(user_id=user_id, limit=limit)
        return [NoteResponse(**note) for note in notes]
    except Exception as e:
        logger.error(f"Error listing notes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list notes: {str(e)}"
        )


@router.post(
    "/suggest-tags",
    summary="Get AI tag suggestions",
    description="Analyze note content and suggest relevant tags using Gemini"
)
async def suggest_tags(
    request: dict
) -> dict:
    """
    Get AI-powered tag suggestions based on note content
    
    - **title**: Note title
    - **content**: Note content
    
    Returns list of suggested tags with confidence scores
    """
    try:
        title = request.get("title", "")
        content = request.get("content", "")
        
        if not title and not content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Title or content is required"
            )
        
        # Use Gemini to generate tag suggestions
        import google.generativeai as genai
        from app.config import get_settings
        settings = get_settings()
        
        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        prompt = f"""Analyze this note and suggest 3-5 relevant tags. 
        
Title: {title}
Content: {content}

Return ONLY a JSON array with this exact format:
[{{"tag": "example", "confidence": 0.95}}]

Rules:
- Tags should be single words or short phrases
- Confidence should be between 0.0 and 1.0
- Return 3-5 tags maximum
- No explanation, just the JSON array"""

        response = model.generate_content(prompt)
        
        # Parse the JSON response
        import json
        import re
        
        text = response.text.strip()
        # Extract JSON array from markdown code blocks if present
        json_match = re.search(r'\[.*\]', text, re.DOTALL)
        if json_match:
            text = json_match.group(0)
        
        suggestions = json.loads(text)
        
        return {"suggestions": suggestions}
        
    except Exception as e:
        logger.error(f"Error generating tag suggestions: {str(e)}")
        # Return fallback suggestions instead of failing
        return {
            "suggestions": [
                {"tag": "notes", "confidence": 0.5},
                {"tag": "ideas", "confidence": 0.5}
            ]
        }
