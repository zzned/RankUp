import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { router, useFocusEffect } from 'expo-router';
import GridBackground from '../../components/Board/GridBackground';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BoardSkeleton from '../../components/UI/BoardSkeleton';  
import SearchBar from '../../components/UI/SearchBar';

type Card = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  emoji: string;
  theme: string;
  color: string;
  stat1_label: string;
  stat1_value: string;
  stat2_label: string;
  stat2_value: string;
  stat3_label: string;
  stat3_value: string;
};

export default function Board() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [search, setSearch] = useState('');

  const fetchProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
    if (user) {
      const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single();
      if (data) {
        setUsername(data.username);
        await AsyncStorage.setItem('cached_username', data.username);
        return;
      }
    }

    // Si no hay perfil en supabase, usa el cache local
    const cached = await AsyncStorage.getItem('cached_username');
    if (cached) {
      setUsername(cached);
      return;
    }

    // Si hay username pendiente del registro guardalo
    const pending = await AsyncStorage.getItem('pending_username');
    if (pending) {
      setUsername(pending);
    }
  };

  const fetchCards = async () => {
    const { data } = await supabase.from('cards').select('*').order('created_at', { ascending: false });
    if (data) setCards(data);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchCards();
      fetchProfile();
    }, [])
  );

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const getGreeting = () => {
    const hora = new Date().getHours();
    const frases = hora >= 5 && hora < 12
      ? ['Buenos días', 'A estudiar temprano', 'Gran inicio de día']
      : hora >= 12 && hora < 19
      ? ['Buenas tardes', 'Devuelta al estudio', 'Sigamos aprendiendo']
      : ['Buenas noches', 'Estudiando hasta tarde', 'El esfuerzo vale la pena'];
    const frase = frases[Math.floor(Math.random() * frases.length)];
    return username ? `${frase}, ${username}` : frase;
  };

  const filteredCards = cards.filter((card) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      card.title.toLowerCase().includes(q) ||
      (card.subtitle ?? '').toLowerCase().includes(q) ||
      (card.description ?? '').toLowerCase().includes(q)
    );
  });

  const suggestions = search.trim()
    ? filteredCards.map((c) => ({ id: c.id, label: c.title, color: c.color }))
    : [];

  return (
    <View style={styles.container}>
      <GridBackground />
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.title}>Mi Board</Text>
          </View>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logout}>Salir</Text>
          </TouchableOpacity>
        </View>

        {!loading && cards.length > 0 ? (
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar tarjeta..."
            prefix="Tarjeta"
            suggestions={suggestions}
            onSelectSuggestion={(id) => router.push(`/card/${id}`)}
          />
        ) : null}

        {loading ? <BoardSkeleton /> : cards.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🃏</Text>
            <Text style={styles.emptyText}>No tienes tarjetas aún</Text>
            <Text style={styles.emptySubtext}>Crea tu primera tarjeta para empezar</Text>
          </View>
        ) : filteredCards.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>Sin resultados</Text>
            <Text style={styles.emptySubtext}>No hay tarjetas que coincidan con "{search}"</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {filteredCards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={[styles.card, { borderColor: card.color }]}
                onPress={() => router.push(`/card/${card.id}`)}
              >
                <View style={[styles.cardHeader, { backgroundColor: card.color }]}>
                  <Text style={styles.cardEmoji}>{card.emoji}</Text>
                  <Text style={styles.cardTitle} numberOfLines={1}>{card.title}</Text>
                </View>
                {card.subtitle ? (
                  <Text style={styles.cardSubtitle} numberOfLines={1}>{card.subtitle}</Text>
                ) : null}
                {card.description ? (
                  <Text style={styles.cardDesc} numberOfLines={3}>{card.description}</Text>
                ) : null}
                {card.stat1_label ? (
                  <View style={styles.stats}>
                    {card.stat1_value ? (
                      <Text style={styles.statChip} numberOfLines={1} adjustsFontSizeToFit>
                        {card.stat1_value}
                      </Text>
                    ) : null}
                    {card.stat2_value ? (
                      <Text style={styles.statChip} numberOfLines={1} adjustsFontSizeToFit>
                        {card.stat2_value}
                      </Text>
                    ) : null}
                    {card.stat3_value ? (
                      <Text style={styles.statChip} numberOfLines={1} adjustsFontSizeToFit>
                        {card.stat3_value}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/card/create')}
        >
          <Text style={styles.fabText}>+ Nueva Tarjeta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  logout: { color: '#6C63FF', fontSize: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 20, color: '#fff', fontWeight: 'bold', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#888' },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
  },
  cardHeader: { padding: 12, alignItems: 'center' },
  cardEmoji: { fontSize: 32, marginBottom: 4 },
  cardTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14, textAlign: 'center' },
  cardSubtitle: { color: '#aaa', fontSize: 12, textAlign: 'center', paddingHorizontal: 8, paddingTop: 8 },
  cardDesc: { color: '#888', fontSize: 11, paddingHorizontal: 8, paddingTop: 4, paddingBottom: 8 },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  statChip: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    maxWidth: '100%',
  },
  fab: {
    backgroundColor: '#6C63FF',
    margin: 24,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  greeting: { fontSize: 13, color: '#6C63FF', marginBottom: 2 },
});