"""
OpenAI embedding service
Generates vector embeddings using text-embedding-3-small model
"""

import openai
from typing import List
from app.config import get_settings

settings = get_settings()

# Initialize OpenAI client
client = openai.AsyncOpenAI(api_key=settings.openai_api_key)


async def generate_embedding(text: str) -> List[float]:
    """
    Generate embedding vector for the given text
    
    Args:
        text: Text to generate embedding for
        
    Returns:
        List of floats representing the embedding vector
        
    Raises:
        Exception: If embedding generation fails
    """
    try:
        # Combine title and content for better semantic representation
        response = await client.embeddings.create(
            model=settings.openai_embedding_model,
            input=text,
            encoding_format="float"
        )
        
        embedding = response.data[0].embedding
        
        # Verify embedding dimensions
        if len(embedding) != settings.openai_embedding_dimensions:
            raise ValueError(
                f"Expected {settings.openai_embedding_dimensions} dimensions, "
                f"got {len(embedding)}"
            )
        
        return embedding
        
    except openai.APIError as e:
        raise Exception(f"OpenAI API error: {str(e)}")
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
