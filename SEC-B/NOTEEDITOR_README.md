# NoteEditor Component - AI-Powered Note Taking

A comprehensive React Native note editor component with Firebase Vertex AI Gemini 2.0 integration, featuring real-time tag suggestions and semantic similarity search.

## Features

### ✨ Core Features
- **Rich Text Input** with auto-resizing TextInput components
- **Real-time Tag Suggestions** powered by Firebase Vertex AI Gemini 2.0
- **Semantic Search** for related notes (similarity threshold > 0.7)
- **Related Notes Sidebar** showing contextually similar content
- **Save Button** with loading state and change detection
- **Material Design 3** styling throughout
- **Debounced API Calls** to minimize Firebase Vertex AI usage

### 🎨 Material Design 3
- Full MD3 color system (light & dark modes)
- Typography scale with proper font sizing
- Elevation system with shadows
- Surface variants and proper contrast ratios

## File Structure

```
SEC-B/
├── types/
│   └── note.ts                    # TypeScript interfaces for Note, TagSuggestion, RelatedNote
├── services/
│   └── vertexAI.ts                # Firebase Vertex AI integration (Gemini 2.0)
├── hooks/
│   ├── useDebounce.ts             # Debounce hook for delayed updates
│   ├── useTagSuggestions.ts       # Hook for AI-powered tag suggestions
│   └── useRelatedNotes.ts         # Hook for semantic similarity search
├── components/
│   ├── NoteEditor.tsx             # Main editor component
│   └── RelatedNotes.tsx           # Related notes sidebar component
├── constants/
│   └── theme.ts                   # Extended with MD3 tokens
└── app/
    └── notes.tsx                  # Demo screen
```

## Components

### NoteEditor

Main component providing the note editing interface.

**Props:**
```typescript
interface NoteEditorProps {
  initialNote?: Partial<Note>;        // Optional initial note data
  onSave: (note: Note) => Promise<void>; // Save callback
  existingNotes?: Note[];             // Notes for semantic search
}
```

**Features:**
- Auto-resizing title and content inputs
- Tag management (add/remove)
- AI tag suggestions with confidence scores
- Real-time related notes sidebar
- Save button with change detection
- Loading states for all async operations

### RelatedNotes

Sidebar component displaying semantically similar notes.

**Props:**
```typescript
interface RelatedNotesProps {
  relatedNotes: RelatedNote[];       // Notes with similarity scores
  loading: boolean;                  // Loading state
  error: string | null;              // Error message
  onNotePress?: (noteId: string) => void; // Note selection callback
}
```

**Features:**
- Similarity badges (color-coded by score)
- Note previews with truncated content
- Tag displays
- Empty and error states

## Hooks

### useDebounce
Debounces rapid value changes to reduce API calls.

```typescript
const debouncedValue = useDebounce(value, 500);
```

### useTagSuggestions
Fetches AI-powered tag suggestions from Gemini 2.0.

```typescript
const { suggestions, loading, error } = useTagSuggestions(title, content, 1000);
```

### useRelatedNotes
Finds semantically similar notes using vector embeddings.

```typescript
const { relatedNotes, loading, error } = useRelatedNotes(
  title,
  content,
  existingNotes,
  0.7,  // similarity threshold
  1500  // debounce ms
);
```

## Services

### vertexAI.ts

Firebase Vertex AI integration with the following functions:

#### `getTagSuggestions(title: string, content: string): Promise<TagSuggestion[]>`
Analyzes note content and returns suggested tags with confidence scores using Gemini 2.0.

#### `findRelatedNotes(currentNote, existingNotes, threshold): Promise<RelatedNote[]>`
Finds semantically similar notes by:
1. Generating embeddings for current note
2. Computing cosine similarity with existing notes
3. Filtering by similarity threshold (default 0.7)
4. Sorting by similarity score

#### `generateNoteEmbedding(note: Note): Promise<number[]>`
Pre-computes embedding vectors for notes to enable fast similarity search.

## Setup Instructions

### 1. Install Dependencies

Currently uses mock implementations. To enable Firebase Vertex AI:

```bash
npm install firebase @google-cloud/vertexai
```

### 2. Configure Firebase

Update `services/vertexAI.ts` with your Firebase project details:

```typescript
const VERTEX_AI_CONFIG = {
  projectId: 'your-project-id',
  location: 'us-central1',
  model: 'gemini-2.0-flash-exp',
};
```

