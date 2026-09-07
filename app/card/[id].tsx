import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import ShareCard from '../../components/Card/ShareCard';
import { Ionicons } from '@expo/vector-icons';

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
  playlist_id: string | null;
};

export default function CardDetail() {
  const { id } = useLocalSearchParams();
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchCard = async () => {
        const { data } = await supabase.from('cards').select('*').eq('id', id).single();
        if (data) setCard(data);
        setLoading(false);
      };
      fetchCard();
    }, [id])
  );

  const handleDelete = async () => {
    Alert.alert(
      'Eliminar tarjeta',
      '¿Estás seguro? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!card) return;
            await supabase.from('cards').delete().eq('id', card.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleDuplicate = async () => {
    if (!card) return;
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase.from('cards').insert({
      user_id: user?.id,
      title: `${card.title} (copia)`,
      subtitle: card.subtitle,
      description: card.description,
      emoji: card.emoji,
      stat1_label: card.stat1_label,
      stat1_value: card.stat1_value,
      stat2_label: card.stat2_label,
      stat2_value: card.stat2_value,
      stat3_label: card.stat3_label,
      stat3_value: card.stat3_value,
      theme: card.theme,
      color: card.color,
      playlist_id: card.playlist_id,
    }).select().single();

    if (!error && data) {
      router.replace({ pathname: '/card/edit', params: { id: data.id, duplicated: '1' } });
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  if (!card) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Tarjeta no encontrada</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Volver</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push({ pathname: '/card/edit', params: { id: card.id } })}>
        <Text style={styles.edit}>Editar</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleDuplicate} hitSlop={8}>
        <Ionicons name="copy-outline" size={20} color="#6C63FF" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setShowShare(true)}>
        <Text style={styles.share}>Compartir</Text>
      </TouchableOpacity>   
      <TouchableOpacity onPress={handleDelete}>
        <Text style={styles.delete}>Eliminar</Text>
      </TouchableOpacity>
    </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.cardContainer, { borderColor: card.color }]}>
          <View style={[styles.cardHeader, { backgroundColor: card.color }]}>
            <Text style={styles.cardEmoji}>{card.emoji}</Text>
            <Text style={styles.cardTitle}>{card.title}</Text>
            {card.subtitle ? (
              <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
            ) : null}
          </View>

          {card.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Descripción</Text>
              <Text style={styles.description}>{card.description}</Text>
            </View>
          ) : null}

          {card.stat1_label || card.stat2_label || card.stat3_label ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Stats</Text>
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
            </View>
          ) : null}
        </View>
      </ScrollView>
      {card ? (
        <ShareCard
          card={card}
          visible={showShare}
          onClose={() => setShowShare(false)}
          />
        ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f0f' },
  errorText: { color: '#fff', fontSize: 16 },
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
  back: { color: '#6C63FF', fontSize: 16 },
  edit: { color: '#6C63FF', fontSize: 16 },
  cardContainer: {
    margin: 24,
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  cardHeader: {
    padding: 32,
    alignItems: 'center',
  },
  cardEmoji: { fontSize: 64, marginBottom: 12 },
  cardTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  cardSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginTop: 4, textAlign: 'center' },
  section: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  sectionLabel: { color: '#666', fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  description: { color: '#ccc', fontSize: 15, lineHeight: 22 },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { color: '#888', fontSize: 12, textAlign: 'center' },
  delete: { color: '#ff4444', fontSize: 16 },
  share: { color: '#27ae60', fontSize: 16 },
});