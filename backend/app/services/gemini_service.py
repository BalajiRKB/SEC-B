"""
Google Gemini embedding service
Generates vector embeddings using text-embedding-004 model
"""

import google.generativeai as genai
from typing import List
from app.config import get_settings

settings = get_settings()

# Configure Gemini API
genai.configure(api_key=settings.gemini_api_key)


async def generate_embedding(text: str) -> List[float]:
    """
    Generate embedding vector for the given text using Gemini
    
    Args:
        text: Text to generate embedding for
        
    Returns:
        List of floats representing the embedding vector
        
    Raises:
        Exception: If embedding generation fails
    """
    try:
        # Generate embedding using Gemini
        # Note: google-generativeai doesn't have async support yet, but operations are fast
        result = genai.embed_content(
            model=settings.gemini_embedding_model,
            content=text,
            task_type="retrieval_document",
            title=None
        )
        
        embedding = result['embedding']
        
        # Verify embedding dimensions
        if len(embedding) != settings.gemini_embedding_dimensions:
            raise ValueError(
                f"Expected {settings.gemini_embedding_dimensions} dimensions, "
                f"got {len(embedding)}"
            )
        
        return embedding
        
    except Exception as e:
        raise Exception(f"Failed to generate embedding: {str(e)}")


async def generate_note_embedding(title: str, content: str, tags: List[str]) -> List[float]:
    """
    Generate embedding for a note by combining title, content, and tags
    
    Args:
        title: Note title
        content: Note content
        tags: List of tags
        
    Returns:
        Embedding vector
    """
    # Combine all text for comprehensive semantic representation
    combined_text = f"{title}\n\n{content}"
    
    if tags:
        tags_text = ", ".join(tags)
        combined_text += f"\n\nTags: {tags_text}"
    
    return await generate_embedding(combined_text)


async def generate_query_embedding(query: str) -> List[float]:
    """
    Generate embedding for a search query
    
    Args:
        query: Search query text
        
    Returns:
        Embedding vector
    """
    try:
        # Use retrieval_query task type for search queries
        result = genai.embed_content(
            model=settings.gemini_embedding_model,
            content=query,
            task_type="retrieval_query"
        )
        
        embedding = result['embedding']
        
        if len(embedding) != settings.gemini_embedding_dimensions:
            raise ValueError(
                f"Expected {settings.gemini_embedding_dimensions} dimensions, "
                f"got {len(embedding)}"
            )
        
        return embedding
    except Exception as e:
        raise Exception(f"Failed to generate query embedding: {str(e)}")
