import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';

const THEMES = [
  { id: 'classic', label: 'Clásico', color: '#6C63FF' },
  { id: 'fire', label: 'Fuego', color: '#FF4500' },
  { id: 'nature', label: 'Naturaleza', color: '#2ECC71' },
  { id: 'water', label: 'Agua', color: '#3498DB' },
  { id: 'dark', label: 'Oscuro', color: '#2C2C54' },
  { id: 'gold', label: 'Dorado', color: '#F39C12' },
];

type Playlist = {
  id: string;
  name: string;
};

export default function EditCard() {
  const { id } = useLocalSearchParams();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('⭐');
  const [stat1Label, setStat1Label] = useState('');
  const [stat1Value, setStat1Value] = useState('');
  const [stat2Label, setStat2Label] = useState('');
  const [stat2Value, setStat2Value] = useState('');
  const [stat3Label, setStat3Label] = useState('');
  const [stat3Value, setStat3Value] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [customColor, setCustomColor] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: card }, { data: playlistData }] = await Promise.all([
        supabase.from('cards').select('*').eq('id', id).single(),
        supabase.from('playlists').select('id, name'),
      ]);

      if (card) {
        setTitle(card.title);
        setSubtitle(card.subtitle ?? '');
        setDescription(card.description ?? '');
        setEmoji(card.emoji ?? '⭐');
        setStat1Label(card.stat1_label ?? '');
        setStat1Value(card.stat1_value ?? '');
        setStat2Label(card.stat2_label ?? '');
        setStat2Value(card.stat2_value ?? '');
        setStat3Label(card.stat3_label ?? '');
        setStat3Value(card.stat3_value ?? '');
        setSelectedPlaylist(card.playlist_id ?? null);
        const theme = THEMES.find((t) => t.id === card.theme);
        if (theme && theme.color === card.color) {
          setSelectedTheme(theme);
          setCustomColor(null);
        } else {
          setCustomColor(card.color);
          setSelectedTheme(THEMES[0]);
        }
      }
      if (playlistData) setPlaylists(playlistData);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('El título es obligatorio');
      return;
    }
    setSaving(true);
    setError('');

    const { error } = await supabase.from('cards').update({
      title,
      subtitle,
      description,
      emoji,
      stat1_label: stat1Label,
      stat1_value: stat1Value,
      stat2_label: stat2Label,
      stat2_value: stat2Value,
      stat3_label: stat3Label,
      stat3_value: stat3Value,
      theme: selectedTheme.id,
      color: customColor ?? selectedTheme.color,
      playlist_id: selectedPlaylist,
    }).eq('id', id);

    if (error) {
      setError(error.message);
    } else {
      router.back();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Modal visible={showColorPicker} transparent animationType="slide">
        <View style={styles.colorModalOverlay}>
          <View style={styles.colorModalContent}>
            <Text style={styles.colorModalTitle}>Elige un color</Text>
            <View style={styles.colorGrid}>
              {[
                '#6C63FF','#FF4500','#2ECC71','#3498DB','#2C2C54','#F39C12',
                '#E91E63','#00BCD4','#8BC34A','#FF5722','#9C27B0','#607D8B',
                '#F44336','#4CAF50','#2196F3','#FF9800','#795548','#009688',
                '#673AB7','#CDDC39','#FFC107','#03A9F4','#E040FB','#FF6F00',
                '#1B5E20','#0D47A1','#B71C1C','#F57F17','#4A148C','#006064',
              ].map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: color },
                    customColor === color && styles.colorSwatchSelected,
                  ]}
                  onPress={() => setCustomColor(color)}
                />
              ))}
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={() => setShowColorPicker(false)}>
              <Text style={styles.saveBtnText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Tarjeta</Text>
          <View style={{ width: 70 }} />
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>Emoji</Text>
          <TextInput
            style={[styles.input, styles.emojiInput]}
            value={emoji}
            onChangeText={setEmoji}
            maxLength={2}
          />

          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor="#555"
            value={title}
            onChangeText={setTitle}
            maxLength={40}
          />

          <Text style={styles.label}>Subtítulo</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor="#555"
            value={subtitle}
            onChangeText={setSubtitle}
            maxLength={60}
          />

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholderTextColor="#555"
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={300}
          />
          <Text style={styles.counter}>{description.length}/300</Text>

          <Text style={styles.label}>Stats (opcional)</Text>
          <View style={styles.statRow}>
            <TextInput style={[styles.input, styles.statLabel]} value={stat1Label} onChangeText={setStat1Label} maxLength={30} placeholderTextColor="#555" placeholder="Stat 1" />
            <TextInput style={[styles.input, styles.statValue]} value={stat1Value} onChangeText={setStat1Value} maxLength={15} placeholderTextColor="#555" placeholder="Valor" />
          </View>
          <View style={styles.statRow}>
            <TextInput style={[styles.input, styles.statLabel]} value={stat2Label} onChangeText={setStat2Label} maxLength={30} placeholderTextColor="#555" placeholder="Stat 2" />
            <TextInput style={[styles.input, styles.statValue]} value={stat2Value} onChangeText={setStat2Value} maxLength={15} placeholderTextColor="#555" placeholder="Valor" />
          </View>
          <View style={styles.statRow}>
            <TextInput style={[styles.input, styles.statLabel]} value={stat3Label} onChangeText={setStat3Label} maxLength={30} placeholderTextColor="#555" placeholder="Stat 3" />
            <TextInput style={[styles.input, styles.statValue]} value={stat3Value} onChangeText={setStat3Value} maxLength={15} placeholderTextColor="#555" placeholder="Valor" />
          </View>

          {playlists.length > 0 ? (
            <>
              <Text style={styles.label}>Colección (opcional)</Text>
              <View style={styles.themes}>
                {playlists.map((playlist) => (
                  <TouchableOpacity
                    key={playlist.id}
                    style={[
                      styles.themeBtn,
                      { backgroundColor: '#222', borderWidth: 1, borderColor: '#444' },
                      selectedPlaylist === playlist.id && { borderColor: '#6C63FF', borderWidth: 2 },
                    ]}
                    onPress={() => setSelectedPlaylist(selectedPlaylist === playlist.id ? null : playlist.id)}
                  >
                    <Text style={styles.themeBtnText}>{playlist.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : null}

          <Text style={styles.label}>Tema</Text>
          <View style={styles.themes}>
            <TouchableOpacity
              style={[
                styles.themeBtn,
                { backgroundColor: customColor ?? '#333', borderWidth: 1, borderColor: '#666' },
                customColor !== null && styles.themeBtnSelected,
              ]}
              onPress={() => setShowColorPicker(true)}
            >
              <Text style={styles.themeBtnText}>Color propio</Text>
            </TouchableOpacity>
            {THEMES.map((theme) => (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.themeBtn,
                  { backgroundColor: theme.color },
                  selectedTheme.id === theme.id && !customColor && styles.themeBtnSelected,
                ]}
                onPress={() => { setSelectedTheme(theme); setCustomColor(null); }}
              >
                <Text style={styles.themeBtnText}>{theme.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f0f' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  back: { color: '#6C63FF', fontSize: 16, width: 70 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  scroll: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  label: { color: '#888', fontSize: 13, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  emojiInput: { fontSize: 32, textAlign: 'center', width: 80 },
  textArea: { height: 100, textAlignVertical: 'top' },
  counter: { color: '#555', fontSize: 12, textAlign: 'right', marginTop: 4 },
  statRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statLabel: { flex: 2 },
  statValue: { flex: 1 },
  themes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  themeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    opacity: 0.7,
  },
  themeBtnSelected: { opacity: 1, borderWidth: 2, borderColor: '#fff' },
  themeBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  error: { color: '#ff4444', textAlign: 'center', marginBottom: 16 },
  saveBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  colorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  colorModalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
  },
  colorModalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    transform: [{ scale: 1.15 }],
  },
});