/**
 * Notes screen - Demo of NoteEditor component
 * Shows the rich text editor with AI-powered features
 */

import React, { useState } from 'react';
import { StyleSheet, Alert, View } from 'react-native';
import { NoteEditor } from '@/components/NoteEditor';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Note } from '@/types/note';

// Mock existing notes for related notes feature
const MOCK_NOTES: Note[] = [
  {
    id: '1',
    title: 'Project Planning',
    content: 'Need to plan the next sprint. Focus on user authentication and dashboard improvements.',
    tags: ['work', 'planning', 'sprint'],
    createdAt: new Date('2025-12-20'),
    updatedAt: new Date('2025-12-20'),
  },
  {
    id: '2',
    title: 'Meeting Notes',
    content: 'Discussed new features with the team. Priority is mobile app development and API optimization.',
    tags: ['work', 'meeting', 'mobile'],
    createdAt: new Date('2025-12-22'),
    updatedAt: new Date('2025-12-22'),
  },
  {
    id: '3',
    title: 'React Native Tips',
    content: 'Always use hooks for state management. Remember to optimize re-renders with useMemo and useCallback.',
    tags: ['development', 'react-native', 'tips'],
    createdAt: new Date('2025-12-25'),
    updatedAt: new Date('2025-12-25'),
  },
  {
    id: '4',
    title: 'Firebase Setup',
    content: 'Configure Firebase Vertex AI for the note-taking app. Need to set up authentication and Firestore.',
    tags: ['firebase', 'setup', 'backend'],
    createdAt: new Date('2025-12-26'),
    updatedAt: new Date('2025-12-26'),
  },
];

export default function NotesScreen() {
  const [savedNotes, setSavedNotes] = useState<Note[]>(MOCK_NOTES);

  const handleSave = async (note: Note) => {
    // Simulate save delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Update or add note
    setSavedNotes((prev) => {
      const existingIndex = prev.findIndex((n) => n.id === note.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = note;
        return updated;
      }
      return [...prev, note];
    });

    Alert.alert('Success', 'Note saved successfully!');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Note Editor</ThemedText>
        <ThemedText style={styles.subtitle}>
          AI-powered note-taking with semantic search
        </ThemedText>
      </View>

      <NoteEditor
        initialNote={{
          title: 'New Note',
          content: 'Start typing to see AI tag suggestions and related notes...',
          tags: [],
        }}
        onSave={handleSave}
        existingNotes={savedNotes}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 60,
    gap: 4,
  },
  subtitle: {
    opacity: 0.7,
    fontSize: 14,
  },
});
