# Notes RAG Backend API

FastAPI backend for MongoDB Atlas Vector Search RAG application with OpenAI embeddings.

## Features

- ✅ **POST /api/notes** - Create notes with automatic OpenAI `text-embedding-3-small` embedding generation
- ✅ **POST /api/search** - Vector search with `$vectorSearch`, userId filter, cosine similarity
- ✅ **GET /api/notes/{user_id}** - List user's notes
- ✅ **Motor** for async MongoDB operations
- ✅ **CORS** enabled for React Native apps
- ✅ **422 validation** for empty content
- ✅ **Docker** support with Docker Compose
- ✅ **Health checks** for monitoring
- ✅ **OpenAPI documentation** at `/docs`

## Architecture

```
┌─────────────────┐
│  React Native   │
│   Frontend      │
└────────┬────────┘
         │ HTTP/REST
         ↓
┌─────────────────┐
│   FastAPI       │
│   Backend       │
├─────────────────┤
│ • CORS          │
│ • Validation    │
│ • Routes        │
└────┬──────┬─────┘
     │      │
     ↓      ↓
┌─────────┐ ┌──────────────┐
│ OpenAI  │ │  MongoDB     │
│ API     │ │  Atlas       │
│         │ │              │
│ text-   │ │ Vector       │
│ embedding│ │ Search       │
└─────────┘ └──────────────┘
```

## Prerequisites

- Python 3.11+
- MongoDB Atlas account with Vector Search enabled
- OpenAI API key
- Docker (optional, for containerized deployment)

## Quick Start

### 1. Clone and Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
```

### 3. Setup MongoDB Atlas Vector Index

**Important:** You must create a vector search index in MongoDB Atlas before the search will work.

1. Go to [MongoDB Atlas Console](https://cloud.mongodb.com)
2. Navigate to your cluster → Database → Search
3. Click "Create Search Index" → "JSON Editor"
4. Use this index definition:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "user_id"
    }
  ]
}
```

5. Name the index: `vector_index` (or update `MONGODB_VECTOR_INDEX_NAME` in `.env`)
6. Select your database and collection (`notes_rag` / `notes` by default)
7. Click "Create Search Index"

**Wait 5-10 minutes** for the index to build before testing search.

### 4. Run the API

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health**: http://localhost:8000/health

## Docker Deployment

### Build and Run with Docker Compose

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Build Docker Image Manually

```bash
# Build
docker build -t notes-rag-api .

# Run
docker run -d \
  -p 8000:8000 \
  --env-file .env \
  --name notes-api \
  notes-rag-api
```

## API Endpoints

### POST /api/notes

Create a new note with automatic embedding generation.

**Request:**
```json
{
  "title": "Meeting Notes",
  "content": "Discussed project timeline and deliverables",
  "user_id": "user123",
  "tags": ["work", "meeting"]
}
```

**Response (201):**
```json
{
  "_id": "67890abc",
  "title": "Meeting Notes",
  "content": "Discussed project timeline and deliverables",
  "user_id": "user123",
  "tags": ["work", "meeting"],
  "created_at": "2025-12-30T10:30:00Z",
  "updated_at": "2025-12-30T10:30:00Z"
}
```

**Validation (422):**
- Title cannot be empty
- Content cannot be empty
- User ID required

### POST /api/search

Search notes using vector similarity.

**Request:**
```json
{
  "query": "project meetings",
  "user_id": "user123",
  "limit": 10
}
```

**Response (200):**
```json
{
  "results": [
    {
      "note": {
        "_id": "67890abc",
        "title": "Meeting Notes",
        "content": "Discussed project timeline...",
        "user_id": "user123",
        "tags": ["work", "meeting"],
        "created_at": "2025-12-30T10:30:00Z",
        "updated_at": "2025-12-30T10:30:00Z"
      },
      "score": 0.89
    }
  ],
  "query": "project meetings",
  "count": 1
}
```

**Features:**
- Cosine similarity scoring
- User-specific filtering (`user_id` filter)
- Returns up to 10 results (configurable 1-50)
- Scores range from 0-1 (higher = more similar)

### GET /api/notes/{user_id}

List all notes for a user.

**Response (200):**
```json
[
  {
    "_id": "67890abc",
    "title": "Meeting Notes",
    "content": "Discussed project timeline...",
    "user_id": "user123",
    "tags": ["work", "meeting"],
    "created_at": "2025-12-30T10:30:00Z",
    "updated_at": "2025-12-30T10:30:00Z"
  }
]
```

### GET /health

Health check endpoint.

