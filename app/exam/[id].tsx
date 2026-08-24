import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
};

export default function ExamSession() {
  const { id, name } = useLocalSearchParams();
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionDone, setSessionDone] = useState(false);
  const [results, setResults] = useState({ correct: 0, incorrect: 0 });

  useEffect(() => {
    const fetchCards = async () => {
      const { data } = await supabase
        .from('cards')
        .select('*')
        .eq('playlist_id', id);
      if (data) {
        const shuffled = data.sort(() => Math.random() - 0.5);
        setCards(shuffled);
      }
      setLoading(false);
    };
    fetchCards();
  }, [id]);

  const handleReveal = () => {
    setRevealed(true);
  };

  const handleResult = async (correct: boolean) => {

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
          cards_correct: existing.cards_correct + (correct ? 1 : 0),
        }).eq('id', existing.id);
      } else {
        await supabase.from('study_sessions').insert({
          user_id: user?.id,
          studied_at: today,
          cards_reviewed: 1,
          cards_correct: correct ? 1 : 0,
        });
      }
    if (correct) {
      setResults((r) => ({ ...r, correct: r.correct + 1 }));
    } else {
      setResults((r) => ({ ...r, incorrect: r.incorrect + 1 }));
    }
    setAnswer('');
    setRevealed(false);
    if (currentIndex + 1 >= cards.length) {
      setSessionDone(true);
    } else {
      setCurrentIndex(currentIndex + 1);
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
        <Text style={styles.emptyText}>No hay tarjetas para examinar</Text>
        <Text style={styles.emptySubtext}>Agrega tarjetas a esta colección primero</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (sessionDone) {
    const total = results.correct + results.incorrect;
    const percentage = Math.round((results.correct / total) * 100);
    return (
      <View style={styles.centered}>
        <Text style={styles.doneIcon}>
          {percentage >= 80 ? '🏆' : percentage >= 50 ? '📈' : '💪'}
        </Text>
        <Text style={styles.doneTitle}>Examen completado</Text>
        <Text style={styles.doneSubtitle}>{total} tarjetas evaluadas</Text>

        <View style={styles.resultsBox}>
          <View style={styles.percentageRow}>
            <Text style={styles.percentageText}>{percentage}%</Text>
            <Text style={styles.percentageLabel}>de aciertos</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultDot}>✅</Text>
            <Text style={styles.resultLabel}>Correctas</Text>
            <Text style={styles.resultCount}>{results.correct}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultDot}>❌</Text>
            <Text style={styles.resultLabel}>Incorrectas</Text>
            <Text style={styles.resultCount}>{results.incorrect}</Text>
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { borderColor: card.color }]}>
          <View style={[styles.cardTop, { backgroundColor: card.color }]}>
            <Text style={styles.cardEmoji}>{card.emoji}</Text>
            <Text style={styles.cardTitle}>{card.title}</Text>
            {card.subtitle ? (
              <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
            ) : null}
          </View>

          {!revealed ? (
            <View style={styles.answerArea}>
              <Text style={styles.answerLabel}>¿Qué sabes sobre este tema?</Text>
              <TextInput
                style={styles.answerInput}
                placeholder="Escribe tu respuesta..."
                placeholderTextColor="#555"
                value={answer}
                onChangeText={setAnswer}
                multiline
                numberOfLines={4}
              />
              <TouchableOpacity style={styles.revealBtn} onPress={handleReveal}>
                <Text style={styles.revealBtnText}>Ver respuesta</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.revealArea}>
              {answer.trim() ? (
                <View style={styles.yourAnswer}>
                  <Text style={styles.yourAnswerLabel}>Tu respuesta:</Text>
                  <Text style={styles.yourAnswerText}>{answer}</Text>
                </View>
              ) : null}

              <View style={styles.correctAnswer}>
                <Text style={styles.correctAnswerLabel}>Respuesta correcta:</Text>
                {card.description ? (
                  <Text style={styles.correctAnswerText}>{card.description}</Text>
                ) : null}
                {card.stat1_label || card.stat2_label || card.stat3_label ? (
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

              <Text style={styles.selfEval}>¿Lo tenías correcto?</Text>
              <View style={styles.evalButtons}>
                <TouchableOpacity
                  style={[styles.evalBtn, styles.incorrectBtn]}
                  onPress={() => handleResult(false)}
                >
                  <Text style={styles.evalBtnText}>No</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.evalBtn, styles.correctBtn]}
                  onPress={() => handleResult(true)}
                >
                  <Text style={styles.evalBtnText}>Sí</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollContent: { padding: 24 },
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
  answerArea: { padding: 20 },
  answerLabel: { color: '#888', fontSize: 13, marginBottom: 12 },
  answerInput: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#333',
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 16,
  },
  revealBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  revealBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  revealArea: { padding: 20 },
  yourAnswer: {
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#6C63FF',
  },
  yourAnswerLabel: { color: '#6C63FF', fontSize: 12, marginBottom: 6 },
  yourAnswerText: { color: '#ccc', fontSize: 14, lineHeight: 20 },
  correctAnswer: {
    backgroundColor: '#1a2e1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#27ae60',
  },
  correctAnswerLabel: { color: '#27ae60', fontSize: 12, marginBottom: 6 },
  correctAnswerText: { color: '#ccc', fontSize: 14, lineHeight: 20 },
  statsGrid: { flexDirection: 'row', gap: 8, marginTop: 8 },
  statBox: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  statValue: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { color: '#888', fontSize: 11, textAlign: 'center' },
  selfEval: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  evalButtons: { flexDirection: 'row', gap: 12 },
  evalBtn: { flex: 1, padding: 18, borderRadius: 16, alignItems: 'center' },
  incorrectBtn: { backgroundColor: '#c0392b' },
  correctBtn: { backgroundColor: '#27ae60' },
  evalBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
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
  percentageRow: { alignItems: 'center', marginBottom: 16 },
  percentageText: { color: '#6C63FF', fontSize: 48, fontWeight: 'bold' },
  percentageLabel: { color: '#888', fontSize: 14 },
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