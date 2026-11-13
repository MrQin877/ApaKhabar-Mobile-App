import { FormError } from "@/components/ui/FormError";
import { authDestination } from "../utils/authNavigation";
import { getPhoneResetStatus, resendPhoneResetOtp, verifyPhoneResetOtp, type PhoneResetStatus } from '../services/phonePasswordReset';
import { KeyboardForm } from '../components/KeyboardForm';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OtpCodeInput } from '../components/auth/OtpCodeInput';
import { AuthButton } from '../components/auth/AuthButton';
import { Button } from 'heroui-native/button';
import { Design, getTheme } from '../constants/theme';
import { useColorScheme } from '../hooks/use-color-scheme';
import { getProfile } from '../services/authService';
import {
  getPhoneVerificationStatus, requestPhoneOtp, verifyPhoneOtp,
  phoneVerificationError, phoneStatusFromError, type PhoneVerificationStatus,
} from '../services/phoneVerification';

export default function VerifyPhoneScreen() {
  const params = useLocalSearchParams<{ challenge?: string; purpose?: string; returnTo?: string }>();
  const challenge = typeof params.challenge === 'string' ? params.challenge : undefined;
  const passwordReset = params.purpose === 'password-reset';
  const fetchStatus = useCallback(() => passwordReset ? getPhoneResetStatus(challenge ?? '') : getPhoneVerificationStatus(challenge), [passwordReset, challenge]);
  const autoAttempted = useRef(false);
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const returnTo = params.returnTo;
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
              if (sent.status === 'otp-sent') setMessage('Kod SMS telah dihantar. Semak mesej anda.');
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
      if (data.status === 'otp-sent') setMessage('Kod SMS telah dihantar. Semak mesej anda.');
      else if (kind === 'verify' && !passwordReset && !data.phone_verified_at) setError('Pengesahan belum disahkan oleh pelayan. Sila cuba lagi.');
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

  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace(passwordReset ? '/(auth)/forgot-password' : returnTo ? authDestination(returnTo) : '/(tabs)/profile');
  };
  return (
    <KeyboardForm keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.page, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24, paddingLeft: Math.max(20, insets.left), paddingRight: Math.max(20, insets.right) }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}/>
      <View style={styles.toolbar}>
        <Button variant="ghost" className="min-w-0 rounded-lg p-0" accessibilityLabel="Kembali" isDisabled={busy} onPress={back} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color={theme.secondary}/>
        </Button>
        <Button variant="ghost" className="min-w-0 rounded-lg p-0" accessibilityLabel="Maklumat pengesahan" style={styles.iconButton}
          onPress={() => Alert.alert('Pengesahan nombor telefon', 'Masukkan kod 6 digit daripada SMS. Tempoh sah dan had penghantaran ditentukan oleh pelayan. Gunakan Hantar semula kod jika kod telah tamat tempoh.')}>
          <Ionicons name="information-circle-outline" size={23} color={theme.secondary}/>
        </Button>
      </View>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>{passwordReset ? 'Sahkan OTP tetapan semula' : 'Sahkan nombor telefon'}</Text>
      <Text style={[styles.body, { color: theme.secondary }]}>{status?.phone
        ? verified ? `Nombor ${maskPhoneNumber(status.phone)} telah disahkan.`
          : status.otp_pending ? `Kod SMS dihantar ke ${maskPhoneNumber(status.phone)}.` : `Sahkan nombor ${maskPhoneNumber(status.phone)}. Minta kod SMS untuk meneruskan.`
        : loading ? 'Memuatkan nombor telefon anda…' : 'Nombor telefon belum tersedia. Muat semula status atau kemas kini nombor telefon anda.'}</Text>
      {challenge && !passwordReset && !verified && <Text style={[styles.hint, { color: theme.secondary }]}>Nombor lama kekal digunakan sehingga nombor baharu berjaya disahkan.</Text>}
      {loading && <ActivityIndicator accessibilityLabel="Memuatkan status pengesahan" color={theme.primary} style={styles.loading}/>}
      {verified ? <>
        <View accessibilityLiveRegion="polite" style={[styles.banner, { backgroundColor: theme.communityBg }]}>
          <Ionicons name="checkmark-circle-outline" size={22} color={theme.primary}/>
          <Text style={[styles.bannerText, { color: theme.primary }]}>Nombor telefon anda berjaya disahkan.</Text>
        </View>
        <AuthButton variant="solid" title="Teruskan ke Berita" onPress={() => router.replace('/(tabs)/news_content')} disabled={busy}/>
      </> : <>
        {!!status?.phone && <View style={styles.form}>
          <Text style={[styles.label, { color: theme.text }]}>Kod pengesahan</Text>
          <OtpCodeInput value={otpDigits} onChange={digits => { setOtpDigits(digits); setError(''); }} disabled={busy} hasError={!!error || (!!otp && !/^[0-9]{6}$/.test(otp))} onSubmit={() => { void submit('verify'); }}/>
          <FormError inline message={otp && !/^[0-9]{6}$/.test(otp) ? "Masukkan kod OTP 6 digit." : ""}/>
          <Text style={[styles.hint, { color: theme.secondary }]}>Masukkan kod 6 digit yang diterima melalui SMS.</Text>
        </View>}
        <FormError message={error}/>
        {!!message && <Text accessibilityLiveRegion="polite" style={[styles.hint, { color: theme.secondary }]}>{message}</Text>}
        <FormError message={status?.daily_limit_reached ? "Had penghantaran kod telah dicapai. Cuba lagi selepas had ditetapkan semula. Kod yang masih sah boleh digunakan." : ""}/>
        <AuthButton variant="solid" title={passwordReset ? 'Sahkan OTP' : 'Sahkan nombor telefon'} onPress={() => { void submit('verify'); }} loading={action === 'verify'} disabled={busy || !status?.phone || !/^[0-9]{6}$/.test(otp)}/>
        <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-lg px-0 py-3" isDisabled={busy || !status?.phone || seconds > 0 || status.daily_limit_reached}
          onPress={() => { void submit('send'); }} style={styles.secondary}>
          {action === 'send' ? <ActivityIndicator color={theme.primary}/> : <Text style={[styles.link, { color: busy || seconds > 0 || status?.daily_limit_reached ? theme.secondary : theme.primary }]}>{seconds > 0 ? `Hantar semula kod (${seconds}s)` : 'Hantar semula kod'}</Text>}
        </Button>
        {!!error && <Button variant="ghost" className="h-auto min-w-0 rounded-lg px-0 py-2" isDisabled={busy} onPress={() => { void reload(); }}><Text style={[styles.link, { color: theme.primary }]}>Muat semula status</Text></Button>}
      </>}
      {!passwordReset && !verified && <View style={[styles.alternatives, { borderTopColor: theme.border }]}>
        <Button variant="ghost" className="h-auto min-w-0 rounded-lg px-0 py-3" isDisabled={busy} onPress={() => router.push('/(tabs)/profile/change-phone')}>
          <Text style={[styles.link, { color: theme.primary }]}>Ubah nombor telefon</Text>
        </Button>
        <Button variant="ghost" className="h-auto min-w-0 rounded-lg px-0 py-3" isDisabled={busy} onPress={() => router.push({ pathname: '/(auth)/login', params: { method: 'email' } })}>
          <Text style={[styles.link, { color: theme.primary }]}>Log masuk dengan e-mel</Text>
        </Button>
      </View>}
    </KeyboardForm>
  );
}

