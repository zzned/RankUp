import { View, StyleSheet } from 'react-native';
import Skeleton from './Skeleton';

function CardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={24} style={styles.line} />
        <Skeleton width="70%" height={16} borderRadius={8} />
      </View>
      <View style={styles.cardBody}>
        <Skeleton width="90%" height={12} borderRadius={6} style={styles.line} />
        <Skeleton width="70%" height={12} borderRadius={6} style={styles.line} />
        <Skeleton width="50%" height={12} borderRadius={6} />
      </View>
    </View>
  );
}

export default function PlaylistBoardSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Skeleton width={70} height={16} borderRadius={8} />
        <Skeleton width={120} height={22} borderRadius={8} />
        <View style={styles.headerBtns}>
          <Skeleton width={65} height={16} borderRadius={8} />
          <Skeleton width={60} height={16} borderRadius={8} />
        </View>
      </View>
      <View style={styles.grid}>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 8,
    paddingBottom: 24,
  },
  headerBtns: { flexDirection: 'row', gap: 8 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cardHeader: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#222',
  },
  cardBody: {
    padding: 12,
    gap: 8,
  },
  line: { marginBottom: 4 },
});