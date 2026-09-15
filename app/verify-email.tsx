import { useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthButton } from '../components/auth/AuthButton';
import { ApprovedBadge } from '../components/profile/ApprovedBadge';
import { useVerifiedProfile } from '../hooks/useVerifiedProfile';
import { resendVerification, verificationError } from '../services/emailVerification';
import { getTheme } from '../constants/theme';
import { useColorScheme } from '../hooks/use-color-scheme';

export default function VerifyEmailScreen() {
  const insets = useSafeAreaInsets();
  const theme = getTheme(useColorScheme());
  const { user, confirmed, loading, error, refresh } = useVerifiedProfile();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [sendError, setSendError] = useState('');
  const pending = useRef(false);
  const verified = confirmed && !!user?.email && !!user.email_verified_at;

  async function resend() {
    if (pending.current) return;
    pending.current = true;
    setSending(true);
    setMessage('');
    setSendError('');
    try {
      const result = await resendVerification();
      if (result.status === 'verification-link-sent') setMessage(`Email konfirmasi dikirim ke ${result.email}.`);
      await refresh();
    } catch (err) {
      setSendError(verificationError(err));
    } finally {
      pending.current = false;
      setSending(false);
    }
  }

  async function check() {
    setMessage('');
    setSendError('');
    const profile = await refresh();
    if (profile?.email && !profile.email_verified_at) setMessage('E-mail belum disahkan. Klik tautan terbaru di inbox anda, lalu coba lagi.');
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={[styles.page, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <Ionicons name="mail-open-outline" size={56} color="#16803d" />
      <Text style={[styles.title, { color: theme.text }]}>Aktivasi e-mail</Text>
      {loading && <ActivityIndicator color="#16803d" />}
      <Text style={[styles.email, { color: theme.text }]}>{user?.email ?? 'Alamat e-mail belum tersedia'}</Text>
      {verified ? <ApprovedBadge /> : <Text style={[styles.body, { color: theme.text }]}>Periksa inbox dan folder spam anda. Klik tautan email konfirmasi untuk mengaktifkan alamat e-mail yang tersimpan di Profil.</Text>}
      {verified && <Text style={{ color: theme.text }}>Alamat e-mail anda telah disahkan.</Text>}
      {!!message && <Text accessibilityLiveRegion="polite" style={{ color: theme.text }}>{message}</Text>}
      {!!(sendError || error) && <Text accessibilityRole="alert" style={{ color: theme.error }}>{sendError || error}</Text>}
      <View style={{ width: '100%' }}>
        {!verified && <AuthButton title="Kirim ulang email konfirmasi" onPress={resend} loading={sending} disabled={loading || !confirmed || !user?.email} />}
        <AuthButton title="I have verified my email" onPress={check} loading={loading} disabled={sending} />
        <AuthButton title="Kembali ke Profil" onPress={() => router.replace('/(tabs)/profile')} disabled={sending} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 18 },
  title: { fontSize: 26, fontWeight: '700' },
  email: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  body: { fontSize: 15, lineHeight: 24, textAlign: 'center' },
});
