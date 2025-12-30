import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type Todo = {
  id: string;
  text: string;
  done: boolean;
};

export default function TodoScreen() {
  const [text, setText] = useState('');
  const [todos, setTodos] = useState<Todo[]>([]);

  function addTodo() {
    const trimmed = text.trim();
    if (!trimmed) return;
    const newTodo: Todo = { id: `${Date.now()}-${Math.random()}`, text: trimmed, done: false };
    setTodos((t) => [newTodo, ...t]);
    setText('');
  }

  function toggleDone(id: string) {
    setTodos((t) => t.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  }

  function removeTodo(id: string) {
    Alert.alert('Delete', 'Remove this todo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setTodos((t) => t.filter((i) => i.id !== id)) },
    ]);
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Todos
      </ThemedText>

      <View style={styles.inputRow}>
        <TextInput
          placeholder="Add a new todo"
          placeholderTextColor="#8aa"
          value={text}
          onChangeText={setText}
          onSubmitEditing={addTodo}
          style={styles.input}
          returnKeyType="done"
        />
        <TouchableOpacity onPress={addTodo} style={styles.addButton}>
          <ThemedText type="defaultSemiBold">Add</ThemedText>
        </TouchableOpacity>
      </View>

      <FlatList
        data={todos}
        keyExtractor={(i) => i.id}
        style={styles.list}
        ListEmptyComponent={<ThemedText>No todos yet — add one above.</ThemedText>}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => toggleDone(item.id)} style={styles.todoRow}>
            <ThemedText style={[styles.todoText, item.done && styles.done]}>{item.text}</ThemedText>
            <View style={styles.rowRight}>
              <TouchableOpacity onPress={() => removeTodo(item.id)} style={styles.deleteBtn}>
                <ThemedText type="link">Delete</ThemedText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#E6F4FE',
  },
  list: {
    flex: 1,
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 12,
  },
  todoText: {
    flex: 1,
  },
  done: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
