/**
 * MindVault - Semantic Personal Notes
 * Main screen with natural language search and note list
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Toast, ToastType } from '@/components/toast';
import { Colors, Typography, Elevation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import * as API from '@/services/api';
import { Note } from '@/types/note';

export default function MindVault() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState<API.NoteResponse[]>([]);
  const [searchResults, setSearchResults] = useState<API.SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const userId = API.getCurrentUserId();

  // Toast helper
  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  }, []);

  // Load all notes on mount
  const loadNotes = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedNotes = await API.getUserNotes(userId);
      setNotes(fetchedNotes);
    } catch (error) {
      console.error('Failed to load notes:', error);
      showToast('Failed to load notes. Make sure the backend is running.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [userId, showToast]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotes();
    showToast('Notes refreshed', 'success');
    setRefreshing(false);
  }, [loadNotes, showToast]);

  // Handle semantic search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setIsSearchMode(false);
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      setIsSearchMode(true);
      const response = await API.searchNotes({
        query: searchQuery,
        user_id: userId,
        limit: 20,
        min_score: 0.7,
      });
      setSearchResults(response.results);
      if (response.results.length > 0) {
        showToast(`Found ${response.results.length} related notes`, 'info');
      }
    } catch (error) {
      console.error('Search failed:', error);
      showToast('Failed to search notes. Please try again.', 'error');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, userId, showToast]);

  // Auto-search as user types (with debounce)
  useEffect(() => {
    if (searchQuery.trim()) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 500); // Debounce 500ms

      return () => clearTimeout(timer);
    } else {
      setIsSearchMode(false);
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Navigate to note editor
  const handleNotePress = useCallback((note: API.NoteResponse) => {
    router.push({
      pathname: '/note-detail',
      params: {
        noteId: note._id,
        title: note.title,
        content: note.content,
        tags: JSON.stringify(note.tags),
      },
    });
  }, []);

  // Create new note
  const handleCreateNote = useCallback(() => {
    router.push('/note-detail');
  }, []);

  // Render note item
  const renderNoteItem = ({ item, index }: { item: API.NoteResponse | API.SearchResult; index: number }) => {
    const note = 'note' in item ? item.note : item;
    const score = 'score' in item ? item.score : undefined;

    return (
      <TouchableOpacity
        style={[
          styles.noteCard,
          {
            backgroundColor: colors.surface,
            ...Elevation.level2,
          },
        ]}
        onPress={() => handleNotePress(note)}
        activeOpacity={0.7}
      >
        <View style={styles.noteHeader}>
          <ThemedText style={[styles.noteTitle, Typography.titleMedium]}>
            {note.title || 'Untitled'}
          </ThemedText>
          {score !== undefined && (
            <View style={[styles.scoreChip, { backgroundColor: colors.primaryContainer }]}>
              <ThemedText style={[styles.scoreText, { color: colors.onPrimaryContainer }]}>
                {(score * 100).toFixed(0)}%
              </ThemedText>
            </View>
          )}
        </View>

        <ThemedText
          style={[styles.noteContent, Typography.bodyMedium, { color: colors.onSurfaceVariant }]}
          numberOfLines={2}
        >
          {note.content || 'No content'}
        </ThemedText>

        {note.tags.length > 0 && (
          <View style={styles.tagContainer}>
            {note.tags.slice(0, 3).map((tag, idx) => (
              <View
                key={idx}
                style={[styles.tag, { backgroundColor: colors.secondaryContainer }]}
              >
                <ThemedText
                  style={[styles.tagText, { color: colors.onSecondaryContainer }]}
                >
                  #{tag}
                </ThemedText>
              </View>
            ))}
            {note.tags.length > 3 && (
              <ThemedText style={[styles.moreTagsText, { color: colors.onSurfaceVariant }]}>
                +{note.tags.length - 3} more
              </ThemedText>
            )}
          </View>
        )}

        <ThemedText style={[styles.timestamp, { color: colors.outline }]}>
          {new Date(note.updated_at).toLocaleDateString()}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  // Get display data
  const displayData = isSearchMode ? searchResults : notes;

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            Loading your notes...
          </ThemedText>
        </View>
      );
    }

    if (isSearchMode && searchQuery) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color={colors.onSurfaceVariant} />
          <ThemedText style={[styles.emptyTitle, Typography.titleLarge, { color: colors.onSurface }]}>
            No results found
          </ThemedText>
          <ThemedText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            Try a different search term or create a new note with "{searchQuery}"
          </ThemedText>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.primaryContainer }]}
            onPress={handleCreateNote}
          >
            <Ionicons name="add" size={20} color={colors.onPrimaryContainer} />
            <ThemedText style={{ color: colors.onPrimaryContainer, marginLeft: 8, fontWeight: '600' }}>
              Create Note
            </ThemedText>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="journal-outline" size={64} color={colors.onSurfaceVariant} />
        <ThemedText style={[styles.emptyTitle, Typography.titleLarge, { color: colors.onSurface }]}>
          Welcome to MindVault
        </ThemedText>
        <ThemedText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          Your personal semantic note-taking app{'\n'}
          Start by creating your first note
        </ThemedText>
        <TouchableOpacity
          style={[styles.emptyButton, { backgroundColor: colors.primary }]}
          onPress={handleCreateNote}
        >
          <Ionicons name="add" size={20} color={colors.onPrimary} />
          <ThemedText style={{ color: colors.onPrimary, marginLeft: 8, fontWeight: '600' }}>
            Create Your First Note
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, ...Elevation.level1 }]}>
        <View style={styles.headerContent}>
          <View>
            <ThemedText style={[styles.headerTitle, Typography.headlineMedium]}>
              MindVault
            </ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
              {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </ThemedText>
          </View>
          {notes.length > 0 && (
            <TouchableOpacity
              onPress={onRefresh}
              style={styles.refreshButton}
              disabled={refreshing}
            >
              <Ionicons 
                name="refresh" 
                size={24} 
                color={refreshing ? colors.onSurfaceVariant : colors.primary} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceVariant }]}>
          <Ionicons
            name="search"
            size={20}
            color={colors.onSurfaceVariant}
            style={styles.searchIcon}
          />
          <TextInput
            style={[
              styles.searchInput,
              Typography.bodyLarge,
              { color: colors.onSurface },
            ]}
            placeholder="Search notes... (e.g., 'machine learning tips')"
            placeholderTextColor={colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            editable={!isSearching}
          />
          {isSearching && (
            <ActivityIndicator size="small" color={colors.primary} style={styles.searchSpinner} />
          )}
          {searchQuery.length > 0 && !isSearching && (
            <TouchableOpacity 
              onPress={() => {
                setSearchQuery('');
                setIsSearchMode(false);
                setSearchResults([]);
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>

        {isSearchMode && searchResults.length > 0 && (
          <ThemedText style={[styles.searchInfo, { color: colors.onSurfaceVariant }]}>
            Found {searchResults.length} semantically similar notes
          </ThemedText>
        )}
      </View>

      {/* Notes List */}
      <FlatList
        data={displayData}
        renderItem={renderNoteItem}
        keyExtractor={(item, index) => {
          const note = 'note' in item ? item.note : item;
          return note._id || `note-${index}`;
        }}
        contentContainerStyle={[
          styles.listContent,
          displayData.length === 0 && styles.listContentEmpty
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        type={toastType}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />

      {/* Floating Action Button */}
      {!isLoading && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary, ...Elevation.level3 }]}
          onPress={handleCreateNote}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={colors.onPrimary} />
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  refreshButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchSpinner: {
    marginRight: 8,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
  },
  searchInfo: {
    marginTop: 8,
    fontSize: 12,
    paddingHorizontal: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  listContentEmpty: {
    padding: 16,
    paddingBottom: 80,
    flexGrow: 1,
  },
  noteCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteTitle: {
    flex: 1,
    marginRight: 8,
  },
  scoreChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  noteContent: {
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
  },
  moreTagsText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 11,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
  emptyButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
