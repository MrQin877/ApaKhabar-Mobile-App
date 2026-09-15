import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export function ApprovedBadge() {
  return (
    <View style={styles.badge} accessibilityLabel="Approved">
      <Ionicons name="shield-checkmark" size={13} color="#16803d" />
      <Text style={styles.text}>Approved</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, backgroundColor: '#eaf8ef', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, marginTop: 5 },
  text: { color: '#16803d', fontSize: 11, fontWeight: '600' },
});
