# 🧠 MindVault - Semantic Personal Notes MVP

> Your second brain that understands meaning, not just keywords

## ⚡ Quick Start (5 Minutes)

### 1. Start Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Test Backend (Optional)
```bash
python test_mindvault.py
```

### 3. Start Frontend
```bash
cd SEC-B
npm install
npx expo start
# Scan QR with Expo Go app
```

### 4. Use MindVault
1. Open app → Tap "MindVault"
2. Create note: "The sunset at the beach was calming"
3. Search: "peaceful evening" → Your note appears! 🎉

## 🎯 What Makes This Special?

**Traditional Search:**
- Search "sunset" → finds notes with word "sunset"
- Search "peaceful" → finds NOTHING ❌

**MindVault Semantic Search:**
- Search "peaceful evening" → finds "calming sunset" ✅
- Search "relaxing memories" → finds "meditation session" ✅
- Search by VIBE, not exact words! 🧠

## 🏗️ Architecture

```
React Native App (Expo)
         ↓
    FastAPI Backend
         ↓
   Google Gemini (768-D embeddings)
         ↓
MongoDB Atlas Vector Search (cosine similarity)
```

## ✨ Core Features

✅ **Semantic Search** - "Find by meaning, not words"
✅ **Related Notes Sidebar** - Real-time similar notes as you type
✅ **AI Tag Suggestions** - Gemini analyzes & suggests tags
✅ **Vector Embeddings** - 768-dimensional mathematical meaning
✅ **Beautiful UI** - Material Design 3

## 📚 Full Documentation

See [MINDVAULT_SETUP.md](./MINDVAULT_SETUP.md) for:
- Detailed setup instructions
- MongoDB Atlas vector index setup
- Complete API documentation
- Troubleshooting guide
- Architecture diagrams

## 🔑 Environment Setup

Backend `.env` (already configured):
```bash
GEMINI_API_KEY=AIzaSyDdtdf0rc3w40TXQA1uopz1J2osQj_mIr4
MONGODB_URI=mongodb+srv://rkb:sec-b22@cluster0.cxhm4h6.mongodb.net/
GEMINI_EMBEDDING_MODEL=models/text-embedding-004
GEMINI_EMBEDDING_DIMENSIONS=768
```

## 🎪 Demo Scenarios

### Scenario 1: Personal Journal
```
Day 1: "Morning coffee on the balcony, birds chirping"
Day 5: "Peaceful breakfast outside with nature sounds"
Search: "quiet morning routine" → Both notes found!
```

### Scenario 2: Work Notes
```
Note 1: "Project deadline approaching, need to finish dashboard"
Note 2: "Sprint planning: complete UI components by Friday"
Search: "upcoming tasks" → Both appear even without word "task"!
```

### Scenario 3: Learning
```
Note 1: "React hooks explanation - useState manages component state"
Note 2: "Component state management with hooks"
Search: "state management" → Finds both React notes
```

## 🚀 API Endpoints

### Create Note with Embedding
```bash
POST /api/notes
{
  "title": "Beach Day",
  "content": "Sunset was beautiful and calming",
  "user_id": "demo-user",
  "tags": ["nature"]
}
```

### Semantic Search
```bash
POST /api/search
{
  "query": "peaceful evening",
  "user_id": "demo-user",
  "min_score": 0.7
}
```

### AI Tag Suggestions
```bash
POST /api/suggest-tags
{
  "title": "Morning Workout",
  "content": "Jogging and yoga"
}
# Returns: [{"tag": "fitness", "confidence": 0.95}, ...]
```

## 🎓 How Semantic Search Works

1. **Note Created**: "The sunset at the beach was calming"
2. **Vectorization**: Gemini converts to 768 numbers: `[0.23, -0.45, 0.67, ...]`
3. **Storage**: Note + vector saved in MongoDB with index
4. **Search**: "peaceful evening" → also converted to 768 numbers
5. **Similarity**: MongoDB finds closest vectors using cosine similarity
6. **Result**: Your sunset note appears with 85% similarity!

**The Magic**: Words don't match, but *meaning* is mathematically close!

## 🔧 Troubleshooting

**Backend not starting?**
```bash
# Check MongoDB connection
curl http://localhost:8000/health
```

**No search results?**
- Wait 2-5 min for MongoDB vector index to build
- Verify index has 768 dimensions (not 1536!)
- Create a few test notes first

**Frontend can't connect?**
- Update `SEC-B/services/api.ts` with your computer's IP
- Make sure backend is on port 8000

## 📱 Screenshots

### Main Screen
- Natural language search bar
- Note list with similarity scores
- Pull to refresh
- FAB for quick note creation

### Note Editor
- Rich text editing
- Real-time AI tag suggestions
- Related notes sidebar (auto-updates as you type!)
- Save with embedding generation

## 🎯 Next Steps

After trying the MVP:

1. **Add More Notes** - Create 10+ diverse notes to see semantic magic
2. **Experiment with Searches** - Try abstract concepts like "stressful" or "inspiring"
3. **Watch Related Notes** - Start typing a new note, watch sidebar populate!
4. **Check Similarity Scores** - See how "close" notes are (70% = related, 90% = very similar)

## 📊 Tech Stack

- **Frontend**: React Native + Expo Router + TypeScript
- **Backend**: FastAPI + Python 3.11
- **Database**: MongoDB Atlas with Vector Search
- **AI**: Google Gemini text-embedding-004
- **Styling**: Material Design 3

## 🌟 What's Unique?

Most note apps use:
- Keywords (must type exact words)
- Tags (manual categorization)
- Full-text search (find text, not meaning)

MindVault uses:
- **Vector embeddings** (mathematical meaning)
- **Semantic similarity** (find by context)
- **AI understanding** (no manual work)

## 🤝 Contributing

This is an MVP demonstrating semantic search for personal notes. Feel free to:
- Add features (note editing, images, voice input)
- Improve UI/UX
- Add authentication
- Deploy to production

## 📄 License

MIT License - See LICENSE file

---

**Built with ❤️ to demonstrate the power of vector embeddings and semantic search**

Questions? See [MINDVAULT_SETUP.md](./MINDVAULT_SETUP.md) for detailed docs!
