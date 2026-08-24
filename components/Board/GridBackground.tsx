import { View, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const CELL_SIZE = 30;

export default function GridBackground() {
  const cols = Math.ceil(width / CELL_SIZE) + 1;
  const rows = Math.ceil(height / CELL_SIZE) + 1;

  return (
    <View style={styles.container}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {Array.from({ length: cols }).map((_, colIndex) => (
            <View key={colIndex} style={styles.cell} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#111318',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1e2028',
  },
});