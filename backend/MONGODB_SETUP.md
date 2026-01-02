# MongoDB Atlas Vector Search Setup Guide

Complete guide to set up MongoDB Atlas with Vector Search for the RAG backend.

## Step 1: Create MongoDB Atlas Account

1. Go to [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account (M0 tier includes vector search)
3. Verify your email

## Step 2: Create a Cluster

1. Click **"Build a Database"**
2. Choose **"M0 Free"** tier
3. Select your preferred **Cloud Provider** (AWS, Google Cloud, or Azure)
4. Choose a **Region** (pick closest to your location)
5. Name your cluster (e.g., `notes-cluster`)
6. Click **"Create"**
7. Wait 1-3 minutes for cluster to deploy

## Step 3: Configure Database Access

### Create Database User

1. Go to **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Set username: `notesuser` (or your choice)
5. Generate a strong password (save it!)
6. Set permissions: **"Atlas admin"** or **"Read and write to any database"**
7. Click **"Add User"**

## Step 4: Configure Network Access

1. Go to **"Network Access"** in left sidebar
2. Click **"Add IP Address"**
3. Choose one:
   - **Allow Access from Anywhere**: `0.0.0.0/0` (for development)
   - **Add Your Current IP**: Auto-detects your IP
   - **Add Specific IP**: Enter your server's IP
4. Click **"Confirm"**

⚠️ **For production**: Only whitelist specific IPs, not `0.0.0.0/0`

## Step 5: Get Connection String

1. Go to **"Database"** in left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Driver"**: Python, **"Version"**: 3.11 or later
5. Copy the connection string:
   ```
   mongodb+srv://notesuser:<password>@notes-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual password
7. Save this in your backend `.env` file as `MONGODB_URI`

## Step 6: Create Database and Collection

### Using MongoDB Compass (GUI)

1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect using your connection string
3. Click **"Create Database"**
4. Database name: `notes_rag`
5. Collection name: `notes`
6. Click **"Create Database"**

### Using Python (Alternative)

```python
from pymongo import MongoClient

client = MongoClient("your-connection-string")
db = client.notes_rag
collection = db.notes

# Test insert
collection.insert_one({
    "title": "Test",
    "content": "Testing",
    "user_id": "test",
    "tags": [],
    "embedding": [0.1] * 768
})

print("Database and collection created!")
```

## Step 7: Create Vector Search Index

**⚠️ CRITICAL STEP** - Vector search will not work without this!

### Using Atlas UI (Recommended)

1. In Atlas, go to **"Database"** → Your Cluster
2. Click **"Search"** tab
3. Click **"Create Search Index"**
4. Choose **"JSON Editor"**
5. Select your database: `notes_rag`
6. Select your collection: `notes`
7. Name your index: `vector_index`
8. Paste this JSON definition:

```json
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
```

9. Click **"Next"**
10. Review and click **"Create Search Index"**

### Index Configuration Explained

```json
{
  "fields": [
    {
      "type": "vector",           // Vector search field
      "path": "embedding",        // Field name in documents
      "numDimensions": 768,       // Google Gemini text-embedding-004 dimensions
      "similarity": "cosine"      // Cosine similarity (best for embeddings)
    },
    {
      "type": "filter",           // Pre-filter field
      "path": "user_id"          // Filter by user before vector search
    }
  ]
}
```

**Index Building Time**: 5-10 minutes (shows "Building" status)

### Verify Index Status

1. Go to **"Search"** tab in your cluster
2. Find your `vector_index`
3. Wait until status shows **"Active"** (green checkmark)

## Step 8: Test the Setup

### Using MongoDB Compass

1. Connect to your cluster
2. Navigate to `notes_rag` → `notes`
3. Should see empty collection (ready for data)

### Using Python Test Script

```python
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def test_connection():
    client = AsyncIOMotorClient("your-connection-string")
    
    # Test connection
    await client.admin.command('ping')
    print("✓ Connected to MongoDB")
    
    # Get collection
    db = client.notes_rag
    collection = db.notes
    
    # Insert test document
    result = await collection.insert_one({
        "title": "Test Note",
        "content": "This is a test",
        "user_id": "test123",
        "tags": ["test"],
        "embedding": [0.1] * 768  # Gemini embedding dimensions
    })
    
    print(f"✓ Inserted document: {result.inserted_id}")
    
    # Test vector search (requires index to be active)
    try:
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": [0.1] * 768,  # Gemini embedding dimensions
                    "numCandidates": 100,
                    "limit": 5
                }
            }
        ]
        
        cursor = collection.aggregate(pipeline)
        results = await cursor.to_list(length=5)
        print(f"✓ Vector search returned {len(results)} results")
    except Exception as e:
        print(f"⚠️  Vector search error (index may still be building): {e}")
    
    client.close()

