import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useFocusEffect } from 'expo-router';
import GridBackground from '../../components/Board/GridBackground';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StatsSkeleton from '../../components/UI/StatsSkeleton';

type Session = {
  studied_at: string;
  cards_reviewed: number;
  cards_correct: number;
};

export default function Stats() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCards, setTotalCards] = useState(0);
  const [streak, setStreak] = useState(0);
  const [heatmapColor, setHeatmapColor] = useState('#2196F3');
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    const loadColor = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
        const color = await AsyncStorage.getItem(`heatmap_color_${user.id}`);
        if (color) setHeatmapColor(color);
        }
    };
    loadColor();
    }, []);

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('studied_at', { ascending: false });

    if (data) {
      setSessions(data);
      const total = data.reduce((sum, s) => sum + s.cards_reviewed, 0);
      setTotalCards(total);
      setStreak(calculateStreak(data));
    }
    setLoading(false);
  };

  const calculateStreak = (data: Session[]) => {
    if (data.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < data.length; i++) {
      const sessionDate = new Date(data[i].studied_at);
      sessionDate.setHours(0, 0, 0, 0);
      const diff = Math.round((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === i) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const getTodayCards = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaySession = sessions.find(s => s.studied_at === today);
    return todaySession?.cards_reviewed ?? 0;
  };

  const getAvgAccuracy = () => {
    if (sessions.length === 0) return 0;
    const total = sessions.reduce((sum, s) => sum + s.cards_reviewed, 0);
    const correct = sessions.reduce((sum, s) => sum + s.cards_correct, 0);
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  };

  const getHeatmapData = () => {
    const days: { date: string; count: number }[] = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const session = sessions.find(s => s.studied_at === dateStr);
      days.push({ date: dateStr, count: session?.cards_reviewed ?? 0 });
    }
    return days;
  };

  const getHeatmapColor = (count: number) => {
    if (count === 0) return '#1a1a2e';
    const colors: { [key: string]: string[] } = {
        '#2196F3': ['#1a4a8a', '#1a6abf', '#2196F3', '#64B5F6'],
        '#27ae60': ['#1a4a2e', '#1a7a3e', '#27ae60', '#6fcf97'],
        '#E91E63': ['#4a1a2e', '#8a1a4a', '#E91E63', '#f48fb1'],
        '#F39C12': ['#4a2e1a', '#8a5a1a', '#F39C12', '#ffd54f'],
        '#9C27B0': ['#2e1a4a', '#5a1a8a', '#9C27B0', '#ce93d8'],
        '#FF5722': ['#4a1a1a', '#8a2a1a', '#FF5722', '#ff8a65'],
        '#00BCD4': ['#1a3a4a', '#1a6a8a', '#00BCD4', '#80deea'],
    };
    const palette = colors[heatmapColor] ?? colors['#2196F3'];
    if (count <= 3) return palette[0];
    if (count <= 8) return palette[1];
    if (count <= 15) return palette[2];
    return palette[3];
  };

  if (loading) {
    return (
        <View style={styles.container}>
        <GridBackground />
        <StatsSkeleton />
        </View>
    );
  }

  const heatmapData = getHeatmapData();

  return (
    <View style={styles.container}>
        <GridBackground />
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Estadísticas</Text>

        <View style={styles.statsGrid}>
            <View style={styles.statCard}>
            <Text style={styles.statNumber}>{streak}</Text>
            <Text style={styles.statLabel}>Racha de días</Text>
            <Text style={styles.statEmoji}></Text>
            </View>
            <View style={styles.statCard}>
            <Text style={styles.statNumber}>{getTodayCards()}</Text>
            <Text style={styles.statLabel}>Hoy</Text>
            <Text style={styles.statEmoji}></Text>
            </View>
            <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalCards}</Text>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statEmoji}></Text>
            </View>
            <View style={styles.statCard}>
            <Text style={styles.statNumber}>{getAvgAccuracy()}%</Text>
            <Text style={styles.statLabel}>Precisión</Text>
            <Text style={styles.statEmoji}></Text>
            </View>
        </View>

        <Text style={styles.sectionTitle}>Actividad últimos 90 días</Text>
        <View style={styles.heatmapContainer}>
            <View style={styles.heatmap}>
            {heatmapData.map((day, index) => (
                <View
                key={index}
                style={[
                    styles.heatmapCell,
                    { backgroundColor: getHeatmapColor(day.count) },
                ]}
                />
            ))}
            </View>
            <View style={styles.heatmapLegend}>
            <Text style={styles.legendText}>Menos</Text>
            {[0, 3, 8, 15, 20].map((count) => (
                <View
                key={count}
                style={[
                    styles.legendCell,
                    { backgroundColor: getHeatmapColor(count) },
                ]}
                />
            ))}
            <Text style={styles.legendText}>Más</Text>
            </View>

            <TouchableOpacity
            style={styles.colorPickerBtn}
            onPress={() => setShowColorPicker(!showColorPicker)}
            >
            <Text style={styles.colorPickerBtnText}>Personalizar color</Text>
            <View style={[styles.colorDot, { backgroundColor: heatmapColor }]} />
            </TouchableOpacity>

            {showColorPicker ? (
            <View style={styles.colorRow}>
                {['#2196F3', '#27ae60', '#E91E63', '#F39C12', '#9C27B0', '#FF5722', '#00BCD4'].map((color) => (
                <TouchableOpacity
                    key={color}
                    style={[
                    styles.colorSwatch,
                    { backgroundColor: color },
                    heatmapColor === color && styles.colorSwatchSelected,
                    ]}
                    onPress={async () => {
                        const { data: { user } } = await supabase.auth.getUser();
                        setHeatmapColor(color);
                        if (user) await AsyncStorage.setItem(`heatmap_color_${user.id}`, color);
                        setShowColorPicker(false);
                    }}
                />
                ))}
            </View>
            ) : null}
        </View>

        <View style={{ height: 100 }} />
        </ScrollView>
    </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f0f' },
  content: { flex: 1, paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', paddingTop: 60, marginBottom: 24 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  statNumber: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { color: '#888', fontSize: 13, marginBottom: 8 },
  statEmoji: { fontSize: 24 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  heatmapContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  heatmap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    marginBottom: 12,
  },
  heatmapCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'flex-end',
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: { color: '#666', fontSize: 11 },

  colorPickerBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 8,
  marginTop: 12,
},
colorPickerBtnText: { color: '#888', fontSize: 12 },
colorDot: { width: 14, height: 14, borderRadius: 7 },
colorRow: {
  flexDirection: 'row',
  gap: 10,
  justifyContent: 'center',
  marginTop: 12,
  flexWrap: 'wrap',
},
colorSwatch: { width: 32, height: 32, borderRadius: 16 },
colorSwatchSelected: { borderWidth: 3, borderColor: '#fff', transform: [{ scale: 1.15 }] },
});