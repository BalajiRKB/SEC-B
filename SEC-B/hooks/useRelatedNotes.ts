/**
 * Custom hook for finding semantically related notes
 * Uses debounced values and maintains a cache
 */

import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import { findRelatedNotes } from '@/services/vertexAI';
import { Note, RelatedNote } from '@/types/note';

export function useRelatedNotes(
  title: string,
  content: string,
  existingNotes: Note[],
  threshold: number = 0.7,
  debounceMs: number = 1500
) {
  const [relatedNotes, setRelatedNotes] = useState<RelatedNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce to avoid excessive similarity calculations
  const debouncedTitle = useDebounce(title, debounceMs);
  const debouncedContent = useDebounce(content, debounceMs);

  useEffect(() => {
    // Only search if there's content and notes to compare
    if ((!debouncedTitle.trim() && !debouncedContent.trim()) || existingNotes.length === 0) {
      setRelatedNotes([]);
      return;
    }

    let isCancelled = false;

    async function fetchRelatedNotes() {
      setLoading(true);
      setError(null);

      try {
        const related = await findRelatedNotes(
          { title: debouncedTitle, content: debouncedContent },
          existingNotes,
          threshold
        );
        
        if (!isCancelled) {
          setRelatedNotes(related);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch related notes');
          setRelatedNotes([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchRelatedNotes();

    return () => {
      isCancelled = true;
    };
  }, [debouncedTitle, debouncedContent, existingNotes, threshold]);

  return { relatedNotes, loading, error };
}
