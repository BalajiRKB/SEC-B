# MindVault - Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                               │
│                                                                      │
│  ┌─────────────────────┐              ┌──────────────────────────┐ │
│  │   MindVault Screen  │              │  Note Detail Screen      │ │
│  │                     │              │                          │ │
│  │  • Search Bar       │              │  • Title Input           │ │
│  │  • Note List        │              │  • Content Input         │ │
│  │  • Similarity %     │◄────────────►│  • AI Tag Suggestions    │ │
│  │  • Pull Refresh     │              │  • Related Notes Sidebar │ │
│  │  • FAB Button       │              │  • Save Button           │ │
│  └─────────┬───────────┘              └──────────┬───────────────┘ │
│            │                                     │                  │
└────────────┼─────────────────────────────────────┼──────────────────┘
             │                                     │
             │         services/api.ts             │
             │    ┌────────────────────────┐       │
             └────┤ • createNote()         ├───────┘
                  │ • searchNotes()        │
                  │ • getUserNotes()       │
                  │ • findRelatedNotes()   │
                  │ • getTagSuggestions()  │
                  └───────────┬────────────┘
                              │
                    HTTP REST API (JSON)
                              │
┌─────────────────────────────┼─────────────────────────────────────┐
│                    BACKEND API SERVER                              │
│                             │                                      │
│  ┌──────────────────────────▼───────────────────────────────────┐ │
│  │            FastAPI Routes (app/routes/notes.py)              │ │
│  │                                                              │ │
│  │  POST   /api/notes           → Create note + embedding     │ │
│  │  POST   /api/search          → Vector similarity search    │ │
│  │  GET    /api/notes/{userId}  → List all user notes        │ │
│  │  POST   /api/suggest-tags    → AI tag generation          │ │
│  │  GET    /health              → System health check        │ │
│  │  GET    /docs                → Interactive API docs       │ │
│  │                                                              │ │
│  └──────────┬────────────────────────────────┬──────────────────┘ │
│             │                                │                    │
│    ┌────────▼────────────┐        ┌─────────▼──────────┐        │
│    │  Gemini Service     │        │  MongoDB Service    │        │
│    │                     │        │                     │        │
│    │  • generate_note_   │        │  • connect()        │        │
│    │    embedding()      │        │  • create_note()    │        │
│    │  • generate_query_  │        │  • search_notes()   │        │
│    │    embedding()      │        │  • list_notes()     │        │
│    │                     │        │  • close()          │        │
│    │  [768 dimensions]   │        │  [$vectorSearch]    │        │
│    └─────────┬───────────┘        └──────────┬──────────┘        │
└──────────────┼────────────────────────────────┼───────────────────┘
               │                                │
               │                                │
    ┌──────────▼──────────┐          ┌─────────▼──────────┐
    │   Google Gemini API  │          │  MongoDB Atlas     │
    │                      │          │                    │
    │  text-embedding-004  │          │  notes_rag DB      │
    │  • retrieval_document│          │  • notes collection│
    │  • retrieval_query   │          │  • vector_index    │
    │  • 768 dimensions    │          │  • cosine sim      │
    │  • Free tier!        │          │  • user filtering  │
    └──────────────────────┘          └────────────────────┘
```

---

## User Flow: Creating a Note

```
USER ACTION                    FRONTEND                    BACKEND                    EXTERNAL
─────────────────────────────────────────────────────────────────────────────────────────────

1. User taps FAB (+)     →  Navigate to
                            note-detail.tsx

2. Types title:              State updates:
   "Beach Sunset"            title = "Beach Sunset"

3. Types content:            State updates:
   "Calming sunset..."       content = "Calming sunset..."

                             Wait 1 second (debounce)
                                        
                                        →            POST /api/suggest-tags
                                                     {title, content}
                                                                      
                                                     Generate prompt for Gemini 2.0
                                                                      
                                                                   →  Gemini analyzes
                                                                      Returns JSON:
                                                                      [{"tag": "nature",
                                                                        "confidence": 0.92}]
                                                     ←─────────────────
                                        ←            Returns suggestions
                             
                             Display AI tags:
                             #nature (92%)
                             #relaxation (85%)

4. User taps AI tag      →  Add to tags array
   "#nature"

5. User taps Save        →  Disable button,
                            Show spinner
                                        
                                        →            POST /api/notes
                                                     {title, content,
                                                      user_id, tags}
                                                     
                                                     Combine text:
                                                     "Beach Sunset\n\n
                                                     Calming sunset...\n\n
                                                     Tags: nature"
                                                                      
                                                                   →  generate_note_embedding()
                                                                      Returns: [0.23, -0.45, ...]
                                                                      (768 numbers)
                                                     
                                                     Store in MongoDB:
                                                     {_id, title, content,
                                                      tags, embedding,
                                                      created_at, updated_at}
                                                                      
                                                                   →  MongoDB Atlas
                                                                      Inserts document
                                                                      ←─────────────
                                                     
                                        ←            Returns saved note
                                                     with _id
                             
                             Show success alert
                             Navigate back to
                             mindvault.tsx

6. User sees note        →  Refresh note list
   in main screen            Shows: "Beach Sunset"
