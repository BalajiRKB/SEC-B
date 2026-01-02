/**
 * Note Detail/Editor Screen
 * Full-featured note editor with semantic features:
 * - Real-time related notes sidebar
 * - AI-powered tag suggestions
 * - Auto-save functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Toast, ToastType } from '@/components/toast';
import { Colors, Typography, Elevation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import * as API from '@/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(320, SCREEN_WIDTH * 0.35);

export default function NoteDetail() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const params = useLocalSearchParams();

  // State
  const [title, setTitle] = useState(params.title as string || '');
  const [content, setContent] = useState(params.content as string || '');
  const [tags, setTags] = useState<string[]>(
    params.tags ? JSON.parse(params.tags as string) : []
  );
  const [saving, setSaving] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<API.TagSuggestion[]>([]);
  const [relatedNotes, setRelatedNotes] = useState<API.SearchResult[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [showRelatedSidebar, setShowRelatedSidebar] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const userId = API.getCurrentUserId();
  const isEditMode = !!params.noteId;

  // Toast helper
  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  }, []);

  // Load tag suggestions when content changes
  useEffect(() => {
    if (title.trim() || content.trim()) {
      const timer = setTimeout(async () => {
        try {
          setLoadingSuggestions(true);
          const suggestions = await API.getTagSuggestions(title, content);
          setTagSuggestions(suggestions.filter(s => !tags.includes(s.tag)));
        } catch (error) {
          console.error('Failed to load tag suggestions:', error);
        } finally {
          setLoadingSuggestions(false);
        }
      }, 1000); // Debounce 1 second

      return () => clearTimeout(timer);
    }
  }, [title, content, tags]);

  // Load related notes as user types
  useEffect(() => {
    const searchText = `${title} ${content}`.trim();
    if (searchText.length > 20) {
      const timer = setTimeout(async () => {
        try {
          setLoadingRelated(true);
          const results = await API.findRelatedNotes(searchText, userId, 0.7, 5);
          // Filter out current note if editing
          const filtered = params.noteId
            ? results.filter(r => r.note._id !== params.noteId)
            : results;
          setRelatedNotes(filtered);
          setShowRelatedSidebar(filtered.length > 0);
        } catch (error) {
          console.error('Failed to load related notes:', error);
        } finally {
          setLoadingRelated(false);
        }
      }, 1500); // Debounce 1.5 seconds

      return () => clearTimeout(timer);
    } else {
      setRelatedNotes([]);
      setShowRelatedSidebar(false);
    }
  }, [title, content, userId, params.noteId]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!title.trim() && !content.trim()) {
      showToast('Please add a title or content before saving', 'error');
      return;
    }

    try {
      setSaving(true);
      await API.createNote({
        title: title.trim(),
        content: content.trim(),
        user_id: userId,
        tags,
      });

      showToast('Note saved successfully!', 'success');
      setTimeout(() => router.back(), 1500);
    } catch (error) {
      console.error('Failed to save note:', error);
      showToast('Failed to save note. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  }, [title, content, tags, userId, showToast]);

  // Tag operations
  const addTag = useCallback((tag: string) => {
    const normalized = tag.trim().toLowerCase();
    if (normalized && !tags.includes(normalized)) {
      setTags(prev => [...prev, normalized]);
      setNewTag('');
    }
  }, [tags]);

  const removeTag = useCallback((tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  }, []);

  const addSuggestedTag = useCallback((tag: string) => {
    addTag(tag);
    setTagSuggestions(prev => prev.filter(s => s.tag !== tag));
  }, [addTag]);

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, ...Elevation.level1 }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>

          <ThemedText style={[styles.headerTitle, Typography.titleLarge]}>
            {isEditMode ? 'Edit Note' : 'New Note'}
          </ThemedText>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <Ionicons name="checkmark" size={24} color={colors.onPrimary} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          {/* Main Editor */}
          <ScrollView
            style={[
              styles.editorContainer,
              showRelatedSidebar && styles.editorWithSidebar,
            ]}
            contentContainerStyle={styles.editorContent}
          >
            {/* Title Input */}
            <TextInput
              style={[
                styles.titleInput,
                Typography.headlineSmall,
                { color: colors.onSurface },
              ]}
              placeholder="Note title..."
              placeholderTextColor={colors.onSurfaceVariant}
              value={title}
              onChangeText={setTitle}
              multiline
            />

            {/* Content Input */}
            <TextInput
              style={[
                styles.contentInput,
                Typography.bodyLarge,
                { color: colors.onSurface },
              ]}
              placeholder="Start typing your thoughts... MindVault will find related notes as you write."
              placeholderTextColor={colors.onSurfaceVariant}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />

            {/* Tags Section */}
            <View style={styles.tagsSection}>
              <ThemedText style={[styles.sectionTitle, Typography.titleSmall]}>
                Tags
              </ThemedText>

              {/* Current Tags */}
              <View style={styles.tagsList}>
                {tags.map((tag, index) => (
                  <View
                    key={index}
                    style={[styles.tag, { backgroundColor: colors.primaryContainer }]}
                  >
                    <ThemedText style={[styles.tagText, { color: colors.onPrimaryContainer }]}>
                      #{tag}
                    </ThemedText>
                    <TouchableOpacity onPress={() => removeTag(tag)}>
                      <Ionicons
                        name="close-circle"
                        size={18}
                        color={colors.onPrimaryContainer}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Add Tag Input */}
              <View style={[styles.addTagContainer, { backgroundColor: colors.surfaceVariant }]}>
                <TextInput
                  style={[styles.addTagInput, { color: colors.onSurface }]}
                  placeholder="Add tag..."
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={newTag}
                  onChangeText={setNewTag}
                  onSubmitEditing={() => addTag(newTag)}
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={() => addTag(newTag)}>
                  <Ionicons name="add-circle" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* AI Tag Suggestions */}
              {tagSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <View style={styles.suggestionHeader}>
                    <ThemedText style={[styles.suggestionTitle, { color: colors.onSurfaceVariant }]}>
                      AI Suggestions
                    </ThemedText>
                    {loadingSuggestions && (
                      <ActivityIndicator size="small" color={colors.primary} />
                    )}
                  </View>
                  <View style={styles.tagsList}>
                    {tagSuggestions.map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.suggestedTag,
                          { backgroundColor: colors.secondaryContainer },
                        ]}
                        onPress={() => addSuggestedTag(suggestion.tag)}
                      >
                        <ThemedText
                          style={[styles.tagText, { color: colors.onSecondaryContainer }]}
                        >
                          #{suggestion.tag}
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.confidenceText,
                            { color: colors.onSecondaryContainer },
                          ]}
                        >
                          {(suggestion.confidence * 100).toFixed(0)}%
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Related Notes Sidebar */}
          {showRelatedSidebar && (
            <View
              style={[
                styles.sidebar,
                { backgroundColor: colors.surfaceVariant, width: SIDEBAR_WIDTH },
              ]}
            >
              <View style={styles.sidebarHeader}>
                <ThemedText style={[styles.sidebarTitle, Typography.titleSmall]}>
                  Related Notes
                </ThemedText>
                {loadingRelated && (
                  <ActivityIndicator size="small" color={colors.primary} />
                )}
              </View>

              <ScrollView style={styles.sidebarContent}>
                {relatedNotes.map((result, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.relatedNote, { backgroundColor: colors.surface }]}
                    onPress={() => {
                      router.push({
                        pathname: '/note-detail',
                        params: {
                          noteId: result.note._id,
                          title: result.note.title,
                          content: result.note.content,
                          tags: JSON.stringify(result.note.tags),
                        },
                      });
                    }}
                  >
                    <View style={styles.relatedNoteHeader}>
                      <ThemedText style={[styles.relatedNoteTitle, Typography.titleSmall]}>
                        {result.note.title || 'Untitled'}
                      </ThemedText>
                      <View
                        style={[
                          styles.scoreChip,
                          { backgroundColor: colors.primaryContainer },
                        ]}
                      >
                        <ThemedText
                          style={[styles.scoreText, { color: colors.onPrimaryContainer }]}
                        >
                          {(result.score * 100).toFixed(0)}%
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText
                      style={[
                        styles.relatedNoteContent,
                        { color: colors.onSurfaceVariant },
                      ]}
                      numberOfLines={2}
                    >
                      {result.note.content}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        type={toastType}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 16,
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  editorContainer: {
    flex: 1,
  },
  editorWithSidebar: {
    flex: 1,
  },
  editorContent: {
    padding: 20,
  },
  titleInput: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  contentInput: {
    minHeight: 200,
    paddingVertical: 8,
  },
  tagsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    marginRight: 6,
  },
  addTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  addTagInput: {
    flex: 1,
    fontSize: 14,
  },
  suggestionsContainer: {
    marginTop: 8,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  suggestionTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  suggestedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  confidenceText: {
    fontSize: 11,
    marginLeft: 4,
    opacity: 0.8,
  },
  sidebar: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,0,0,0.1)',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  sidebarTitle: {},
  sidebarContent: {
    flex: 1,
    padding: 16,
    paddingTop: 0,
  },
  relatedNote: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  relatedNoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  relatedNoteTitle: {
    flex: 1,
    marginRight: 8,
  },
  scoreChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 10,
    fontWeight: '600',
  },
  relatedNoteContent: {
    fontSize: 12,
    lineHeight: 16,
  },
});
