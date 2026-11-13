import { Button } from "heroui-native/button";
import { FormInput } from "@/components/ui/FormInput";
import { emailError, phoneError, serverFieldErrors } from "@/utils/formValidation";
import { FormError } from "@/components/ui/FormError";
import { PhoneNumberInput } from '../../components/phone-number-input';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { requestPhonePasswordReset } from '../../services/phonePasswordReset';
import { phoneVerificationError } from '../../services/phoneVerification';
import { KeyboardForm } from '../../components/KeyboardForm';
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet,  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthButton } from '../../components/auth/AuthButton';
import { forgotPassword } from '../../services/authService';
import { Design, getTheme } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { passwordResetError } from '@/utils/passwordReset';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  const [email, setEmail] = useState('');
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [emailFocused, setEmailFocused] = useState(false);

  const [sendDisabled, setSendDisabled] = useState(false);
  const [sendCountdown, setSendCountdown] = useState(0);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const sendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = (type: 'send' | 'resend') => {
    const setDisabled = type === 'send' ? setSendDisabled : setResendDisabled;
    const setCountdown = type === 'send' ? setSendCountdown : setResendCountdown;
    const intervalRef = type === 'send' ? sendIntervalRef : resendIntervalRef;

    if (intervalRef.current) clearInterval(intervalRef.current);

    setDisabled(true);
    setCountdown(30);
    let seconds = 30;

    intervalRef.current = setInterval(() => {
      seconds -= 1;
      setCountdown(seconds);
      if (seconds <= 0) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setDisabled(false);
        setCountdown(0);
      }
    }, 1000);
  };

  const handleSend = async () => {
    setError('');
    setFieldErrors({});
    if (loading) return;
    if (method === 'phone') {
      if (!/^\+(60|62)[1-9]\d{6,12}$/.test(phone)) {
        setFieldErrors({ phone: phoneError(phone) });
        return;
      }
      setLoading(true);
      try {
        const result = await requestPhonePasswordReset(phone);
        router.push({ pathname: '/verify-phone', params: { purpose: 'password-reset', challenge: result.challenge! } });
      } catch (err) {
        setFieldErrors(serverFieldErrors(err));
        setError(phoneVerificationError(err));
      } finally { setLoading(false); }
      return;
    }
    if (emailError(email)) {
      setFieldErrors({ email: emailError(email) });
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
      // ✅ Start the RESEND countdown immediately on success,
      // so when the success page appears the button is already counting down.
      startCountdown('resend');
    } catch (err: any) {
      setFieldErrors(serverFieldErrors(err));
      setError(passwordResetError(err));
      // Still throttle the send button on failure to prevent spamming.
      startCountdown('send');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendLoading || resendDisabled) return;
    setError('');
    setResendLoading(true);
    try {
      await forgotPassword(email);
    } catch (err: any) {
      setFieldErrors(serverFieldErrors(err));
      setError(passwordResetError(err)); // Countdown still runs.
    } finally {
      setResendLoading(false);
      startCountdown('resend');
    }
  };

  // ── Full-page success screen ──
  if (sent) {
    return (
      <KeyboardForm style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]} contentContainerStyle={[styles.page, { paddingBottom: insets.bottom + 24, paddingLeft: insets.left, paddingRight: insets.right }]} showsVerticalScrollIndicator={false}>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

        <View style={styles.successPage}>

          {/* Top — icon + title + email, vertically centered */}
          <View style={styles.successTop}>
            <View style={[styles.successIconCircle, { backgroundColor: theme.communityBg }]}>
              <Ionicons name="mail-outline" size={48} color={theme.primary} />
            </View>

            <Text style={[styles.successTitle, { color: theme.text }]}>
              E-mel Telah Dihantar!
            </Text>

            <Text style={[styles.successSubtitle, { color: theme.secondary }]}>
              Kami telah menghantar pautan tetapan semula kata laluan ke
            </Text>

            <Text style={[styles.successEmail, { color: theme.primary }]}>
              {email}
            </Text>
          </View>

          {/* Bottom — hint + resend button + back to login */}
          <View style={styles.successBottom}>
            {/* ✅ Hint moved here, directly above the resend button */}
            <Text style={[styles.successHint, { color: theme.secondary }]}>
              Semak peti masuk atau folder spam anda dan ikut pautan untuk menetapkan semula kata laluan.
            </Text>

            <FormError message={error}/>
            <View style={styles.resendWrapper}>
              <AuthButton variant="solid"
                title={
                  resendDisabled
                    ? `Hantar pautan tetapan semula (${resendCountdown}s)`
                    : 'Hantar pautan tetapan semula'
                }
                onPress={handleResend}
                loading={resendLoading}
                disabled={resendDisabled}
              />
            </View>

            <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-lg px-0 py-2"
              style={styles.link}
              onPress={() => router.replace('/(auth)/login')}
            >
              <Ionicons name="arrow-back-outline" size={14} color={theme.primary} />
              <Text style={[styles.linkText, { color: theme.primary }]}>
                Kembali ke log masuk
              </Text>
            </Button>
          </View>

        </View>
      </KeyboardForm>
    );
  }

  // ── Normal form screen ──
  return (
    <KeyboardForm style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]} contentContainerStyle={[styles.page, { paddingBottom: insets.bottom + 24, paddingLeft: insets.left, paddingRight: insets.right }]} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-lg px-0 py-2" style={styles.back} accessibilityLabel="Kembali" onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={theme.text} />
      </Button>

      <View style={styles.inner}>
        <View style={[styles.iconCircle, { backgroundColor: theme.communityBg }]}>
          <Ionicons name="lock-open-outline" size={36} color={theme.primary} />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>
          Lupa Kata Laluan
        </Text>
        <Text style={[styles.subtitle, { color: theme.secondary }]}>
          {method === 'email' ? 'Masukkan e-mel anda untuk menerima pautan tetapan semula kata laluan' : 'Masukkan nombor telefon yang disahkan untuk menerima OTP tetapan semula kata laluan'}
        </Text>

        <View style={styles.formContainer}>
          <Tabs value={method} onValueChange={value => { if (!loading) { setMethod(value as 'email' | 'phone'); setError(''); setFieldErrors({}); } }}>
            <TabsList tabs={['email', 'phone']}>
              <TabsTrigger value="email">E-mel</TabsTrigger>
              <TabsTrigger value="phone">Nombor telefon</TabsTrigger>
            </TabsList>
          </Tabs>
          <Text style={[styles.label, { color: theme.text }]}>
            {method === 'email' ? 'Alamat e-mel' : 'Nombor telefon'}
          </Text>

          {method === 'phone' ? <PhoneNumberInput error={fieldErrors.phone} value={phone} onChangeText={value => { setPhone(value); setError(''); setFieldErrors({}); }} editable={!loading} /> : <FormInput validate={emailError} error={fieldErrors.email}
            style={[
              styles.input,
              {
                borderColor: emailFocused ? theme.primary : theme.border,
                color: theme.text,
                backgroundColor: emailFocused ? theme.communityBg : theme.accent,
              },
            ]}
            placeholder="email@contoh.com"
            placeholderTextColor={theme.secondary}
            value={email}
            onChangeText={(t: string) => { setEmail(t); setError(''); setFieldErrors({}); }}
            accessibilityLabel="Alamat e-mel"
            editable={!loading}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />}

          <FormError message={error}/>

          <View style={styles.buttonWrapper}>
            <AuthButton variant="solid"
              title={
                method === 'phone' ? 'Hantar OTP' : sendDisabled
                  ? `Hantar pautan tetapan semula (${sendCountdown}s)`
                  : 'Hantar pautan tetapan semula'
              }
              onPress={handleSend}
              loading={loading}
              disabled={method === 'email' && sendDisabled}
            />
          </View>
        </View>

        <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-lg px-0 py-2"
          style={styles.link}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Ionicons name="arrow-back-outline" size={14} color={theme.primary} />
          <Text style={[styles.linkText, { color: theme.primary }]}>
            Kembali ke log masuk
          </Text>
        </Button>
      </View>
    </KeyboardForm>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  page: { flexGrow: 1, width: "100%", maxWidth: Design.contentWidth, alignSelf: "center" },
  back: { width: 44, height: 44, marginLeft: 12, marginTop: 8, marginBottom: 12 },

  // ── Form screen ──
  inner: {
    flexGrow: 1,
    flexShrink: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.6,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 2,
  },
  input: {
    width: '100%',
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
  buttonWrapper: {
    marginTop: 4,
    marginBottom: 8,
  },

  // ── Success screen ──
  successPage: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 0,
    gap: 24,
    justifyContent: 'space-between',
  },
  successTop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingVertical: 32,
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.6,
    fontWeight: '800',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  successEmail: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  successHint: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  successBottom: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  resendWrapper: {
    width: '100%',
  },

  // ── Shared ──
  link: {
    minHeight: 44,
    alignSelf: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
