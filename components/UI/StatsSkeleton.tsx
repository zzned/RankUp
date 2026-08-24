import { View, StyleSheet } from 'react-native';
import Skeleton from './Skeleton';

export default function StatsSkeleton() {
  return (
    <View style={styles.container}>
      <Skeleton width={180} height={28} borderRadius={8} style={styles.title} />

      <View style={styles.grid}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.statCard}>
            <Skeleton width={60} height={36} borderRadius={8} style={styles.line} />
            <Skeleton width={80} height={12} borderRadius={6} style={styles.line} />
            <Skeleton width={32} height={32} borderRadius={16} />
          </View>
        ))}
      </View>

      <Skeleton width={200} height={18} borderRadius={8} style={styles.sectionTitle} />

      <View style={styles.heatmapContainer}>
        <View style={styles.heatmap}>
          {Array.from({ length: 90 }).map((_, i) => (
            <Skeleton key={i} width={12} height={12} borderRadius={2} style={styles.cell} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  title: { marginTop: 60, marginBottom: 24 },
  grid: {
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
    borderColor: '#2a2a2a',
    gap: 8,
  },
  sectionTitle: { marginBottom: 16 },
  heatmapContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  heatmap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  cell: { margin: 1 },
  line: { marginBottom: 4 },
});