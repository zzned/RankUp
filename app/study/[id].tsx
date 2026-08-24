import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';

type Card = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  emoji: string;
  color: string;
  stat1_label: string;
  stat1_value: string;
  stat2_label: string;
  stat2_value: string;
  stat3_label: string;
  stat3_value: string;
  ease: number;
  interval: number;
  review_count: number;
};

export default function StudySession() {
  const { id, name } = useLocalSearchParams();
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionDone, setSessionDone] = useState(false);
  const [results, setResults] = useState({ easy: 0, medium: 0, hard: 0 });
  const [flipAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const fetchCards = async () => {
      const { data } = await supabase
        .from('cards')
        .select('*')
        .eq('playlist_id', id)
        .order('next_review', { ascending: true });
      if (data) setCards(data);
      setLoading(false);
    };
    fetchCards();
  }, [id]);

  const revealCard = () => {
    setRevealed(true);
    Animated.spring(flipAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleAnswer = async (difficulty: 'easy' | 'medium' | 'hard') => {
    const card = cards[currentIndex];
    let newEase = card.ease;
    let newInterval = card.interval;

    if (difficulty === 'easy') {
      newEase = Math.min(card.ease + 0.1, 3.0);
      newInterval = Math.round(card.interval * newEase);
      setResults((r) => ({ ...r, easy: r.easy + 1 }));
    } else if (difficulty === 'medium') {
      newInterval = Math.round(card.interval * 1.2);
      setResults((r) => ({ ...r, medium: r.medium + 1 }));
    } else {
      newEase = Math.max(card.ease - 0.2, 1.3);
      newInterval = 1;
      setResults((r) => ({ ...r, hard: r.hard + 1 }));
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);

    await supabase.from('cards').update({
      ease: newEase,
      interval: newInterval,
      next_review: nextReview.toISOString(),
      review_count: card.review_count + 1,
    }).eq('id', card.id);

    flipAnim.setValue(0);
    setRevealed(false);

    if (currentIndex + 1 >= cards.length) {
      setSessionDone(true);
    } else {
      setCurrentIndex(currentIndex + 1);
    }

    const today = new Date().toISOString().split('T')[0];
      const { data: { user } } = await supabase.auth.getUser();

      const { data: existing } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('studied_at', today)
        .single();

      if (existing) {
        await supabase.from('study_sessions').update({
          cards_reviewed: existing.cards_reviewed + 1,
          cards_correct: existing.cards_correct + (difficulty === 'easy' ? 1 : 0),
        }).eq('id', existing.id);
      } else {
        await supabase.from('study_sessions').insert({
          user_id: user?.id,
          studied_at: today,
          cards_reviewed: 1,
          cards_correct: difficulty === 'easy' ? 1 : 0,
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={styles.emptyText}>No hay tarjetas para estudiar</Text>
        <Text style={styles.emptySubtext}>Agrega tarjetas a esta colección primero</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (sessionDone) {
    const total = results.easy + results.medium + results.hard;
    return (
      <View style={styles.centered}>
        <Text style={styles.doneIcon}>🎉</Text>
        <Text style={styles.doneTitle}>Sesión completada</Text>
        <Text style={styles.doneSubtitle}>{total} tarjetas revisadas</Text>

        <View style={styles.resultsBox}>
          <View style={styles.resultRow}>
            <Text style={styles.resultDot}>🟢</Text>
            <Text style={styles.resultLabel}>Fácil</Text>
            <Text style={styles.resultCount}>{results.easy}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultDot}>🟡</Text>
            <Text style={styles.resultLabel}>Regular</Text>
            <Text style={styles.resultCount}>{results.medium}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultDot}>🔴</Text>
            <Text style={styles.resultLabel}>Difícil</Text>
            <Text style={styles.resultCount}>{results.hard}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Volver a la colección</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const card = cards[currentIndex];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Salir</Text>
        </TouchableOpacity>
        <Text style={styles.progress}>{currentIndex + 1} / {cards.length}</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentIndex) / cards.length) * 100}%` }]} />
      </View>

      <View style={styles.cardArea}>
        <TouchableOpacity
          style={[styles.card, { borderColor: card.color }]}
          onPress={!revealed ? revealCard : undefined}
          activeOpacity={revealed ? 1 : 0.8}
        >
          <View style={[styles.cardTop, { backgroundColor: card.color }]}>
            <Text style={styles.cardEmoji}>{card.emoji}</Text>
            <Text style={styles.cardTitle}>{card.title}</Text>
            {card.subtitle ? <Text style={styles.cardSubtitle}>{card.subtitle}</Text> : null}
          </View>

          {!revealed ? (
            <View style={styles.tapHint}>
              <Text style={styles.tapHintText}>Toca para revelar</Text>
            </View>
          ) : (
            <View style={styles.cardContent}>
              {card.description ? (
                <Text style={styles.cardDesc}>{card.description}</Text>
              ) : null}
              {card.stat1_label ? (
                <View style={styles.statsGrid}>
                  {card.stat1_label ? (
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{card.stat1_value}</Text>
                      <Text style={styles.statLabel}>{card.stat1_label}</Text>
                    </View>
                  ) : null}
                  {card.stat2_label ? (
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{card.stat2_value}</Text>
                      <Text style={styles.statLabel}>{card.stat2_label}</Text>
                    </View>
                  ) : null}
                  {card.stat3_label ? (
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{card.stat3_value}</Text>
                      <Text style={styles.statLabel}>{card.stat3_label}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          )}
        </TouchableOpacity>
      </View>

      {revealed ? (
        <View style={styles.buttons}>
          <TouchableOpacity style={[styles.btn, styles.hardBtn]} onPress={() => handleAnswer('hard')}>
            <Text style={styles.btnText}>Difícil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.mediumBtn]} onPress={() => handleAnswer('medium')}>
            <Text style={styles.btnText}>Regular</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.easyBtn]} onPress={() => handleAnswer('easy')}>
            <Text style={styles.btnText}>Fácil</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttons}>
          <Text style={styles.hintBottom}>¿Recuerdas de qué trata esta tarjeta?</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f0f', padding: 32 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  back: { color: '#6C63FF', fontSize: 16, width: 60 },
  progress: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  progressBar: {
    height: 4,
    backgroundColor: '#222',
    marginHorizontal: 24,
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#6C63FF',
    borderRadius: 2,
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
  },
  cardTop: {
    padding: 32,
    alignItems: 'center',
  },
  cardEmoji: { fontSize: 56, marginBottom: 12 },
  cardTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  cardSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4, textAlign: 'center' },
  tapHint: { padding: 32, alignItems: 'center' },
  tapHintText: { color: '#555', fontSize: 16 },
  cardContent: { padding: 20 },
  cardDesc: { color: '#ccc', fontSize: 15, lineHeight: 22, marginBottom: 16 },
  statsGrid: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { color: '#888', fontSize: 11, textAlign: 'center' },
  buttons: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 16,
  },
  btn: {
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  hardBtn: { backgroundColor: '#c0392b' },
  mediumBtn: { backgroundColor: '#f39c12' },
  easyBtn: { backgroundColor: '#27ae60' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  hintBottom: { color: '#555', fontSize: 14, textAlign: 'center' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 20, color: '#fff', fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 32 },
  doneIcon: { fontSize: 64, marginBottom: 16 },
  doneTitle: { fontSize: 28, color: '#fff', fontWeight: 'bold', marginBottom: 8 },
  doneSubtitle: { fontSize: 16, color: '#888', marginBottom: 32 },
  resultsBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    marginBottom: 32,
  },
  resultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  resultDot: { fontSize: 16, marginRight: 12 },
  resultLabel: { flex: 1, color: '#fff', fontSize: 16 },
  resultCount: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  backBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    width: '100%',
  },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});