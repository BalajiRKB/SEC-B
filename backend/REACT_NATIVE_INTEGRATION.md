# React Native Integration Guide

Quick guide to integrate the FastAPI backend with your React Native app.

## Setup Backend First

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure .env
cp .env.example .env
# Edit .env with your OPENAI_API_KEY and MONGODB_URI

# Run backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## React Native Integration

### 1. Update Vertex AI Service

Replace the mock implementation in `SEC-B/services/vertexAI.ts` with real API calls:

```typescript
// SEC-B/services/vertexAI.ts

const API_BASE_URL = 'http://localhost:8000/api';

interface CreateNoteRequest {
  title: string;
  content: string;
  user_id: string;
  tags: string[];
}

interface SearchRequest {
  query: string;
  user_id: string;
  limit?: number;
}

export async function saveNoteWithEmbedding(
  title: string,
  content: string,
  userId: string,
  tags: string[]
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      content,
      user_id: userId,
      tags,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to save note');
  }

  return response.json();
}

export async function searchNotesWithRAG(
  query: string,
  userId: string,
  limit: number = 10
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      user_id: userId,
      limit,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Search failed');
  }

  return response.json();
}

export async function listUserNotes(userId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/notes/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notes');
  }

  return response.json();
}
```

### 2. Update NoteEditor Component

Integrate the real backend in `SEC-B/components/NoteEditor.tsx`:

```typescript
// Add to imports
import { saveNoteWithEmbedding } from '@/services/vertexAI';

// Update handleSave function
const handleSave = useCallback(async () => {
  if (!title.trim() && !content.trim()) {
    return;
  }

  setSaving(true);
  try {
    // Save to backend with embedding generation
    const savedNote = await saveNoteWithEmbedding(
      title.trim(),
      content.trim(),
      'user123', // Replace with actual user ID
      tags
    );

    // Call parent onSave callback
    await onSave({
      ...savedNote,
      id: savedNote._id,
    });

    Alert.alert('Success', 'Note saved with AI embeddings!');
  } catch (error) {
    console.error('Error saving note:', error);
    Alert.alert('Error', error.message || 'Failed to save note');
  } finally {
    setSaving(false);
  }
}, [title, content, tags, onSave]);
```

### 3. Update Related Notes Hook

Use real backend search in `SEC-B/hooks/useRelatedNotes.ts`:

```typescript
import { searchNotesWithRAG } from '@/services/vertexAI';

// In useRelatedNotes hook
async function fetchRelatedNotes() {
  setLoading(true);
  setError(null);

  try {
    const searchQuery = `${debouncedTitle} ${debouncedContent}`.trim();
    
    const response = await searchNotesWithRAG(
      searchQuery,
      'user123', // Replace with actual user ID
      10
    );
    
    const related: RelatedNote[] = response.results.map((result: any) => ({
      note: {
        id: result.note._id,
        title: result.note.title,
        content: result.note.content,
        tags: result.note.tags,
        createdAt: new Date(result.note.created_at),
        updatedAt: new Date(result.note.updated_at),
      },
      similarity: result.score,
    }));
    
    // Filter by threshold
    const filtered = related.filter(r => r.similarity > threshold);
    
    if (!isCancelled) {
      setRelatedNotes(filtered);
    }
  } catch (err) {
    if (!isCancelled) {
      setError(err.message || 'Failed to fetch related notes');
      setRelatedNotes([]);
    }
  } finally {
    if (!isCancelled) {
      setLoading(false);
    }
  }
}
```

### 4. Network Configuration for Development

**For iOS Simulator:**
```typescript
const API_BASE_URL = 'http://localhost:8000/api';
```

**For Android Emulator:**
```typescript
const API_BASE_URL = 'http://10.0.2.2:8000/api';
```

**For Physical Device (same network):**
```typescript
const API_BASE_URL = 'http://YOUR_COMPUTER_IP:8000/api';
// Find your IP: ifconfig (Mac/Linux) or ipconfig (Windows)
```

**For Expo Tunnel:**
Backend must be publicly accessible. Consider using ngrok:
```bash
ngrok http 8000
# Use the ngrok URL in API_BASE_URL
```

### 5. Test the Integration

```bash
# 1. Start backend
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 2. Start React Native
cd SEC-B
npm start

# 3. Open app and test:
# - Create a note → Should save to MongoDB with embeddings
# - Type content → Should see AI-powered related notes
# - Search → Should use vector similarity
```

## Environment Variables for React Native

Create `SEC-B/.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api
EXPO_PUBLIC_USER_ID=user123
```

Access in code:

```typescript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';
const USER_ID = process.env.EXPO_PUBLIC_USER_ID || 'user123';
```

## Error Handling

Add proper error handling for network issues:

```typescript
async function handleAPICall<T>(
  apiCall: () => Promise<T>,
  errorMessage: string
): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error) {
    if (error.message?.includes('Network request failed')) {
      Alert.alert(
        'Connection Error',
        'Cannot reach the backend. Make sure the API is running.'
      );
    } else {
      Alert.alert('Error', error.message || errorMessage);
    }
    return null;
  }
}

// Usage
const note = await handleAPICall(
  () => saveNoteWithEmbedding(title, content, userId, tags),
  'Failed to save note'
);
```

## Testing Checklist

- [ ] Backend running on port 8000
- [ ] MongoDB Atlas connection working
- [ ] Vector index created in MongoDB Atlas
- [ ] OpenAI API key configured
- [ ] React Native can reach backend (check network)
- [ ] CORS allows requests from Expo
- [ ] Note creation works and returns embedding
- [ ] Search returns semantically similar results
- [ ] Related notes update in real-time
- [ ] Error handling shows user-friendly messages

## Common Issues

### "Network request failed"
- Backend not running
- Wrong IP address for physical device
- Firewall blocking port 8000

### "Vector index not found"
- Wait 5-10 minutes after creating index
- Check index name matches `.env` config
- Verify index is on correct database/collection

### "OpenAI API error"
- Check API key in backend `.env`
- Verify API key has credits
- Check rate limits

### "Empty search results"
- No notes created yet
- Vector index still building
- Query too different from existing notes

## Production Deployment

1. Deploy backend to cloud (Railway, Render, AWS)
2. Update `API_BASE_URL` to production URL
3. Use environment variables for configuration
4. Implement authentication (JWT tokens)
5. Add user management
6. Enable HTTPS
7. Update CORS to specific domains

---

Now you have a fully integrated RAG system with real vector search!
