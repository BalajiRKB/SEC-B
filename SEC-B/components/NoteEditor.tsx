/**
 * NoteEditor - Rich text editor with AI-powered features
 * Features:
 * - Auto-resizing text input
 * - Real-time tag suggestions via Firebase Vertex AI Gemini 2.0
 * - Related notes sidebar with semantic similarity > 0.7
 * - Save button with loading state
 * - Material Design 3 styling
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RelatedNotes } from '@/components/RelatedNotes';
import { useTagSuggestions } from '@/hooks/useTagSuggestions';
import { useRelatedNotes } from '@/hooks/useRelatedNotes';
import { Note, NoteEditorProps } from '@/types/note';
import { Colors, Typography, Elevation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(320, SCREEN_WIDTH * 0.35);

export function NoteEditor({
  initialNote,
  onSave,
  existingNotes = [],
}: NoteEditorProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // Note state
  const [title, setTitle] = useState(initialNote?.title || '');
  const [content, setContent] = useState(initialNote?.content || '');
  const [tags, setTags] = useState<string[]>(initialNote?.tags || []);
  const [saving, setSaving] = useState(false);

  // Get AI-powered suggestions
  const { suggestions, loading: suggestionsLoading } = useTagSuggestions(title, content);
  const { relatedNotes, loading: relatedLoading, error: relatedError } = useRelatedNotes(
    title,
    content,
    existingNotes
  );

  // Handle tag operations
  const addTag = useCallback((tag: string) => {
    const normalizedTag = tag.trim().toLowerCase();
    if (normalizedTag && !tags.includes(normalizedTag)) {
      setTags((prev) => [...prev, normalizedTag]);
    }
  }, [tags]);

  const removeTag = useCallback((tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  }, []);

  const addSuggestedTag = useCallback((tag: string) => {
    addTag(tag);
  }, [addTag]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!title.trim() && !content.trim()) {
      return;
    }

    setSaving(true);
    try {
      const note: Note = {
        id: initialNote?.id || `note-${Date.now()}`,
        title: title.trim(),
        content: content.trim(),
        tags,
        createdAt: initialNote?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      await onSave(note);
    } catch (error) {
      console.error('Error saving note:', error);
      // In production, show error toast/alert
    } finally {
      setSaving(false);
    }
  }, [title, content, tags, initialNote, onSave]);

  // Check if note has unsaved changes
  const hasChanges =
    title !== (initialNote?.title || '') ||
    content !== (initialNote?.content || '') ||
    JSON.stringify(tags) !== JSON.stringify(initialNote?.tags || []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.mainContainer}>
        {/* Editor Section */}
        <ThemedView style={styles.editorSection}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title Input */}
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Note title"
              placeholderTextColor={colors.onSurfaceVariant}
              style={[
                styles.titleInput,
                {
                  color: colors.onSurface,
                  backgroundColor: colors.surface,
                },
              ]}
              multiline
            />

            {/* Content Input with Auto-resize */}
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Start writing..."
              placeholderTextColor={colors.onSurfaceVariant}
              style={[
                styles.contentInput,
                {
                  color: colors.onSurface,
                  backgroundColor: colors.surface,
                },
              ]}
              multiline
              textAlignVertical="top"
            />

            {/* Tags Section */}
            <View style={styles.tagsSection}>
              <ThemedText type="subtitle" style={styles.tagsSectionTitle}>
                Tags
              </ThemedText>

              {/* Active Tags */}
              {tags.length > 0 && (
                <View style={styles.activeTags}>
                  {tags.map((tag, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => removeTag(tag)}
                      style={[
                        styles.activeTag,
                        {
                          backgroundColor: colors.primaryContainer,
                        },
                        Elevation.level1,
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.activeTagText,
                          { color: colors.onPrimaryContainer },
                        ]}
                      >
                        {tag}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.removeTagIcon,
                          { color: colors.onPrimaryContainer },
                        ]}
                      >
                        ×
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Tag Suggestions */}
              {suggestionsLoading && (
                <View style={styles.suggestionsLoading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <ThemedText
                    style={[
                      styles.suggestionsLoadingText,
                      { color: colors.onSurfaceVariant },
                    ]}
                  >
                    Generating suggestions...
                  </ThemedText>
                </View>
              )}

              {!suggestionsLoading && suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <ThemedText
                    style={[
                      styles.suggestionsLabel,
                      { color: colors.onSurfaceVariant },
                    ]}
                  >
                    Suggested tags:
                  </ThemedText>
                  <View style={styles.suggestions}>
                    {suggestions
                      .filter((s) => !tags.includes(s.tag))
                      .map((suggestion, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => addSuggestedTag(suggestion.tag)}
                          style={[
                            styles.suggestion,
                            {
                              backgroundColor: colors.secondaryContainer,
                              borderColor: colors.outline,
                            },
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.suggestionText,
                              { color: colors.onSecondaryContainer },
                            ]}
                          >
                            {suggestion.tag}
                          </ThemedText>
                          <View
                            style={[
                              styles.confidenceBadge,
                              {
                                backgroundColor: getConfidenceColor(
                                  suggestion.confidence,
                                  colorScheme
                                ),
                              },
                            ]}
                          >
                            <ThemedText style={styles.confidenceText}>
                              {Math.round(suggestion.confidence * 100)}%
                            </ThemedText>
                          </View>
                        </TouchableOpacity>
                      ))}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Save Button */}
          <View
            style={[
              styles.actionBar,
              {
                backgroundColor: colors.elevation.level2,
                borderTopColor: colors.outlineVariant,
              },
            ]}
          >
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving || !hasChanges}
              style={[
                styles.saveButton,
                {
                  backgroundColor:
                    saving || !hasChanges ? colors.surfaceVariant : colors.primary,
                },
                Elevation.level2,
              ]}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <ThemedText
                  type="defaultSemiBold"
                  style={[
                    styles.saveButtonText,
                    {
                      color:
                        saving || !hasChanges
                          ? colors.onSurfaceVariant
                          : colors.onPrimary,
                    },
                  ]}
                >
                  {hasChanges ? 'Save Note' : 'No Changes'}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </ThemedView>

        {/* Related Notes Sidebar */}
        <View
          style={[
            styles.sidebar,
            {
              backgroundColor: colors.elevation.level1,
              borderLeftColor: colors.outlineVariant,
            },
          ]}
        >
          <RelatedNotes
            relatedNotes={relatedNotes}
            loading={relatedLoading}
            error={relatedError}
            onNotePress={(noteId) => console.log('Open note:', noteId)}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function getConfidenceColor(confidence: number, colorScheme: 'light' | 'dark'): string {
  const colors = Colors[colorScheme];
  
  if (confidence >= 0.8) {
    return colors.primary;
  } else if (confidence >= 0.6) {
    return colors.secondary;
  } else {
    return colors.outline;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  editorSection: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  titleInput: {
    ...Typography.headlineMedium,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    minHeight: 60,
  },
  contentInput: {
    ...Typography.bodyLarge,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    minHeight: 200,
  },
  tagsSection: {
    marginBottom: 16,
  },
  tagsSectionTitle: {
    marginBottom: 12,
  },
  activeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  activeTagText: {
    ...Typography.labelLarge,
  },
  removeTagIcon: {
    ...Typography.titleLarge,
    lineHeight: 20,
  },
  suggestionsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  suggestionsLoadingText: {
    ...Typography.bodySmall,
  },
  suggestionsContainer: {
    marginTop: 8,
  },
  suggestionsLabel: {
    ...Typography.labelMedium,
    marginBottom: 8,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  suggestionText: {
    ...Typography.labelMedium,
  },
  confidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  confidenceText: {
    ...Typography.labelSmall,
    color: '#fff',
    fontSize: 10,
  },
  actionBar: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  saveButtonText: {
    ...Typography.labelLarge,
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    borderLeftWidth: 1,
  },
});
