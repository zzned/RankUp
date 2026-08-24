import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';

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

type Props = {
  card: Card;
  visible: boolean;
  onClose: () => void;
};

export default function ShareCard({ card, visible, onClose }: Props) {
  const viewShotRef = useRef<ViewShot>(null);
  const [authorName, setAuthorName] = useState('');
  const [showAuthor, setShowAuthor] = useState(false);

  const handleShare = async () => {
    try {
      const uri = await viewShotRef.current?.capture?.();
      if (!uri) return;
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Compartir tarjeta',
      });
    } catch (e) {
      Alert.alert('Error', 'No se pudo compartir la tarjeta');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Compartir tarjeta</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>Cerrar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
              <View style={[styles.card, { borderColor: card.color }]}>
                <View style={[styles.cardHeader, { backgroundColor: card.color }]}>
                  <Text style={styles.cardEmoji}>{card.emoji}</Text>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  {card.subtitle ? (
                    <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                  ) : null}
                </View>

                {card.description ? (
                  <View style={styles.section}>
                    <Text style={styles.cardDesc}>{card.description}</Text>
                  </View>
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

                {showAuthor && authorName ? (
                  <View style={styles.authorArea}>
                    <Text style={styles.authorName}>{authorName}</Text>
                  </View>
                ) : null}
              </View>
            </ViewShot>

            <Text style={styles.sectionLabel}>Agregar nombre (opcional)</Text>
            <TouchableOpacity
              style={[styles.optionBtn, showAuthor && styles.optionBtnSelected]}
              onPress={() => setShowAuthor(!showAuthor)}
            >
              <Text style={styles.optionBtnText}>Agregar nombre</Text>
            </TouchableOpacity>

            {showAuthor ? (
              <TextInput
                style={styles.nameInput}
                placeholder="Tu nombre"
                placeholderTextColor="#555"
                value={authorName}
                onChangeText={setAuthorName}
                maxLength={40}
              />
            ) : null}

            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Text style={styles.shareBtnText}>Compartir imagen</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  container: {
    backgroundColor: '#0f0f0f',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  close: { color: '#6C63FF', fontSize: 16 },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 20,
  },
  cardHeader: { padding: 24, alignItems: 'center' },
  cardEmoji: { fontSize: 48, marginBottom: 8 },
  cardTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  cardSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4, textAlign: 'center' },
  section: { padding: 16 },
  cardDesc: { color: '#ccc', fontSize: 14, lineHeight: 20 },
  statsGrid: { flexDirection: 'row', gap: 8, padding: 16, paddingTop: 0 },
  statBox: { flex: 1, backgroundColor: '#222', borderRadius: 10, padding: 12, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { color: '#888', fontSize: 11, textAlign: 'center' },
  authorArea: { padding: 12, alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#2a2a2a' },
  authorName: { color: '#888', fontSize: 14, fontStyle: 'italic' },
  sectionLabel: { color: '#888', fontSize: 13, marginBottom: 12 },
  optionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  optionBtnSelected: { borderColor: '#6C63FF', borderWidth: 2 },
  optionBtnText: { color: '#fff', fontSize: 14 },
  nameInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
  },
  shareBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  shareBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});