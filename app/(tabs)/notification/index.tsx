import { View, Text, StyleSheet } from 'react-native';

export default function Notifikasi() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Notifikasi</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  text: { fontSize: 18, fontWeight: '600', color: '#1A2E27' },
});