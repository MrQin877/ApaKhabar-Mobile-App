import { Ionicons } from '@expo/vector-icons';
import { Button } from 'heroui-native/button';
import { ActivityIndicator, Modal, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FormError } from '@/components/ui/FormError';
import { Design, type Theme } from '@/constants/theme';

type Props = {
  visible: boolean;
  theme: Theme;
  dark: boolean;
  loading: boolean;
  error: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function LogoutConfirmation({ visible, theme, dark, loading, error, onConfirm, onCancel }: Props) {
  const insets = useSafeAreaInsets();
  const cancel = () => { if (!loading) onCancel(); };

  return <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={cancel}>
    <View style={[styles.page, { backgroundColor: dark ? theme.background : theme.accent }]}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'}/>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, {
        paddingTop: insets.top + Design.spacing.md,
        paddingBottom: insets.bottom + Design.spacing.lg,
        paddingLeft: Math.max(20, insets.left),
        paddingRight: Math.max(20, insets.right),
      }]}>
        <View style={styles.header}>
          <Button variant="ghost" isIconOnly className="h-11 min-h-0 w-11 min-w-0 rounded-xl p-0" accessibilityLabel="Kembali ke Profil" isDisabled={loading} onPress={cancel}>
            <Ionicons name="arrow-back" size={22} color={theme.text}/>
          </Button>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>Log keluar?</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.iconCircle, { backgroundColor: theme.warning }]}>
            <Ionicons name="log-out-outline" size={30} color={theme.error} accessible={false}/>
          </View>
          <Text style={[styles.message, { color: theme.text }]}>Anda masih boleh membaca berita sebagai tetamu.</Text>
          <Text style={[styles.description, { color: theme.secondary }]}>Notifikasi peribadi dan kandungan tersimpan tidak akan tersedia sehingga anda log masuk semula.</Text>
        </View>

        <View style={styles.actions}>
          <FormError message={error}/>
          <Button variant="danger" className="h-auto min-h-0 w-full rounded-xl px-4 py-3" accessibilityLabel="Log keluar" accessibilityState={{ busy: loading, disabled: loading }} isDisabled={loading} onPress={onConfirm} style={styles.button}>
            {loading && <ActivityIndicator size="small" color={theme.background}/>}
            <Text style={[styles.buttonText, { color: theme.background }]}>Log keluar</Text>
          </Button>
          <Button variant="outline" className="h-auto min-h-0 w-full rounded-xl px-4 py-3" accessibilityLabel="Batal" isDisabled={loading} onPress={cancel} style={[styles.button, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.buttonText, { color: theme.primary }]}>Batal</Text>
          </Button>
        </View>
      </ScrollView>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { width: '100%', maxWidth: Design.contentWidth, alignSelf: 'center', gap: Design.spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Design.spacing.sm },
  title: { flex: 1, fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: -0.4 },
  card: { borderRadius: Design.radius.card, borderWidth: StyleSheet.hairlineWidth, padding: Design.spacing.lg, alignItems: 'center', gap: Design.spacing.md },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  message: { fontSize: 16, lineHeight: 24, fontWeight: '600', textAlign: 'center' },
  description: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  actions: { gap: 12 },
  button: { minHeight: 52, borderRadius: 12, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Design.spacing.sm },
  buttonText: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
});
