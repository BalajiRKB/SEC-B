# FastAPI Backend - Quick Reference

## 🚀 Quick Commands

```bash
# Setup (first time)
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with credentials

# Run Backend
./start.sh
# OR
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Test Backend
python test_api.py

# Docker
docker-compose up -d        # Start
docker-compose logs -f api  # Logs
docker-compose down         # Stop
```

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info |
| GET | `/health` | Health check |
| GET | `/docs` | Interactive docs |
| POST | `/api/notes` | Create note with embedding |
| POST | `/api/search` | Vector similarity search |
| GET | `/api/notes/{user_id}` | List user's notes |

## 📋 Setup Checklist

### Before You Start
- [ ] Python 3.11+ installed
- [ ] MongoDB Atlas account created
- [ ] OpenAI API key obtained

### Backend Setup
- [ ] Clone/navigate to `backend/` directory
- [ ] Create virtual environment (`python -m venv venv`)
- [ ] Activate venv (`source venv/bin/activate`)
- [ ] Install dependencies (`pip install -r requirements.txt`)
- [ ] Copy `.env.example` to `.env`
- [ ] Add `OPENAI_API_KEY` to `.env`
- [ ] Add `MONGODB_URI` to `.env`

### MongoDB Atlas Setup
- [ ] Create MongoDB Atlas cluster (M0 free tier OK)
- [ ] Create database user with password
- [ ] Whitelist IP address (0.0.0.0/0 for dev)
- [ ] Get connection string
- [ ] Create database: `notes_rag`
- [ ] Create collection: `notes`
- [ ] **Create vector index: `vector_index`** (CRITICAL!)
- [ ] Wait 5-10 minutes for index to build
- [ ] Verify index status is "Active"

### Test Backend
- [ ] Start backend (`./start.sh` or `uvicorn app.main:app --reload`)
- [ ] Open http://localhost:8000/docs
- [ ] Check `/health` endpoint (should show all ✓)
- [ ] Run test script (`python test_api.py`)
- [ ] Create a test note via `/docs`
- [ ] Search for the note
- [ ] Verify results have similarity scores

### React Native Integration
- [ ] Update `SEC-B/services/vertexAI.ts` with real API calls
- [ ] Set `API_BASE_URL` correctly for your device
- [ ] Test note creation from app
- [ ] Test search from app
- [ ] Verify related notes sidebar works

## 🔧 Environment Variables

```env
# Required
OPENAI_API_KEY=sk-...
MONGODB_URI=mongodb+srv://...

# Optional (defaults shown)
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
MONGODB_DATABASE=notes_rag
MONGODB_COLLECTION=notes
MONGODB_VECTOR_INDEX_NAME=vector_index
```

## 🏗️ Architecture

```
┌─────────────────────┐
│  React Native App   │
│  (SEC-B/)           │
└──────────┬──────────┘
           │ HTTP POST/GET
           ↓
┌─────────────────────┐
│  FastAPI Backend    │
│  (backend/)         │
├─────────────────────┤
│  • CORS Middleware  │
│  • Pydantic Valid.  │
│  • API Routes       │
└──────┬──────┬───────┘
       │      │
       ↓      ↓
┌───────────┐ ┌──────────────────┐
│  OpenAI   │ │  MongoDB Atlas   │
│  API      │ │                  │
│           │ │  • notes_rag DB  │
│  text-    │ │  • notes coll.   │
│  embedding│ │  • vector_index  │
│  -3-small │ │  • $vectorSearch │
└───────────┘ └──────────────────┘
```

## 📊 MongoDB Vector Index

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

**Index Name:** `vector_index`  
**Database:** `notes_rag`  
**Collection:** `notes`  
**Build Time:** 5-10 minutes  
**Status:** Must be "Active" before searching

## 🧪 Testing Flow

1. **Health Check**
   ```bash
   curl http://localhost:8000/health
   ```
   Should return: `{"status": "healthy", ...}`

2. **Create Note**
   ```bash
   curl -X POST http://localhost:8000/api/notes \
     -H "Content-Type: application/json" \
     -d '{"title":"Test","content":"Testing vector search","user_id":"test123","tags":[]}'
   ```

3. **Search**
   ```bash
   curl -X POST http://localhost:8000/api/search \
     -H "Content-Type: application/json" \
     -d '{"query":"vector search","user_id":"test123","limit":5}'
   ```

4. **List Notes**
   ```bash
   curl http://localhost:8000/api/notes/test123
   ```

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| `Import "fastapi" could not be resolved` | Lint error - ignore, or install deps |
| `Authentication failed` | Check MongoDB URI, password encoding |
| `Vector index not found` | Wait 10 min, check index name, verify "Active" |
| `Network request failed` | Check backend is running, correct URL |
| `OpenAI API error` | Verify API key, check credits |
| `CORS error` | Check CORS_ORIGINS in config |

## 📱 Device-Specific URLs

**iOS Simulator:**
```typescript
const API_BASE_URL = 'http://localhost:8000/api';
```

**Android Emulator:**
```typescript
const API_BASE_URL = 'http://10.0.2.2:8000/api';
```

**Physical Device (same WiFi):**
```typescript
const API_BASE_URL = 'http://YOUR_COMPUTER_IP:8000/api';
// Find IP: ifconfig (Mac) or ipconfig (Windows)
```

## 📚 Documentation Files

1. **README.md** - Complete API documentation
2. **MONGODB_SETUP.md** - Step-by-step MongoDB setup
3. **REACT_NATIVE_INTEGRATION.md** - Frontend integration
4. **IMPLEMENTATION_SUMMARY.md** - What was built
5. This file - Quick reference

## 🎯 Success Criteria

✅ Backend starts without errors  
✅ `/health` shows all green checkmarks  
✅ Can create notes via `/docs`  
✅ Can search notes and get similarity scores  
✅ Test script (`test_api.py`) passes all tests  
✅ React Native app can connect to backend  
✅ Notes save with embeddings  
✅ Related notes appear in sidebar  

## 📦 Dependencies

```
fastapi==0.115.5           # Web framework
uvicorn==0.32.1            # ASGI server
motor==3.6.0               # Async MongoDB
openai==1.58.1             # OpenAI API
pydantic==2.10.3           # Validation
pydantic-settings==2.6.1   # Settings management
```

## 🔐 Security Notes

**Development:**
- CORS allows all origins (`*`)
- MongoDB IP whitelist: `0.0.0.0/0`

**Production:**
- Set specific CORS origins
- Whitelist specific IPs only
- Use secrets manager for API keys
- Enable rate limiting
- Add authentication

## 🚢 Deployment

**Quick Deploy Options:**
1. **Railway** - Click deploy from GitHub
2. **Render** - Auto-deploy on git push
3. **Docker** - `docker-compose up -d`

**Environment Variables to Set:**
- `OPENAI_API_KEY`
- `MONGODB_URI`
- All others have sensible defaults

## 💡 Pro Tips

1. **Vector Index** - MUST be created manually in Atlas UI
2. **Wait Time** - Index takes 5-10 min to build
3. **Test Early** - Use test_api.py to catch issues
4. **Logs** - Check uvicorn output for errors
5. **CORS** - Adjust origins for your setup
6. **Embeddings** - Combined title+content+tags for best results
7. **Similarity** - Scores > 0.7 are usually relevant

## 📞 Support Resources

- [FastAPI Docs](https://fastapi.tiangolo.com)
- [MongoDB Atlas Vector Search](https://www.mongodb.com/docs/atlas/atlas-vector-search/)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- Backend `/docs` endpoint for API reference

---

**Ready?** Run `./start.sh` and visit http://localhost:8000/docs 🚀
