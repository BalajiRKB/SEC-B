"""
MongoDB service using Motor for async operations
Handles note storage and vector search with MongoDB Atlas
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase, AsyncIOMotorCollection
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
import logging

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


class MongoDBService:
    """MongoDB service for async operations"""
    
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None
    collection: Optional[AsyncIOMotorCollection] = None
    
    async def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = AsyncIOMotorClient(settings.mongodb_uri)
            self.db = self.client[settings.mongodb_database]
            self.collection = self.db[settings.mongodb_collection]
            
            # Test connection
            await self.client.admin.command('ping')
            logger.info(f"Connected to MongoDB: {settings.mongodb_database}")
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            raise
    
    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
    
    async def is_connected(self) -> bool:
        """Check if MongoDB is connected"""
        try:
            if self.client:
                await self.client.admin.command('ping')
                return True
        except Exception:
            pass
        return False
    
    async def create_note(
        self,
        title: str,
        content: str,
        user_id: str,
        tags: List[str],
        embedding: List[float]
    ) -> str:
        """
        Create a new note with embedding
        
        Args:
            title: Note title
            content: Note content
            user_id: User identifier
            tags: List of tags
            embedding: Vector embedding
            
        Returns:
            Created note ID as string
        """
        now = datetime.utcnow()
        
        note_doc = {
            "title": title,
            "content": content,
            "user_id": user_id,
            "tags": tags,
            "embedding": embedding,
            "created_at": now,
            "updated_at": now
        }
        
        result = await self.collection.insert_one(note_doc)
        return str(result.inserted_id)
    
    async def get_note(self, note_id: str) -> Optional[Dict[str, Any]]:
        """Get a note by ID"""
        try:
            note = await self.collection.find_one({"_id": ObjectId(note_id)})
            if note:
                note["_id"] = str(note["_id"])
            return note
        except Exception as e:
            logger.error(f"Error fetching note {note_id}: {str(e)}")
            return None
    
    async def vector_search(
        self,
        query_embedding: List[float],
        user_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Perform vector search with user filter
        
        Args:
            query_embedding: Query vector embedding
            user_id: User ID to filter results
            limit: Maximum number of results
            
        Returns:
            List of matching notes with scores
        """
        try:
            pipeline = [
                {
                    "$vectorSearch": {
                        "index": settings.mongodb_vector_index_name,
                        "path": "embedding",
                        "queryVector": query_embedding,
                        "numCandidates": settings.vector_search_num_candidates,
                        "limit": limit,
                        "filter": {
                            "user_id": {"$eq": user_id}
                        }
                    }
                },
                {
                    "$project": {
                        "_id": 1,
                        "title": 1,
                        "content": 1,
                        "user_id": 1,
                        "tags": 1,
                        "created_at": 1,
                        "updated_at": 1,
                        "score": {"$meta": "vectorSearchScore"}
                    }
                }
            ]
            
            cursor = self.collection.aggregate(pipeline)
            results = await cursor.to_list(length=limit)
            
            # Convert ObjectId to string
            for result in results:
                result["_id"] = str(result["_id"])
            
            return results
            
        except Exception as e:
            logger.error(f"Vector search error: {str(e)}")
            raise Exception(f"Vector search failed: {str(e)}")
    
    async def list_notes(self, user_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """List all notes for a user"""
        cursor = self.collection.find(
            {"user_id": user_id},
            {"embedding": 0}  # Exclude embedding from results
        ).sort("updated_at", -1).limit(limit)
        
        notes = await cursor.to_list(length=limit)
        
        for note in notes:
            note["_id"] = str(note["_id"])
        
        return notes


# Global MongoDB service instance
mongodb_service = MongoDBService()


async def get_mongodb() -> MongoDBService:
    """Dependency to get MongoDB service"""
    return mongodb_service
