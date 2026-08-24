import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import GridBackground from '../../components/Board/GridBackground';
import PlaylistBoardSkeleton from '../../components/UI/PlaylistBoardSkeleton';

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

export default function PlaylistBoard() {
  const { id, name } = useLocalSearchParams();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = async () => {
    const { data } = await supabase
      .from('cards')
      .select('*')
      .eq('playlist_id', id)
      .order('created_at', { ascending: false });
    if (data) setCards(data);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchCards();
    }, [])
  );

  return (
    <View style={styles.container}>
      <GridBackground />
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>{name}</Text>
          <View style={styles.headerBtns}>
          <TouchableOpacity onPress={() => router.push({ pathname: `/study/${id}`, params: { name } })}>
            <Text style={styles.studyBtn}>Estudiar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push({ pathname: `/exam/${id}`, params: { name } })}>
            <Text style={styles.examBtn}>Examen</Text>
          </TouchableOpacity>
        </View>
        </View>

        {loading ? <PlaylistBoardSkeleton /> : cards.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyIcon}>🃏</Text>
            <Text style={styles.emptyText}>No hay tarjetas aquí</Text>
            <Text style={styles.emptySubtext}>Asigna tarjetas a esta colección al crearlas</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {cards.map((card) => (
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
                {card.stat1_value || card.stat2_value || card.stat3_value ? (
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
      </View>
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
  back: { color: '#6C63FF', fontSize: 16, width: 70 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', flex: 1, textAlign: 'center' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 20, color: '#fff', fontWeight: 'bold', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#888', textAlign: 'center', paddingHorizontal: 32 },
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

  headerBtns: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  studyBtn: { color: '#27ae60', fontSize: 16, fontWeight: 'bold' },
  examBtn: { color: '#F39C12', fontSize: 16, fontWeight: 'bold' },
});