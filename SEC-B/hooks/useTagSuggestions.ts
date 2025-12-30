/**
 * Custom hook for getting AI-powered tag suggestions
 * Uses debounced values to avoid excessive API calls
 */

import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import { getTagSuggestions } from '@/services/vertexAI';
import { TagSuggestion } from '@/types/note';

export function useTagSuggestions(
  title: string,
  content: string,
  debounceMs: number = 1000
) {
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce the title and content to avoid excessive API calls
  const debouncedTitle = useDebounce(title, debounceMs);
  const debouncedContent = useDebounce(content, debounceMs);

  useEffect(() => {
    // Only fetch if there's meaningful content
    if (!debouncedTitle.trim() && !debouncedContent.trim()) {
      setSuggestions([]);
      return;
    }

    let isCancelled = false;

    async function fetchSuggestions() {
      setLoading(true);
      setError(null);

      try {
        const tags = await getTagSuggestions(debouncedTitle, debouncedContent);
        
        if (!isCancelled) {
          setSuggestions(tags);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch suggestions');
          setSuggestions([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchSuggestions();

    return () => {
      isCancelled = true;
    };
  }, [debouncedTitle, debouncedContent]);

  return { suggestions, loading, error };
}
