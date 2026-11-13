import { FormError } from "@/components/ui/FormError";
import { authDestination } from "../utils/authNavigation";
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View, StyleSheet, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthButton } from '../components/auth/AuthButton';
import { ApprovedBadge } from '../components/profile/ApprovedBadge';
import { useVerifiedProfile } from '../hooks/useVerifiedProfile';
import { completeEmailRegistration, hasPendingEmailRegistration } from '../services/authService';
import { resendVerification, verificationError } from '../services/emailVerification';
import { getTheme } from '../constants/theme';
import { useColorScheme } from '../hooks/use-color-scheme';

export default function VerifyEmailScreen() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const insets = useSafeAreaInsets();
  const theme = getTheme(useColorScheme());
  const { user, confirmed, loading, error, refresh } = useVerifiedProfile();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [sendError, setSendError] = useState('');
  const pending = useRef(false);
  const [registrationPending, setRegistrationPending] = useState<boolean | null>(Platform.OS === 'web' ? false : null);

  useEffect(() => {
    let active = true;
    hasPendingEmailRegistration()
      .then(value => { if (active) setRegistrationPending(value); })
      .catch(() => { if (active) setRegistrationPending(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!confirmed || !user?.email_verified_at || !registrationPending) return;
    let active = true;
    completeEmailRegistration(user)
      .then(completed => { if (active && completed) router.dismissTo(authDestination(returnTo)); })
      .catch(err => { if (active) setSendError(verificationError(err)); });
    return () => { active = false; };
  }, [confirmed, user, registrationPending, returnTo]);
  const verified = confirmed && !!user?.email && !!user.email_verified_at;
  const unverified = confirmed && !loading && !!user?.email && user.email_verified_at === null;

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
    if (profile?.email && profile.email_verified_at === null) setMessage('E-mail belum disahkan. Klik tautan terbaru di inbox anda, lalu coba lagi.');
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={[styles.page, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <Ionicons name="mail-open-outline" size={56} color={theme.primary} />
      <Text style={[styles.title, { color: theme.text }]}>Aktivasi e-mail</Text>
      {loading && <ActivityIndicator color={theme.primary} />}
      <Text style={[styles.email, { color: theme.text }]}>{user?.email ?? 'Alamat e-mail belum tersedia'}</Text>
      {verified && <ApprovedBadge />}
      {unverified && <Text style={[styles.body, { color: theme.text }]}>Periksa inbox dan folder spam anda. Klik tautan email konfirmasi untuk mengaktifkan alamat e-mail yang tersimpan di Profil.</Text>}
      {verified && <Text style={{ color: theme.text }}>Alamat e-mail anda telah disahkan.</Text>}
      {!!message && unverified && <Text accessibilityLiveRegion="polite" style={{ color: theme.text }}>{message}</Text>}
      <FormError message={sendError || error}/>
      <View style={{ width: '100%' }}>
        {unverified && <AuthButton variant="solid" title="Kirim ulang email konfirmasi" onPress={resend} loading={sending} disabled={loading || !confirmed || !user?.email} />}
        <AuthButton variant="solid" title="I have verified my email" onPress={check} loading={loading} disabled={sending} />
        {registrationPending === false && <AuthButton variant="solid" title="Kembali ke Profil" onPress={() => router.replace('/(tabs)/profile')} disabled={sending} />}
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