```

---

## User Flow: Semantic Search

```
USER ACTION                    FRONTEND                    BACKEND                    EXTERNAL
─────────────────────────────────────────────────────────────────────────────────────────────

1. User opens app        →  Load mindvault.tsx
                            Show search bar

2. Types "peaceful        →  State updates:
   evening"                  searchQuery = "peaceful..."

                             Wait 500ms (debounce)
                             
                             setIsSearching(true)
                                        
                                        →            POST /api/search
                                                     {query: "peaceful evening",
                                                      user_id: "demo-user",
                                                      min_score: 0.7,
                                                      limit: 20}
                                                     
                                                     Convert query to vector:
                                                                      
                                                                   →  generate_query_embedding()
                                                                      task_type="retrieval_query"
                                                                      ←─────────────
                                                                      Returns: [0.24, -0.44, ...]
                                                     
                                                     MongoDB aggregation:
                                                     [{
                                                       $vectorSearch: {
                                                         index: "vector_index",
                                                         path: "embedding",
                                                         queryVector: [...],
                                                         numCandidates: 100,
                                                         limit: 20,
                                                         filter: {user_id: "demo-user"}
                                                       }
                                                     }, {
                                                       $addFields: {
                                                         score: {$meta: "vectorSearchScore"}
                                                       }
                                                     }]
                                                                      
                                                                   →  MongoDB Atlas
                                                                      Cosine similarity:
                                                                      • "Beach Sunset" → 0.85
                                                                      • "Morning coffee" → 0.65
                                                                      ←─────────────
                                                     
                                                     Filter by min_score (0.7)
                                                     Keep: "Beach Sunset" (0.85)
                                                     Drop: "Morning coffee" (0.65)
                                        
                                        ←            Returns:
                                                     {results: [
                                                       {note: {...},
                                                        score: 0.85}
                                                     ]}
                             
                             Display results:
                             ┌─────────────────────┐
                             │ Beach Sunset   85%  │
                             │ Calming sunset...   │
                             │ #nature             │
                             └─────────────────────┘
                             
                             setIsSearching(false)

3. User taps result      →  Navigate to
                            note-detail.tsx
                            with note data
```

---

## User Flow: Related Notes Sidebar

```
USER ACTION                    FRONTEND                    BACKEND                    EXTERNAL
─────────────────────────────────────────────────────────────────────────────────────────────

1. User types new note   →  note-detail.tsx loaded
   "Morning meditation"     title/content states

2. Types more content    →  State updates continuously:
   "Peaceful morning..."    content += "Peaceful..."

3. After 20+ characters  →  searchText = "Morning meditation
                                          Peaceful morning..."
                            
                            Wait 1.5 seconds (debounce)
                            
                            setLoadingRelated(true)
                                        
                                        →            POST /api/search
                                                     {query: searchText,
                                                      user_id: "demo-user",
                                                      min_score: 0.7,
                                                      limit: 5}
                                                     
                                                     [Same process as search above]
                                                     
                                                     Generate embedding
                                                     Search MongoDB
                                                     Calculate scores
                                        
                                        ←            Returns similar notes:
                                                     [{note: "Beach Sunset",
                                                       score: 0.78}]
                             
                             Filter out current note
                             (if editing)
                             
                             setRelatedNotes([...])
                             setShowRelatedSidebar(true)
                             setLoadingRelated(false)
                             
                             Sidebar appears:
                             ┌─────────────────────┐
                             │ Related Notes       │
                             ├─────────────────────┤
                             │ Beach Sunset   78%  │
                             │ Calming...          │
                             └─────────────────────┘

4. User continues       →  Content updates
   typing                   
                            After 1.5s debounce
                            → Sidebar refreshes
                              with new matches!
```

---

## Data Flow: Embedding Generation

```
TEXT INPUT                    PROCESSING                    VECTOR OUTPUT
─────────────────────────────────────────────────────────────────────────

"The sunset at the              Combine text:
beach was calming"              Title + Content + Tags
       │                               │
       │                               │
       ▼                               ▼
                          "Beach Sunset\n\nThe sunset at
                           the beach was calming\n\n
                           Tags: nature, relaxation"
                                       │
                                       │
                                       ▼
                               Send to Gemini API
                               text-embedding-004
                               task_type="retrieval_document"
                                       │
                                       │
                                       ▼
                          Google's ML Model processes:
                          • Tokenization
                          • Contextual understanding
                          • Semantic encoding
                          • Dimensionality mapping
                                       │
                                       │
                                       ▼
                          Returns 768-dimensional vector:
                          [
                            0.023456,   ← "sunset" concept
                           -0.045123,   ← "beach" concept
                            0.067890,   ← "calm" concept
                            0.012345,   ← "evening" context
                           -0.098765,   ← negative features
                            ...         ← 763 more numbers
                            0.054321
                          ]
                                       │
                                       │
                                       ▼
                          Store with note in MongoDB:
                          {
                            _id: "...",
                            title: "Beach Sunset",
                            content: "The sunset...",
                            tags: ["nature", "relaxation"],
                            embedding: [0.023456, ...],  ← 768 floats
                            user_id: "demo-user",
                            created_at: "2026-01-02T..."
                          }