// Mask only the display value. API calls always use Laravel's full saved number.
export function maskPhoneNumber(phone: string) {
  const digits = phone.replace(/\D/g, '');
  const countryLength = digits.startsWith('60') || digits.startsWith('62') ? 2 : 0;
  // Unknown prefixes stay fully masked apart from the last four digits.
  if (!countryLength || digits.length < countryLength + 7) return `•••• ${digits.slice(-4)}`;
  return `+${digits.slice(0, countryLength)} ${digits.slice(countryLength, countryLength + 2)} •••• ${digits.slice(-4)}`;
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, width: '100%', maxWidth: Design.contentWidth, alignSelf: 'center' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  iconButton: { width: 44, height: 44 },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '800', letterSpacing: -0.6 },
  body: { fontSize: 14, lineHeight: 22, marginTop: 10 },
  form: { marginTop: 28, gap: 10 },
  label: { fontSize: 13, lineHeight: 20, fontWeight: '600' },
  hint: { fontSize: 12, lineHeight: 19, marginTop: 6 },
  loading: { marginTop: 20 },
  banner: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14, borderRadius: 12, marginTop: 20 },
  bannerText: { flex: 1, fontSize: 13, lineHeight: 20 },
  secondary: { minHeight: 44, marginTop: 8 },
  link: { fontSize: 13, lineHeight: 20, fontWeight: '600' },
  alternatives: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 20, paddingTop: 12 },
});
