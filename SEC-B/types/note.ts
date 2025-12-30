/**
 * Type definitions for Note management system
 */

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  embedding?: number[]; // Vector embedding for semantic search
}

export interface RelatedNote {
  note: Note;
  similarity: number; // 0-1 similarity score
}

export interface TagSuggestion {
  tag: string;
  confidence: number; // 0-1 confidence score
}

export interface VertexAIResponse {
  tags?: TagSuggestion[];
  relatedNotes?: RelatedNote[];
  error?: string;
}

export interface NoteEditorProps {
  initialNote?: Partial<Note>;
  onSave: (note: Note) => Promise<void>;
  existingNotes?: Note[];
}
