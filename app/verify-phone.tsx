import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthButton } from '../components/auth/AuthButton';
import { ApprovedBadge } from '../components/profile/ApprovedBadge';
import { getTheme } from '../constants/theme';
import { useColorScheme } from '../hooks/use-color-scheme';
import { getProfile } from '../services/authService';
import {
  getPhoneVerificationStatus, requestPhoneOtp, verifyPhoneOtp,
  phoneVerificationError, phoneStatusFromError, type PhoneVerificationStatus,
} from '../services/phoneVerification';

export default function VerifyPhoneScreen() {
  const theme = getTheme(useColorScheme());
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<PhoneVerificationStatus | null>(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<'send' | 'verify' | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [retryAt, setRetryAt] = useState(0);
  const [resetAt, setResetAt] = useState(0);
  const [clock, setClock] = useState(() => Date.now());
  const pending = useRef(false);
  const generation = useRef(0);
  const active = useRef(false);
  const lastPhone = useRef<string | null>(null);

  const applyStatus = useCallback((data: PhoneVerificationStatus) => {
    if (lastPhone.current !== data.phone) setOtp('');
    lastPhone.current = data.phone;
    setStatus(data);
    const now = Date.now();
    setClock(now);
    setRetryAt(now + data.retry_after * 1000);
    setResetAt(now + data.daily_reset_after * 1000);
  }, []);

  const reload = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;
    const request = ++generation.current;
    setLoading(true);
    setError('');
    try {
      const data = await getPhoneVerificationStatus();
      if (active.current && request === generation.current) applyStatus(data);
    } catch (err) {
      if (active.current && request === generation.current) {
        setStatus(null);
        setError(phoneVerificationError(err));
      }
    } finally {
      if (request === generation.current) {
        pending.current = false;
        if (active.current) setLoading(false);
      }
    }
  }, [applyStatus]);

  useFocusEffect(useCallback(() => {
    active.current = true;
    setAction(null);
    setMessage('');
    void reload();
    const onActive = () => { void reload(); };
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') onActive(); });
    if (Platform.OS === 'web') window.addEventListener('focus', onActive);
    return () => {
      active.current = false;
      generation.current++;
      pending.current = false;
      subscription.remove();
      if (Platform.OS === 'web') window.removeEventListener('focus', onActive);
    };
  }, [reload]));

  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (active.current && status?.daily_limit_reached && resetAt > 0 && clock >= resetAt && !loading && !action && !error) {
      void reload();
    }
  }, [clock, resetAt, status?.daily_limit_reached, loading, action, error, reload]);

  const seconds = Math.max(0, Math.ceil((retryAt - clock) / 1000));
  const verified = !!status?.phone_verified_at;
  const busy = loading || action !== null;

  async function submit(kind: 'send' | 'verify') {
    if (pending.current || !status?.phone || verified) return;
    if (kind === 'send' && (seconds > 0 || status.daily_limit_reached)) return;
    if (kind === 'verify' && !/^[0-9]{6}$/.test(otp)) {
      setError('Sila masukkan kod OTP 6 digit.');
      return;
    }
    pending.current = true;
    const request = ++generation.current;
    setAction(kind);
    setError('');
    setMessage('');
    try {
      const data = kind === 'send' ? await requestPhoneOtp() : await verifyPhoneOtp(status.phone, otp);
      if (!active.current || request !== generation.current) return;
      applyStatus(data);
      setOtp('');
      setMessage(data.status === 'otp-sent' ? 'OTP telah dihantar. Kod sah selama 10 minit.' : 'Nombor telefon anda telah disahkan.');
      if (data.phone_verified_at) {
        // Refresh the cached account too; Profile also reloads on focus.
        try { await getProfile(); } catch { /* Profile will retry on focus. */ }
      }
    } catch (err) {
      if (!active.current || request !== generation.current) return;
      setError(phoneVerificationError(err));
      const data = phoneStatusFromError(err);
      if (data) applyStatus(data);
      else if (kind === 'send') {
        // A timeout may happen after the server accepted the SMS. Restore its limits.
        try {
          const latest = await getPhoneVerificationStatus();
          if (active.current && request === generation.current) applyStatus(latest);
        } catch {
          if (active.current && request === generation.current) setStatus(null);
        }
      }
    } finally {
      if (request === generation.current) {
        pending.current = false;
        if (active.current) setAction(null);
      }
    }
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled" style={{ backgroundColor: theme.background }} contentContainerStyle={[styles.page, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <Ionicons name="phone-portrait-outline" size={56} color="#16803d" />
      <Text style={[styles.title, { color: theme.text }]}>Sahkan Nombor Telefon</Text>
      {loading && <ActivityIndicator color="#16803d" />}
      {status && <Text style={[styles.phone, { color: theme.text }]}>{status.phone ?? 'Nombor telefon belum didaftarkan.'}</Text>}
      {verified && <><ApprovedBadge /><Text style={{ color: theme.text }}>Nombor telefon anda telah disahkan.</Text></>}
      {status?.phone && !verified && <>
        <Text style={[styles.body, { color: theme.text }]}>Minta kod OTP melalui SMS, kemudian masukkan kod 6 digit untuk mengesahkan nombor telefon anda.</Text>
        <Text style={[styles.body, { color: theme.secondary }]}>Maksimum 5 permintaan sehari. Tunggu 60 saat sebelum meminta OTP semula.</Text>
        {status.daily_limit_reached && <Text accessibilityRole="alert" style={{ color: theme.error }}>Had 5 permintaan OTP sehari telah dicapai. Sila cuba lagi esok. Anda masih boleh mengesahkan kod terakhir yang belum tamat tempoh.</Text>}
        <View style={styles.form}>
          <TextInput accessibilityLabel="Kod OTP 6 digit" value={otp} onChangeText={text => { setOtp(text.replace(/[^0-9]/g, '').slice(0, 6)); setError(''); }} keyboardType="number-pad" autoComplete="sms-otp" textContentType="oneTimeCode" maxLength={6} autoCorrect={false} editable={!busy} placeholder="000000" placeholderTextColor={theme.secondary} style={[styles.input, { color: theme.text, borderColor: theme.border }]} />
          <AuthButton title="Sahkan OTP" onPress={() => { void submit('verify'); }} loading={action === 'verify'} disabled={busy || otp.length !== 6} />
          <AuthButton title={seconds > 0 ? `Minta semula dalam ${seconds}s` : status.otp_pending ? 'Hantar semula OTP' : 'Minta OTP'} onPress={() => { void submit('send'); }} loading={action === 'send'} disabled={busy || seconds > 0 || status.daily_limit_reached} />
        </View>
      </>}
      {!!message && !verified && <Text accessibilityLiveRegion="polite" style={{ color: theme.text }}>{message}</Text>}
      {!!error && <Text accessibilityRole="alert" style={{ color: theme.error }}>{error}</Text>}
      <View style={styles.form}>
        {!!error && <AuthButton title="Muat semula status" onPress={() => { void reload(); }} disabled={busy} />}
        <AuthButton title="Kembali ke Profil" onPress={() => router.replace('/(tabs)/profile')} disabled={busy} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 18 },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  phone: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  body: { fontSize: 15, lineHeight: 24, textAlign: 'center' },
  form: { width: '100%' },
  input: { height: 52, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 24, letterSpacing: 8, textAlign: 'center' },
});