```

---

## Cosine Similarity Calculation

```
How similar are two notes?

Note A: "Beach Sunset"          Note B: "Morning Coffee"
Embedding: [0.23, -0.45, 0.67]  Embedding: [0.25, -0.43, 0.68]
           │                               │
           └───────────┬───────────────────┘
                       │
                       ▼
           Calculate Cosine Similarity:
           
           similarity = (A · B) / (|A| × |B|)
           
           Where:
           A · B = dot product = (0.23×0.25) + (-0.45×-0.43) + (0.67×0.68)
                                = 0.0575 + 0.1935 + 0.4556
                                = 0.7066
           
           |A| = magnitude = √(0.23² + 0.45² + 0.67²) = 0.854
           |B| = magnitude = √(0.25² + 0.43² + 0.68²) = 0.857
           
           similarity = 0.7066 / (0.854 × 0.857) = 0.965
                       │
                       ▼
                   96.5% Similar!
                   
           Interpretation:
           0.0 - 0.5   → Not related
           0.5 - 0.7   → Somewhat related
           0.7 - 0.8   → Related          ← min_score threshold
           0.8 - 0.9   → Similar
           0.9 - 1.0   → Very similar
```

---

## MongoDB Vector Search Query

```sql
-- Conceptual representation of $vectorSearch

db.notes.aggregate([
  {
    $vectorSearch: {
      index: "vector_index",           // Created in Atlas UI
      path: "embedding",                // Field with 768 floats
      queryVector: [0.23, -0.45, ...], // User's search query (768 dims)
      numCandidates: 100,               // Consider top 100 docs
      limit: 10,                        // Return top 10 matches
      filter: {                         // Additional filters
        user_id: { $eq: "demo-user" }  // Only this user's notes
      }
    }
  },
  {
    $addFields: {
      score: { $meta: "vectorSearchScore" }  // Add similarity score
    }
  },
  {
    $match: {
      score: { $gte: 0.7 }  // Only 70%+ matches
    }
  }
])

-- Result:
[
  {
    _id: "67768f8a...",
    title: "Beach Sunset",
    content: "The sunset was calming...",
    tags: ["nature", "relaxation"],
    embedding: [0.25, -0.44, ...],
    user_id: "demo-user",
    score: 0.85  ← 85% similar to query!
  },
  {
    _id: "67768f9b...",
    title: "Evening Walk",
    content: "Peaceful stroll in park...",
    tags: ["exercise", "nature"],
    embedding: [0.22, -0.46, ...],
    user_id: "demo-user",
    score: 0.72  ← 72% similar
  }
]
```

---

## State Management Flow

```
┌─────────────────────────────────────────────────┐
│           React Component State                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  mindvault.tsx:                                 │
│  • searchQuery: string                          │
│  • notes: NoteResponse[]                        │
│  • searchResults: SearchResult[]                │
│  • isSearching: boolean                         │
│  • isLoading: boolean                           │
│  • refreshing: boolean                          │
│  • isSearchMode: boolean                        │
│                                                 │
│  note-detail.tsx:                               │
│  • title: string                                │
│  • content: string                              │
│  • tags: string[]                               │
│  • saving: boolean                              │
│  • loadingSuggestions: boolean                  │
│  • tagSuggestions: TagSuggestion[]              │
│  • relatedNotes: SearchResult[]                 │
│  • loadingRelated: boolean                      │
│  • showRelatedSidebar: boolean                  │
│  • newTag: string                               │
│                                                 │
└─────────────────────────────────────────────────┘
         │                              │
         │    User interactions         │
         │    (typing, tapping)         │
         ▼                              ▼
┌─────────────────────────────────────────────────┐
│              Event Handlers                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  • setSearchQuery()  → triggers useEffect       │
│  • handleSearch()    → API call                 │
│  • handleSave()      → API call                 │
│  • addTag()          → local state update       │
│  • removeTag()       → local state update       │
│                                                 │
└─────────────────────────────────────────────────┘
         │
         │    Debounced triggers
         ▼
┌─────────────────────────────────────────────────┐
│              useEffect Hooks                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  useEffect([searchQuery], () => {               │
│    setTimeout(() => handleSearch(), 500ms)      │
│  })                                             │
│                                                 │
│  useEffect([title, content, tags], () => {      │
│    setTimeout(() => loadSuggestions(), 1000ms)  │
│  })                                             │
│                                                 │
│  useEffect([title, content], () => {            │
│    setTimeout(() => loadRelated(), 1500ms)      │
│  })                                             │
│                                                 │
└─────────────────────────────────────────────────┘
         │
         │    API calls
         ▼
┌─────────────────────────────────────────────────┐
│              services/api.ts                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  fetch() → Backend → Gemini/MongoDB             │
│                                                 │
└─────────────────────────────────────────────────┘
         │
         │    Response
         ▼
┌─────────────────────────────────────────────────┐
│           Update State & Re-render              │
└─────────────────────────────────────────────────┘
```

---

These diagrams show the complete flow of data through MindVault, from user input to AI processing to storage and retrieval using semantic vector search!
