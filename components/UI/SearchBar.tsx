import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type Suggestion = {
  id: string;
  label: string;
  color?: string;
};

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  prefix: string;
  suggestions: Suggestion[];
  onSelectSuggestion: (id: string) => void;
};

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Buscar...',
  prefix,
  suggestions,
  onSelectSuggestion,
}: Props) {
  const [focused, setFocused] = useState(false);

  const showSuggestions = focused && value.trim().length > 0 && suggestions.length > 0;

  const handleSelect = (id: string) => {
    Keyboard.dismiss();
    setFocused(false);
    onSelectSuggestion(id);
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, focused && styles.containerFocused]}>
        <Ionicons name="search" size={18} color={focused ? '#6C63FF' : '#666'} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#555"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          returnKeyType="search"
        />
        {value.length > 0 ? (
          <TouchableOpacity onPress={() => onChangeText('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      {showSuggestions ? (
        <View style={styles.dropdown}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {suggestions.slice(0, 6).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestion}
                onPress={() => handleSelect(item.id)}
              >
                <View style={[styles.dot, { backgroundColor: item.color ?? '#6C63FF' }]} />
                <Text style={styles.suggestionText} numberOfLines={1}>
                  <Text style={styles.prefix}>{prefix}: </Text>
                  {item.label}
                </Text>
                <Ionicons name="arrow-forward" size={14} color="#555" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative', zIndex: 10, marginHorizontal: 24, marginBottom: 16 },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  containerFocused: { borderColor: '#6C63FF' },
  input: { flex: 1, color: '#fff', fontSize: 15, padding: 0 },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    maxHeight: 240,
    overflow: 'hidden',
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  suggestionText: { flex: 1, color: '#ddd', fontSize: 14 },
  prefix: { color: '#6C63FF', fontWeight: 'bold' },
});