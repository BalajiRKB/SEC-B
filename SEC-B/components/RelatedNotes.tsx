/**
 * RelatedNotes component - displays semantically similar notes
 * Shows notes with similarity > 0.7
 */

import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RelatedNote } from '@/types/note';
import { Colors, Typography, Elevation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface RelatedNotesProps {
  relatedNotes: RelatedNote[];
  loading: boolean;
  error: string | null;
  onNotePress?: (noteId: string) => void;
}

export function RelatedNotes({
  relatedNotes,
  loading,
  error,
  onNotePress,
}: RelatedNotesProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle" style={styles.header}>
          Related Notes
        </ThemedText>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <ThemedText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            Finding related notes...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle" style={styles.header}>
          Related Notes
        </ThemedText>
        <View style={styles.errorContainer}>
          <ThemedText style={[styles.errorText, { color: colors.onSurfaceVariant }]}>
            {error}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (relatedNotes.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle" style={styles.header}>
          Related Notes
        </ThemedText>
        <View style={styles.emptyContainer}>
          <ThemedText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            No related notes found
          </ThemedText>
          <ThemedText style={[styles.emptySubtext, { color: colors.onSurfaceVariant }]}>
            Add more content to discover connections
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.header}>
        Related Notes ({relatedNotes.length})
      </ThemedText>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {relatedNotes.map((related) => (
          <TouchableOpacity
            key={related.note.id}
            onPress={() => onNotePress?.(related.note.id)}
            style={[
              styles.noteCard,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.outlineVariant,
              },
              Elevation.level1,
            ]}
          >
            <View style={styles.noteHeader}>
              <ThemedText
                type="defaultSemiBold"
                style={styles.noteTitle}
                numberOfLines={2}
              >
                {related.note.title || 'Untitled'}
              </ThemedText>
              <View
                style={[
                  styles.similarityBadge,
                  {
                    backgroundColor: getSimilarityColor(related.similarity, colorScheme),
                  },
                ]}
              >
                <ThemedText style={[styles.similarityText, { color: colors.onPrimary }]}>
                  {Math.round(related.similarity * 100)}%
                </ThemedText>
              </View>
            </View>

            <ThemedText
              style={[styles.noteContent, { color: colors.onSurfaceVariant }]}
              numberOfLines={3}
            >
              {related.note.content}
            </ThemedText>

            {related.note.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {related.note.tags.slice(0, 3).map((tag, index) => (
                  <View
                    key={index}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: colors.secondaryContainer,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.tagText,
                        { color: colors.onSecondaryContainer },
                      ]}
                    >
                      {tag}
                    </ThemedText>
                  </View>
                ))}
                {related.note.tags.length > 3 && (
                  <ThemedText
                    style={[styles.moreTagsText, { color: colors.onSurfaceVariant }]}
                  >
                    +{related.note.tags.length - 3}
                  </ThemedText>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

function getSimilarityColor(similarity: number, colorScheme: 'light' | 'dark'): string {
  const colors = Colors[colorScheme];
  
  if (similarity >= 0.9) {
    return colors.primary;
  } else if (similarity >= 0.8) {
    return colors.primaryContainer;
  } else {
    return colors.secondary;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    ...Typography.bodyMedium,
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    ...Typography.bodyMedium,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.bodyLarge,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  noteCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  noteTitle: {
    flex: 1,
  },
  similarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  similarityText: {
    ...Typography.labelSmall,
    fontWeight: '600',
  },
  noteContent: {
    ...Typography.bodySmall,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    ...Typography.labelSmall,
  },
  moreTagsText: {
    ...Typography.labelSmall,
  },
});
