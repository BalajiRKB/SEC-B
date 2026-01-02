#!/usr/bin/env python3
"""
Check MongoDB Vector Search Index Status
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check_indexes():
    """Check if vector search index exists"""
    client = AsyncIOMotorClient(os.getenv("MONGODB_URI"))
    
    try:
        # Connect to database
        db = client[os.getenv("MONGODB_DATABASE", "notes_rag")]
        collection = db[os.getenv("MONGODB_COLLECTION", "notes")]
        
        print("🔍 Checking MongoDB Vector Search Index...\n")
        
        # Check collection exists
        collections = await db.list_collection_names()
        if os.getenv("MONGODB_COLLECTION", "notes") in collections:
            print(f"✓ Collection '{os.getenv('MONGODB_COLLECTION', 'notes')}' exists")
            
            # Get document count
            count = await collection.count_documents({})
            print(f"✓ Documents in collection: {count}")
        else:
            print(f"✗ Collection '{os.getenv('MONGODB_COLLECTION', 'notes')}' does not exist yet")
        
        # List indexes
        print("\n📋 Current Indexes:")
        indexes = await collection.list_indexes().to_list(length=100)
        for idx in indexes:
            print(f"  • {idx.get('name')}: {idx.get('key', {})}")
        
        # Check for vector search index
        # Note: Vector search indexes are created through Atlas UI or API
        # They don't show up in regular index listings
        
        print("\n" + "="*60)
        print("📌 IMPORTANT: Vector Search Index Setup")
        print("="*60)
        print("""
Vector Search indexes must be created through MongoDB Atlas UI:

1. Go to: https://cloud.mongodb.com/
2. Select your cluster
3. Click "Search" tab (Atlas Search)
4. Click "Create Search Index"
5. Choose "JSON Editor"
6. Select database: notes_rag
7. Select collection: notes
8. Name: vector_index
9. Paste this configuration:

{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "user_id"
    }
  ]
}

10. Click "Create Search Index"
11. Wait 2-5 minutes for index to become "Active"

After creating the index, search functionality will work!
        """)
        
        # Test a simple query to see if any documents have embeddings
        sample = await collection.find_one({"user_id": "demo-user"})
        if sample:
            print("\n📝 Sample Document Structure:")
            print(f"  • _id: {sample.get('_id')}")
            print(f"  • title: {sample.get('title')}")
            print(f"  • user_id: {sample.get('user_id')}")
            print(f"  • tags: {sample.get('tags', [])}")
            has_embedding = 'embedding' in sample
            print(f"  • embedding: {'✓ Present' if has_embedding else '✗ Missing'} ({len(sample.get('embedding', []))} dimensions)" if has_embedding else "  • embedding: ✗ Missing")
        
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_indexes())
