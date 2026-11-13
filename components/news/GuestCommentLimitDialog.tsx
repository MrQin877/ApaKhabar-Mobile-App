import { Ionicons } from '@expo/vector-icons';
import { Button } from 'heroui-native/button';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Design, type Theme } from '@/constants/theme';

export function GuestCommentLimitDialog({ visible, theme, onClose, onLogin }: {
  visible: boolean; theme: Theme; onClose: () => void; onLogin: () => void;
}) {
  const insets = useSafeAreaInsets();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={[styles.overlay, { backgroundColor: theme.overlay, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      <ScrollView bounces={false} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View accessibilityViewIsModal onAccessibilityEscape={onClose} style={[styles.card, { backgroundColor: theme.card }]}>
          <Button variant="ghost" className="h-auto min-h-0 min-w-0 p-0" accessibilityLabel="Tutup dialog" onPress={onClose} style={styles.close}><Ionicons name="close" size={25} color={theme.text}/></Button>
          <View style={[styles.illustration, { backgroundColor: theme.communityBg }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={54} color={theme.primary}/>
            <View style={[styles.lock, { backgroundColor: theme.communityBg }]}><Ionicons name="lock-closed" size={25} color={theme.primary}/></View>
          </View>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>Had komen tetamu telah dicapai</Text>
          <Text style={[styles.description, { color: theme.secondary }]}>Anda telah menggunakan 3 komen sebagai tetamu. Log masuk untuk terus memberi komen.</Text>
          <Button className="h-auto min-h-0 w-full" onPress={onLogin} style={[styles.button, Design.primaryButton, { backgroundColor: theme.primary }]}><Text style={[Design.primaryButtonText, { color: theme.background }]}>Log masuk</Text></Button>
          <Button variant="outline" className="h-auto min-h-0 w-full" onPress={onClose} style={[styles.button, { borderColor: theme.border, borderWidth: 1, backgroundColor: theme.card }]}><Text style={[styles.buttonText, { color: theme.text }]}>Kekal sebagai tetamu</Text></Button>
        </View>
      </ScrollView>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, paddingHorizontal: 24 },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  card: { width: '100%', maxWidth: 420, padding: 24, paddingTop: 38, borderRadius: 28, alignItems: 'center', gap: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' },
  close: { position: 'absolute', right: 8, top: 8, width: 44, height: 44 },
  illustration: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  lock: { position: 'absolute', right: 17, bottom: 21, borderRadius: 4, padding: 2 },
  title: { textAlign: 'center', fontSize: 23, lineHeight: 29, fontWeight: '800' },
  description: { textAlign: 'center', fontSize: 15, lineHeight: 23, marginBottom: 12 },
  button: { width: '100%', minHeight: 50, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
});
