import { View, StyleSheet } from 'react-native';
import Skeleton from './Skeleton';

function PlaylistCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Skeleton width="60%" height={18} borderRadius={8} style={styles.line} />
        <Skeleton width="90%" height={12} borderRadius={6} />
      </View>
      <View style={styles.meta}>
        <Skeleton width={30} height={28} borderRadius={8} style={styles.line} />
        <Skeleton width={40} height={10} borderRadius={5} />
      </View>
    </View>
  );
}

export default function PlaylistSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Skeleton width={160} height={28} borderRadius={8} />
        <Skeleton width={60} height={16} borderRadius={8} />
      </View>
      <View style={styles.list}>
        <PlaylistCardSkeleton />
        <PlaylistCardSkeleton />
        <PlaylistCardSkeleton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
  },
  list: { gap: 12 },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  info: { flex: 1, gap: 8 },
  meta: { alignItems: 'center', marginLeft: 16, gap: 6 },
  line: { marginBottom: 4 },
});