### 3. Enable Vertex AI API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable Vertex AI API for your project
3. Set up authentication (Service Account or Firebase Auth)

### 4. Implement Real API Calls

Replace mock implementations in `services/vertexAI.ts`:

**For Tag Suggestions:**
```typescript
const response = await fetch(
  `https://${VERTEX_AI_CONFIG.location}-aiplatform.googleapis.com/v1/projects/${VERTEX_AI_CONFIG.projectId}/locations/${VERTEX_AI_CONFIG.location}/publishers/google/models/${VERTEX_AI_CONFIG.model}:generateContent`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await getAccessToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{ text: prompt }],
      }],
    }),
  }
);
```

**For Embeddings:**
```typescript
const response = await fetch(
  `https://${VERTEX_AI_CONFIG.location}-aiplatform.googleapis.com/v1/projects/${VERTEX_AI_CONFIG.projectId}/locations/${VERTEX_AI_CONFIG.location}/publishers/google/models/textembedding-gecko:predict`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await getAccessToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instances: [{ content: text }],
    }),
  }
);
```

## Usage Example

```typescript
import { NoteEditor } from '@/components/NoteEditor';
import { Note } from '@/types/note';

function MyNotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);

  const handleSave = async (note: Note) => {
    // Save to your backend/database
    await saveToDatabase(note);
    
    // Update local state
    setNotes((prev) => [...prev, note]);
  };

  return (
    <NoteEditor
      initialNote={{
        title: '',
        content: '',
        tags: [],
      }}
      onSave={handleSave}
      existingNotes={notes}
    />
  );
}
```

## Performance Optimizations

### Debouncing
- Tag suggestions: 1000ms debounce
- Related notes: 1500ms debounce
- Prevents excessive API calls while typing

### Embedding Caching
Store embeddings with notes to avoid recomputation:

```typescript
interface Note {
  // ... other fields
  embedding?: number[];  // Cache embedding vector
}
```

### Lazy Loading
Related notes sidebar only calculates similarities after debounce period.

## Customization

### Adjust Similarity Threshold
Change the threshold in `useRelatedNotes`:

```typescript
const { relatedNotes } = useRelatedNotes(
  title,
  content,
  existingNotes,
  0.8  // Higher = more strict similarity
);
```

### Modify Tag Suggestion Prompt
Edit the prompt in `services/vertexAI.ts` `getTagSuggestions()`:

```typescript
const prompt = `Analyze this note and suggest relevant tags...`;
```

### Adjust Debounce Timing
Pass custom delays to hooks:

```typescript
const { suggestions } = useTagSuggestions(title, content, 2000); // 2 second delay
```

## Material Design 3 Theme

Access MD3 tokens from `constants/theme.ts`:

```typescript
import { Colors, Typography, Elevation } from '@/constants/theme';

// Colors
Colors.light.primary
Colors.dark.surface

// Typography
Typography.headlineLarge
Typography.bodyMedium

// Elevation
Elevation.level2
```

## Testing

Test the implementation:

1. Start the dev server:
   ```bash
   cd /home/rkb/sec-b/SEC-B
   npm start
   ```

2. Navigate to `/notes` route in the app

3. Start typing - observe:
   - Tag suggestions appearing after 1 second
   - Related notes updating after 1.5 seconds
   - Save button state changes

## Future Enhancements

- [ ] Voice input for notes
- [ ] Markdown rendering
- [ ] Note attachments (images, files)
- [ ] Collaborative editing
- [ ] Export to various formats
- [ ] Advanced search filters
- [ ] Note templates
- [ ] Offline support with sync

## API Cost Optimization

To minimize Firebase Vertex AI costs:

1. **Increase debounce delays** for fewer API calls
2. **Cache embeddings** in your database
3. **Batch process** tag suggestions
4. **Use smaller models** for embeddings (textembedding-gecko vs textembedding-gecko-multilingual)
5. **Implement rate limiting** per user
6. **Store embeddings** with notes to avoid regeneration

## Troubleshooting

### Tags not appearing
- Check console for API errors
- Verify Firebase project configuration
- Ensure sufficient content is entered (debounce delay)

### Related notes not showing
- Verify existingNotes array is populated
- Check similarity threshold (lower if needed)
- Ensure embeddings are being generated

### Styling issues
- Verify theme imports
- Check colorScheme hook
- Review Material Design 3 tokens

## License

This component is part of the SEC-B project.

---

Built with ❤️ using React Native, Expo, Firebase Vertex AI, and Gemini 2.0