asyncio.run(test_connection())
```

## Step 9: Update Backend Configuration

In `backend/.env`:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://notesuser:YOUR_PASSWORD@notes-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=notes_rag
MONGODB_COLLECTION=notes
MONGODB_VECTOR_INDEX_NAME=vector_index
```

## Step 10: Start Backend and Test

```bash
cd backend
uvicorn app.main:app --reload

# In another terminal
python test_api.py
```

Expected output:
- ✓ MongoDB connected
- ✓ Notes created
- ✓ Vector search working

## Troubleshooting

### "Authentication failed"
- Check username/password in connection string
- Verify user has correct permissions
- Password may contain special characters (URL encode them)

### "Network error"
- Check IP whitelist in Network Access
- Try adding `0.0.0.0/0` for testing
- Check firewall settings

### "Index not found"
- Wait 5-10 minutes for index to build
- Verify index name matches `.env` config
- Check index is on correct database/collection
- Ensure index status is "Active"

### "Vector search returns empty"
- Index may still be building
- No documents in collection yet
- Check `user_id` filter matches your test data
- Verify embedding dimensions (must be 768 for Gemini text-embedding-004)

### Special Characters in Password

If your password has special characters, URL encode them:

```
@ → %40
: → %3A
/ → %2F
? → %3F
# → %23
[ → %5B
] → %5D
```

Example:
```
Password: Pass@123#
Encoded:  Pass%40123%23
```

## Index Best Practices

### For Development
- Use M0 (free tier)
- Single index on `embedding` field
- Cosine similarity
- Include `user_id` filter
- 768 dimensions for Gemini text-embedding-004

### For Production
- Upgrade to M10+ for better performance
- Monitor index size and query performance
- Use Atlas Search analytics
- Implement index optimization based on usage patterns

### Performance Tuning

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
      // Add for better recall:
      // "quantization": {
      //   "type": "scalar"
      // }
    },
    {
      "type": "filter",
      "path": "user_id"
    },
    // Optional: Add more filters
    {
      "type": "filter",
      "path": "created_at"
    }
  ]
}
```

## Monitoring

### Atlas UI
1. Go to **"Metrics"** tab
2. Monitor:
   - Connection count
   - Query performance
   - Index usage
   - Storage size

### Application Logs
```bash
# Check backend logs
docker-compose logs -f api

# Or with uvicorn
# Logs will show MongoDB connection status
```

## Backup and Recovery

### Enable Backups
1. Go to **"Backup"** tab
2. Enable **"Cloud Backup"**
3. Set snapshot frequency

### Export Data
```bash
# Using mongodump
mongodump --uri="your-connection-string" --out=backup/

# Using Atlas
# Download from "Data Explorer" → "Export Collection"
```

## Scaling

### When to Upgrade from M0

Upgrade when:
- More than 100k documents
- Search queries > 100/second
- Need dedicated RAM
- Require faster index builds
- Need additional features

### Recommended Tiers
- **M10**: Small production apps (5-10k users)
- **M20**: Medium apps (10-50k users)
- **M30+**: Large apps (50k+ users)

## Security

### Production Checklist
- [ ] Strong passwords for database users
- [ ] IP whitelist (no `0.0.0.0/0`)
- [ ] Enable audit logs
- [ ] Set up monitoring alerts
- [ ] Regular backups
- [ ] Use VPC peering for AWS/GCP/Azure
- [ ] Enable encryption at rest
- [ ] Use TLS/SSL for connections

## Cost Optimization

### Free Tier (M0)
- 512 MB storage
- Shared RAM
- Perfect for development
- Includes vector search!

### Paid Tiers
- M10: ~$0.08/hour (~$57/month)
- Monitor using Cost Explorer
- Set up spending alerts

---

🎉 **Setup Complete!**

Your MongoDB Atlas cluster is ready for vector search. Start the backend and create your first embedded note!

For issues, check:
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Vector Search Guide](https://www.mongodb.com/docs/atlas/atlas-vector-search/)
- Backend logs at `/health` endpoint