**Response (200):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "mongodb_connected": true,
  "openai_configured": true
}
```

## Configuration

All settings in `app/config.py` can be overridden with environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | *required* | OpenAI API key |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` | Embedding model |
| `OPENAI_EMBEDDING_DIMENSIONS` | `1536` | Embedding dimensions |
| `MONGODB_URI` | *required* | MongoDB connection string |
| `MONGODB_DATABASE` | `notes_rag` | Database name |
| `MONGODB_COLLECTION` | `notes` | Collection name |
| `MONGODB_VECTOR_INDEX_NAME` | `vector_index` | Vector index name |
| `VECTOR_SEARCH_LIMIT` | `10` | Default search limit |
| `VECTOR_SEARCH_NUM_CANDIDATES` | `100` | Search candidates |
| `DEBUG` | `false` | Enable debug mode |

## Development

### Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Settings and environment
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py       # Pydantic models
│   ├── routes/
│   │   ├── __init__.py
│   │   └── notes.py         # API endpoints
│   └── services/
│       ├── __init__.py
│       ├── mongodb_service.py   # Motor async MongoDB
│       └── openai_service.py    # OpenAI embeddings
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

### Running Tests

```bash
# Install dev dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest

# With coverage
pytest --cov=app --cov-report=html
```

### Code Quality

```bash
# Format with black
black app/

# Lint with ruff
ruff check app/

# Type check with mypy
mypy app/
```

## MongoDB Atlas Vector Search Details

### Index Configuration

The vector search requires a specific index configuration:

- **Type**: `vector`
- **Path**: `embedding`
- **Dimensions**: `1536` (for text-embedding-3-small)
- **Similarity**: `cosine`
- **Filter**: `user_id` (for user-specific searches)

### Query Pipeline

The search uses MongoDB's aggregation pipeline:

```javascript
[
  {
    $vectorSearch: {
      index: "vector_index",
      path: "embedding",
      queryVector: [...], // 1536-dimensional vector
      numCandidates: 100,
      limit: 10,
      filter: {
        user_id: { $eq: "user123" }
      }
    }
  },
  {
    $project: {
      _id: 1,
      title: 1,
      content: 1,
      user_id: 1,
      tags: 1,
      created_at: 1,
      updated_at: 1,
      score: { $meta: "vectorSearchScore" }
    }
  }
]
```

### Performance Tips

1. **Index Build Time**: Initial index creation takes 5-10 minutes
2. **Search Performance**: ~50-200ms for typical queries
3. **Candidates**: Higher `numCandidates` = better recall, slower queries
4. **Limit**: Keep at 10-20 for best UX
5. **Filter Performance**: User filter is efficient with proper indexing

## OpenAI Embeddings

### Model: text-embedding-3-small

- **Dimensions**: 1536
- **Cost**: $0.02 per 1M tokens (~4,000 pages)
- **Performance**: ~50-100ms per embedding
- **Max Input**: 8,191 tokens

### Embedding Strategy

The API combines title, content, and tags for comprehensive semantic representation:

```python
combined_text = f"{title}\n\n{content}\n\nTags: {', '.join(tags)}"
embedding = await openai.embeddings.create(
    model="text-embedding-3-small",
    input=combined_text
)
```

## CORS Configuration

CORS is enabled for React Native development:

```python
CORS_ORIGINS = [
    "http://localhost:19000",  # Expo dev server
    "http://localhost:19002",  # Expo devtools
    "exp://localhost:19000",   # Expo Go
    "*"                        # Allow all (dev only)
]
```

For production, update `CORS_ORIGINS` in `.env` to specific domains.

## Error Handling

### 422 Unprocessable Entity

Returned for validation errors:

```json
{
  "detail": "Content cannot be empty"
}
```

### 500 Internal Server Error

Returned for server errors:

```json
{
  "detail": "Failed to create note: OpenAI API error"
}
```

### Common Issues

1. **Vector index not found**: Create the index in MongoDB Atlas
2. **OpenAI rate limit**: Implement retry logic or reduce request rate
3. **MongoDB connection timeout**: Check connection string and network
4. **Empty search results**: Index may still be building (wait 10 min)

## Monitoring

### Health Endpoint

Check `/health` for service status:

```bash
curl http://localhost:8000/health
```

### Logs

```bash
# Docker logs
docker-compose logs -f api

# Local logs
# Configure logging in app/main.py
```

## Production Deployment

### Environment Setup

1. Use production MongoDB Atlas cluster (M10+)
2. Set `DEBUG=false`
3. Configure specific CORS origins
4. Use multiple Uvicorn workers
5. Add reverse proxy (nginx)
6. Enable HTTPS
7. Set up monitoring (Datadog, New Relic)

### Scaling

```bash
# Multiple workers
uvicorn app.main:app --workers 4 --host 0.0.0.0 --port 8000

# With gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## License

MIT

## Support

For issues or questions:
- Check `/docs` for API documentation
- Review MongoDB Atlas Vector Search docs
- Check OpenAI embeddings documentation

---

Built with FastAPI, MongoDB Atlas, OpenAI, and Motor
