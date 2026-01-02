# MindVault MVP - Setup & Testing Guide

## 🧠 What is MindVault?

**MindVault** is a semantic personal notes application that understands the *meaning* of your thoughts, not just exact keywords. It's your second brain powered by AI embeddings and vector search.

### The Magic: How It Works

1. **Capture**: Write a note like "The sunset at the beach yesterday was calming"
2. **Vectorization**: The backend converts your note into a 768-dimensional vector (mathematical representation) using Google Gemini
3. **Storage**: Note + vector are stored in MongoDB Atlas with a Vector Search index
4. **Semantic Search**: Later, search for "peaceful evening memories" and MindVault finds your sunset note because "peaceful" ≈ "calming" in vector space!

### Core Features Implemented

✅ **Natural Language Search** - Search by "vibe" not keywords
✅ **Real-time Related Notes** - As you type, see semantically similar notes
✅ **AI Tag Suggestions** - Gemini analyzes content and suggests relevant tags
✅ **Vector Embeddings** - 768-dimensional Gemini text-embedding-004
✅ **MongoDB Atlas Vector Search** - Cosine similarity with user filtering
✅ **React Native UI** - Beautiful Material Design 3 interface

---

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18+)
2. **Python** (3.11+)
3. **MongoDB Atlas Account** (free tier works!)
4. **Google AI Studio API Key** (free at https://aistudio.google.com/app/apikey)
5. **Expo Go** app on your phone (or Android emulator)

### Step 1: Backend Setup

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Create .env file (already has values, just verify)
cat .env.example

# The .env.example already contains:
# - GEMINI_API_KEY=AIzaSyDdtdf0rc3w40TXQA1uopz1J2osQj_mIr4
# - MONGODB_URI=mongodb+srv://rkb:sec-b22@cluster0.cxhm4h6.mongodb.net/

# Start the FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 2: MongoDB Atlas Vector Index Setup

**CRITICAL**: The vector index must be configured with 768 dimensions for Gemini embeddings.

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Navigate to your cluster → Browse Collections
3. Select database: `notes_rag`, collection: `notes`
4. Click "Search Indexes" → "Create Search Index"
5. Choose "JSON Editor" and paste:

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

6. Name it: `vector_index`
7. Click "Create" and wait ~2 minutes for indexing

### Step 3: Frontend Setup

```bash
cd SEC-B

# Install dependencies
npm install

# Start Expo dev server
npx expo start

# Scan QR code with Expo Go app (iOS/Android)
# Or press 'a' for Android emulator, 'i' for iOS simulator
```

### Step 4: Test the Complete Flow

1. **Health Check**: Open http://localhost:8000/health in browser
2. **API Docs**: Visit http://localhost:8000/docs to see all endpoints
3. **Open App**: In Expo Go, tap "MindVault" from the home screen
4. **Create Note**: Tap the + button, write: "The sunset at the beach was peaceful and calming"
5. **Add Tags**: See AI suggest tags like #nature, #relaxation
6. **Related Notes**: Start typing another note about "morning yoga" - related notes sidebar appears if you have similar notes
7. **Semantic Search**: Go back to main screen, search "calm evening" - your sunset note appears even though you didn't use those exact words!

---

## 📖 User Workflow Walkthrough

### Scenario: Your Second Brain in Action

**Day 1 - Capture Ideas:**
```
Title: "Beach Meditation"
Content: "The sunset at the beach yesterday was calming. 
          The sound of waves helped me relax deeply."
Tags: #relaxation, #nature (AI suggested)
```

**Day 30 - Search by Vibe:**
```
Search: "peaceful evening memories"
Results: ✅ "Beach Meditation" (85% match)
         ✅ "Evening Walk" (78% match)
         ✅ "Tea Time Reflection" (71% match)
```

Even though you never used "peaceful" or "evening" in the beach note, MindVault understands:
- "peaceful" ≈ "calming" (semantically similar)
- "evening" ≈ "sunset" (contextually related)
- "memories" ≈ "yesterday" (temporal connection)

This is **semantic search** in action!

---

## 🧪 Testing Checklist

### Backend Tests

```bash
# Test health endpoint
curl http://localhost:8000/health

# Expected output:
# {
#   "status": "healthy",
#   "version": "1.0.0",
#   "mongodb_connected": true,
#   "gemini_configured": true
# }

# Test note creation
curl -X POST http://localhost:8000/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Note",
    "content": "This is a test of the vector embedding system",
    "user_id": "demo-user",
    "tags": ["test"]
  }'

# Test semantic search
curl -X POST http://localhost:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "testing embeddings",
    "user_id": "demo-user",
    "limit": 5,
    "min_score": 0.7
  }'

# Test tag suggestions
curl -X POST http://localhost:8000/api/suggest-tags \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Morning Routine",
    "content": "Wake up at 6am, meditate for 20 minutes, then exercise"
  }'
```

### Frontend Tests

1. **Main Screen (mindvault.tsx)**
   - [ ] Opens without errors
   - [ ] Shows loading spinner initially
   - [ ] Loads all user notes (if any exist)
   - [ ] Search bar accepts input
   - [ ] Semantic search returns results
   - [ ] Similarity scores display correctly (70-100%)
   - [ ] Pull to refresh works
   - [ ] FAB button navigates to note editor

2. **Note Editor (note-detail.tsx)**
   - [ ] Title and content inputs work
   - [ ] Tag suggestions appear after typing (wait 1 second)
   - [ ] Can add/remove tags manually
   - [ ] Can add AI-suggested tags by tapping
   - [ ] Related notes sidebar appears after typing ~20 chars
   - [ ] Related notes show similarity scores
   - [ ] Save button creates note successfully
   - [ ] Returns to main screen after save

3. **API Integration (services/api.ts)**
   - [ ] createNote() saves to backend
   - [ ] searchNotes() returns semantic results
   - [ ] getUserNotes() fetches all notes
   - [ ] findRelatedNotes() shows similar notes
   - [ ] getTagSuggestions() returns AI tags
   - [ ] Error handling shows alerts

---

## 🎯 Key Endpoints

### POST `/api/notes` - Create Note
```json
{
  "title": "Beach Day",
  "content": "Watched the sunset, very peaceful",
  "user_id": "demo-user",
  "tags": ["relaxation", "nature"]
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Beach Day",
  "content": "Watched the sunset, very peaceful",
  "user_id": "demo-user",
  "tags": ["relaxation", "nature"],
  "created_at": "2026-01-02T12:00:00Z",
  "updated_at": "2026-01-02T12:00:00Z"
}
```

### POST `/api/search` - Semantic Search
```json
{
  "query": "calm evening",
  "user_id": "demo-user",
  "limit": 10,
  "min_score": 0.7
}
```

**Response:**
```json
{
  "results": [
    {
      "note": { /* note object */ },
      "score": 0.85
    }
  ],
  "query": "calm evening",
  "total": 1
}
```

### POST `/api/suggest-tags` - AI Tag Suggestions
```json
{
  "title": "Morning Routine",
  "content": "Wake up, meditate, exercise"
}
```

**Response:**
```json
{
  "suggestions": [
    { "tag": "health", "confidence": 0.92 },
    { "tag": "morning", "confidence": 0.88 },
    { "tag": "wellness", "confidence": 0.85 }
  ]
}
```

---

## 🔧 Troubleshooting

### Backend Issues

**Problem**: "Gemini API error"
- **Solution**: Verify GEMINI_API_KEY in `.env`
- Check quota at https://aistudio.google.com

**Problem**: "MongoDB connection timeout"
- **Solution**: Check MONGODB_URI, verify network access in Atlas

**Problem**: "Vector search returns empty"
- **Solution**: 
  1. Wait 2-5 minutes for index to build
  2. Verify index has 768 dimensions (not 1536!)
  3. Check that notes exist for the user

### Frontend Issues

**Problem**: "Network request failed"
- **Solution**: 
  1. Make sure backend is running on port 8000
  2. Update API_BASE_URL in `services/api.ts` if needed
  3. For physical device: Use your computer's IP instead of localhost
     ```typescript
     const API_BASE_URL = 'http://192.168.1.100:8000/api';
     ```

**Problem**: "Related notes not appearing"
- **Solution**: 
  1. Type at least 20 characters
  2. Wait 1.5 seconds for debounce
  3. Ensure backend is running and reachable

**Problem**: TypeScript errors about routes
- **Solution**: These are expected type errors for new routes. The app will still run.

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native (Expo)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  MindVault   │  │ Note Editor  │  │  API Service │      │
│  │  (Search UI) │  │  (Compose)   │  │  (api.ts)    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                    HTTP REST API
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                     FastAPI Backend                           │
│  ┌──────────────────────────┴─────────────────────────────┐  │
│  │               Routes (notes.py)                        │  │
│  │  • POST /api/notes      - Create with embedding       │  │
│  │  • POST /api/search     - Semantic vector search      │  │
│  │  • POST /api/suggest-tags - AI tag generation         │  │
│  └──────┬──────────────────────────────────┬──────────────┘  │
│         │                                   │                 │
│  ┌──────▼───────────┐              ┌───────▼──────────┐      │
│  │ Gemini Service   │              │ MongoDB Service  │      │
│  │ • Generate       │              │ • CRUD ops       │      │
│  │   embeddings     │              │ • Vector search  │      │
│  │ • 768 dimensions │              │ • Aggregation    │      │
│  └──────┬───────────┘              └───────┬──────────┘      │
└─────────┼──────────────────────────────────┼─────────────────┘
          │                                   │
          ▼                                   ▼
  ┌───────────────┐                  ┌─────────────────┐
  │ Google Gemini │                  │  MongoDB Atlas  │
  │   text-       │                  │  • Vector Index │
  │   embedding-  │                  │  • Cosine       │
  │   004         │                  │    similarity   │
  └───────────────┘                  └─────────────────┘
```

---

## 🎓 Learning Resources

### Vector Embeddings
- What are embeddings? Numbers that represent meaning
- Similar meanings = close vectors in 768-D space
- Cosine similarity measures how "close" two vectors are (0-1 scale)

### MongoDB Atlas Vector Search
- `$vectorSearch`: Aggregation operator for similarity search
- Index must match embedding dimensions (768 for Gemini)
- Supports filtering (e.g., by user_id)

### Google Gemini API
- `text-embedding-004`: Latest embedding model
- 768 dimensions (vs OpenAI's 1536)
- Free tier: Generous quota for testing
- Different task types: `retrieval_document` vs `retrieval_query`

---

## 🚢 Production Considerations

Before deploying MindVault to production:

1. **Authentication**: Replace `getCurrentUserId()` with real auth (Firebase, Auth0)
2. **Environment Variables**: Never commit API keys! Use proper .env management
3. **Error Handling**: Add proper error boundaries and user-friendly messages
4. **Rate Limiting**: Implement rate limits on API endpoints
5. **Monitoring**: Add logging and analytics (Sentry, DataDog)
6. **Vector Index**: Monitor index size and query performance
7. **Backup**: Set up MongoDB Atlas backups
8. **HTTPS**: Use SSL certificates for production API
9. **CORS**: Restrict CORS origins to your production domain
10. **Testing**: Add unit tests, integration tests, E2E tests

---

## 📝 Next Steps for MVP Enhancement

1. **Note Editing**: Add update/delete endpoints
2. **Offline Support**: Add local storage with sync
3. **Collaborative Notes**: Share notes between users
4. **Export**: Export notes to PDF/Markdown
5. **Voice Input**: Speech-to-text for quick capture
6. **Images**: Add image attachments with vision embeddings
7. **Analytics**: Track most-used tags, search patterns
8. **Desktop App**: Electron wrapper for desktop

---

## 🎉 You're Ready!

You now have a working MVP of MindVault - a semantic personal notes application that truly understands your thoughts. The magic happens when you realize you can find notes by their *meaning* rather than exact words.

Try it out:
1. Create 5-10 diverse notes about different topics
2. Use natural language searches
3. Watch as semantically similar notes surface
4. Experience your second brain in action!

**Questions?** Check the API docs at http://localhost:8000/docs

**Issues?** See troubleshooting section above

Happy note-taking! 🧠✨
