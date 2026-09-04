import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import GridBackground from '../../components/Board/GridBackground';
import PlaylistSkeleton from '../../components/UI/PlaylistSkeleton';
import SearchBar from '../../components/UI/SearchBar';
import { Ionicons } from '@expo/vector-icons';

type Playlist = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  card_count?: number;
};

export default function Playlists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchPlaylists = async () => {
    const { data } = await supabase
      .from('playlists')
      .select('*, cards(count)')
      .order('created_at', { ascending: false });
    if (data) {
      const formatted = data.map((p: any) => ({
        ...p,
        card_count: p.cards?.[0]?.count ?? 0,
      }));
      setPlaylists(formatted);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchPlaylists();
    }, [])
  );

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);

    if (editingId) {
      await supabase
        .from('playlists')
        .update({ name: name.trim(), description })
        .eq('id', editingId);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('playlists').insert({
        user_id: user?.id,
        name: name.trim(),
        description,
      });
    }

    setName('');
    setDescription('');
    setEditingId(null);
    setModalVisible(false);
    setSaving(false);
    fetchPlaylists();
  };

  const openEdit = (playlist: Playlist) => {
    setEditingId(playlist.id);
    setName(playlist.name);
    setDescription(playlist.description ?? '');
    setModalVisible(true);
  };

  const closeModal = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setModalVisible(false);
  };

  const handleDelete = async (playlistId: string, playlistName: string) => {
    Alert.alert(
      'Eliminar colección',
      `¿Estás seguro que quieres eliminar "${playlistName}"? Las tarjetas dentro no se eliminarán.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('playlists').delete().eq('id', playlistId);
            fetchPlaylists();
          },
        },
      ]
    );
  };

  const filteredPlaylists = playlists.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description ?? '').toLowerCase().includes(q)
    );
  });

  const suggestions = search.trim()
    ? filteredPlaylists.map((p) => ({ id: p.id, label: p.name }))
    : [];

  return (
    <View style={styles.container}>
      <GridBackground />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Colecciones</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={styles.addBtn}>+ Nueva</Text>
          </TouchableOpacity>
        </View>

        {!loading && playlists.length > 0 ? (
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar colección..."
            prefix="Colección"
            suggestions={suggestions}
            onSelectSuggestion={(id) => {
              const p = playlists.find((pl) => pl.id === id);
              if (p) router.push({ pathname: `/playlist/${p.id}`, params: { name: p.name } });
            }}
          />
        ) : null}

        {loading ? <PlaylistSkeleton /> : playlists.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="albums-outline" size={64} color="#6C63FF" style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No tienes colecciones</Text>
            <Text style={styles.emptySubtext}>Crea una para organizar tus tarjetas</Text>
          </View>
        ) : filteredPlaylists.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="search-outline" size={64} color="#555" style={styles.emptyIcon} />
            <Text style={styles.emptyText}>Sin resultados</Text>
            <Text style={styles.emptySubtext}>No hay colecciones que coincidan con "{search}"</Text>
          </View>
        ) : (
          
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
            {filteredPlaylists.map((playlist) => (
              <TouchableOpacity
                key={playlist.id}
                style={styles.playlistCard}
                onPress={() => router.push({ pathname: `/playlist/${playlist.id}`, params: { name: playlist.name } })}
              >
                <Text style={styles.playlistName} numberOfLines={2}>
                  {playlist.name}
                </Text>
                {playlist.description ? (
                  <Text style={styles.playlistDesc} numberOfLines={2}>{playlist.description}</Text>
                ) : null}

                <View style={styles.playlistFooter}>
                  <View style={styles.countBadge}>
                    <Text style={styles.cardCount}>{playlist.card_count}</Text>
                    <Text style={styles.cardCountLabel}>tarjetas</Text>
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        openEdit(playlist);
                      }}
                    >
                      <Text style={styles.editBtnText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDelete(playlist.id, playlist.name);
                      }}
                    >
                      <Text style={styles.deleteBtnText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>      
              <Text style={styles.modalTitle}>
                {editingId ? 'Editar Colección' : 'Nueva Colección'}
              </Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre"
              placeholderTextColor="#555"
              value={name}
              onChangeText={setName}
              maxLength={40}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descripción (opcional)"
              placeholderTextColor="#555"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={150}
            />

                <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={closeModal}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleCreate} disabled={saving}>
                    {saving ? (
                    <ActivityIndicator color="#fff" />
                    ) : (
                    <Text style={styles.saveBtnText}>{editingId ? 'Guardar' : 'Crear'}</Text>
                    )}
                </TouchableOpacity>
                </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  addBtn: { color: '#6C63FF', fontSize: 16, fontWeight: 'bold' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 20, color: '#fff', fontWeight: 'bold', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#888' },
  list: { paddingHorizontal: 24, paddingBottom: 100, gap: 12 },
    playlistCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  playlistName: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  playlistDesc: { color: '#888', fontSize: 13 },
  playlistFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  countBadge: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  actions: { flexDirection: 'row', gap: 8 },
  cardCount: { color: '#6C63FF', fontSize: 20, fontWeight: 'bold' },
  cardCountLabel: { color: '#666', fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 12,
  },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  
  input: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },

  cancelBtn: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#fff', fontSize: 16 },

  saveBtn: {
    flex: 1,
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    deleteBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 4,
    backgroundColor: '#2a1a1a',
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  deleteBtnText: { color: '#ff4444', fontSize: 13, fontWeight: 'bold' },

  editBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 4,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  editBtnText: { color: '#6C63FF', fontSize: 13, fontWeight: 'bold' },
});
