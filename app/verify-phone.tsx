import { getPhoneResetStatus, resendPhoneResetOtp, verifyPhoneResetOtp, type PhoneResetStatus } from '../services/phonePasswordReset';
import { KeyboardForm } from '../components/KeyboardForm';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Platform, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OtpCodeInput } from '../components/auth/OtpCodeInput';
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
  const params = useLocalSearchParams<{ challenge?: string; purpose?: string }>();
  const challenge = typeof params.challenge === 'string' ? params.challenge : undefined;
  const passwordReset = params.purpose === 'password-reset';
  const fetchStatus = useCallback(() => passwordReset ? getPhoneResetStatus(challenge ?? '') : getPhoneVerificationStatus(challenge), [passwordReset, challenge]);
  const autoAttempted = useRef(false);
  const theme = getTheme(useColorScheme());
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<PhoneVerificationStatus | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const otp = otpDigits.join('');
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
    if (lastPhone.current !== data.phone) setOtpDigits(Array(6).fill(''));
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
      const data = await fetchStatus();
      if (!active.current || request !== generation.current) return;
      applyStatus(data);
      // Entering verification is the submitted action: send once, never on every focus/reload.
      if (!passwordReset && !challenge && !autoAttempted.current) {
        autoAttempted.current = true;
        if (data.phone && !data.phone_verified_at && !data.otp_pending && data.retry_after === 0 && !data.daily_limit_reached) {
          try {
            const sent = await requestPhoneOtp();
            if (active.current && request === generation.current) {
              applyStatus(sent);
              setMessage('OTP telah dihantar. Kod sah selama 10 minit.');
            }
          } catch (err) {
            if (active.current && request === generation.current) {
              setError(phoneVerificationError(err));
              const latest = phoneStatusFromError(err);
              if (latest) applyStatus(latest);
            }
          }
        }
      }
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
  }, [applyStatus, challenge, fetchStatus, passwordReset]);

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
  const verified = !passwordReset && !!status?.phone_verified_at;
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
      const data: PhoneResetStatus = passwordReset
        ? (kind === 'send' ? await resendPhoneResetOtp(challenge ?? '') : await verifyPhoneResetOtp(challenge ?? '', otp))
        : (kind === 'send' ? await requestPhoneOtp(challenge) : await verifyPhoneOtp(status.phone, otp, challenge));
      if (!active.current || request !== generation.current) return;
      if (passwordReset && data.reset_token) {
        router.replace({ pathname: '/(auth)/reset-password', params: { challenge: challenge!, phone: status.phone, token: data.reset_token } });
        return;
      }
      applyStatus(data);
      setOtpDigits(Array(6).fill(''));
      setMessage(data.status === 'otp-sent' ? 'OTP telah dihantar. Kod sah selama 10 minit.' : 'Nombor telefon anda telah disahkan.');
      if (!passwordReset && data.phone_verified_at) {
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
          const latest = await fetchStatus();
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
    <KeyboardForm keyboardShouldPersistTaps="handled" style={{ backgroundColor: theme.background }} contentContainerStyle={[styles.page, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <Ionicons name="phone-portrait-outline" size={56} color="#16803d" />
      <Text style={[styles.title, { color: theme.text }]}>{passwordReset ? 'Sahkan OTP Tetapan Semula' : 'Sahkan Nombor Telefon'}</Text>
      {challenge && !passwordReset && !verified && <Text style={[styles.body, { color: theme.secondary }]}>Nomor lama tetap digunakan sampai nomor baru berhasil diverifikasi.</Text>}
      {loading && <ActivityIndicator color="#16803d" />}
      {status && <Text style={[styles.phone, { color: theme.text }]}>{status.phone ?? 'Nombor telefon belum didaftarkan.'}</Text>}
      {verified && <><ApprovedBadge /><Text style={{ color: theme.text }}>Nombor telefon anda telah disahkan.</Text></>}
      {status?.phone && !verified && <>
        <Text style={[styles.body, { color: theme.text }]}>Masukkan kod OTP 6 digit yang dihantar melalui SMS untuk mengesahkan nombor telefon anda.</Text>
        <Text style={[styles.body, { color: theme.secondary }]}>Maksimum 5 permintaan sehari. Tunggu 60 saat sebelum meminta OTP semula.</Text>
        {status.daily_limit_reached && <Text accessibilityRole="alert" style={{ color: theme.error }}>Had 5 permintaan OTP sehari telah dicapai. Sila cuba lagi esok. Anda masih boleh mengesahkan kod terakhir yang belum tamat tempoh.</Text>}
        <View style={styles.form}>
          <OtpCodeInput value={otpDigits} onChange={digits => { setOtpDigits(digits); setError(''); }} disabled={busy} />
          <AuthButton title="Sahkan OTP" onPress={() => { void submit('verify'); }} loading={action === 'verify'} disabled={busy || otp.length !== 6} />
          <AuthButton title={seconds > 0 ? `Minta semula dalam ${seconds}s` : 'Hantar semula OTP'} onPress={() => { void submit('send'); }} loading={action === 'send'} disabled={busy || seconds > 0 || status.daily_limit_reached} />
        </View>
      </>}
      {!!message && !verified && <Text accessibilityLiveRegion="polite" style={{ color: theme.text }}>{message}</Text>}
      {!!error && <Text accessibilityRole="alert" style={{ color: theme.error }}>{error}</Text>}
      <View style={styles.form}>
        {!!error && <AuthButton title="Muat semula status" onPress={() => { void reload(); }} disabled={busy} />}
        <AuthButton title="Kembali" onPress={() => router.replace(passwordReset ? '/(auth)/forgot-password' : '/(tabs)/profile')} disabled={busy} />
      </View>
    </KeyboardForm>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 18 },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  phone: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  body: { fontSize: 15, lineHeight: 24, textAlign: 'center' },
  form: { width: '100%' },
});
