/**
 * MindVault API Service
 * Connects React Native frontend to FastAPI backend with MongoDB Atlas Vector Search
 */

import { Note } from '@/types/note';

// API Configuration
// Auto-detect platform and use appropriate URL
const getApiBaseUrl = () => {
  if (!__DEV__) {
    return 'https://your-production-api.com/api';
  }
  
  // For web platform, use localhost
  if (typeof window !== 'undefined' && window.location) {
    return 'http://localhost:8000/api';
  }
  
  // For Android emulator, use 10.0.2.2 (special alias to host machine)
  // For iOS simulator, use localhost
  // For physical device, use your computer's IP (e.g., 192.168.1.100)
  return 'http://10.0.2.2:8000/api';
};

const API_BASE_URL = getApiBaseUrl();

export interface CreateNoteRequest {
  title: string;
  content: string;
  user_id: string;
  tags: string[];
}

export interface NoteResponse {
  _id: string;
  title: string;
  content: string;
  user_id: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  embedding?: number[];
}

export interface SearchRequest {
  query: string;
  user_id: string;
  limit?: number;
  min_score?: number;
}

export interface SearchResult {
  note: NoteResponse;
  score: number;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  count: number;
  search_time_ms: number;
}

export interface TagSuggestion {
  tag: string;
  confidence: number;
}

/**
 * Create a new note with automatic embedding generation
 */
export async function createNote(note: CreateNoteRequest): Promise<NoteResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(note),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create note');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
}

/**
 * Search notes using natural language query with vector similarity
 * This is the core "semantic search" feature of MindVault
 */
export async function searchNotes(request: SearchRequest): Promise<SearchResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: request.query,
        user_id: request.user_id,
        limit: request.limit || 10,
        min_score: request.min_score || 0.7, // Semantic similarity threshold
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to search notes');
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching notes:', error);
    throw error;
  }
}

/**
 * Get all notes for a user
 */
export async function getUserNotes(userId: string): Promise<NoteResponse[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/notes/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch notes');
    }

    const data = await response.json();
    // Backend returns array directly, not wrapped in object
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }
}

/**
 * Find related notes for the given text
 * Used for the "Related Notes" sidebar as user types
 */
export async function findRelatedNotes(
  text: string,
  userId: string,
  minScore: number = 0.7,
  limit: number = 5
): Promise<SearchResult[]> {
  try {
    const response = await searchNotes({
      query: text,
      user_id: userId,
      limit,
      min_score: minScore,
    });

    return response.results;
  } catch (error) {
    console.error('Error finding related notes:', error);
    return [];
  }
}

/**
 * Get AI-powered tag suggestions based on note content
 * Uses Gemini to analyze the note and suggest relevant tags
 */
export async function getTagSuggestions(
  title: string,
  content: string
): Promise<TagSuggestion[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/suggest-tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, content }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get tag suggestions');
    }

    const data = await response.json();
    return data.suggestions || [];
  } catch (error) {
    console.error('Error getting tag suggestions:', error);
    // Return fallback suggestions
    return [];
  }
}

/**
 * Health check endpoint
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}

/**
 * Convert API note response to app Note type
 */
export function convertToNote(apiNote: NoteResponse): Note {
  return {
    id: apiNote._id,
    title: apiNote.title,
    content: apiNote.content,
    tags: apiNote.tags,
    createdAt: new Date(apiNote.created_at),
    updatedAt: new Date(apiNote.updated_at),
  };
}

/**
 * Get current user ID (in production, this would come from auth)
 */
export function getCurrentUserId(): string {
  // For MVP, use a demo user ID
  // In production, this would come from your auth system (Firebase Auth, etc.)
  return 'demo-user';
}
