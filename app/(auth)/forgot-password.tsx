import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthButton } from '../../components/auth/AuthButton';
import { forgotPassword } from '../../services/authService';
import { getTheme } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

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
    if (!email) {
      setError('Sila masukkan e-mel anda.');
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
      setError(err?.response?.data?.message ?? 'E-mel tidak dijumpai.');
      // Still throttle the send button on failure to prevent spamming.
      startCountdown('send');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await forgotPassword(email);
    } catch (err: any) {
      // silently fail — countdown still runs
    } finally {
      setResendLoading(false);
      startCountdown('resend');
    }
  };

  // ── Full-page success screen ──
  if (sent) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

        <View style={styles.successPage}>

          {/* Top — icon + title + email, vertically centered */}
          <View style={styles.successTop}>
            <View style={[styles.successIconCircle, { backgroundColor: '#3FCC5420' }]}>
              <Ionicons name="mail-outline" size={48} color="#3FCC54" />
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

            <View style={styles.resendWrapper}>
              <AuthButton
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

            <TouchableOpacity
              style={styles.link}
              onPress={() => router.replace('/(auth)/login')}
            >
              <Ionicons name="arrow-back-outline" size={14} color={theme.primary} />
              <Text style={[styles.linkText, { color: theme.primary }]}>
                Kembali ke log masuk
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    );
  }

  // ── Normal form screen ──
  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={theme.text} />
      </TouchableOpacity>

      <View style={styles.inner}>
        <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
          <Ionicons name="lock-open-outline" size={36} color={theme.primary} />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>
          Lupa Kata Laluan
        </Text>
        <Text style={[styles.subtitle, { color: theme.secondary }]}>
          Masukkan e-mel anda untuk menerima pautan tetapan semula kata laluan
        </Text>

        <View style={styles.formContainer}>
          <Text style={[styles.label, { color: theme.text }]}>
            Alamat e-mel
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                borderColor: error ? theme.error : theme.border,
                color: theme.text,
                backgroundColor: theme.background,
              },
            ]}
            placeholder="email@contoh.com"
            placeholderTextColor={theme.secondary}
            value={email}
            onChangeText={(t: string) => { setEmail(t); setError(''); }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          {error ? (
            <Text style={[styles.errorText, { color: theme.error }]}>
              {error}
            </Text>
          ) : null}

          <View style={styles.buttonWrapper}>
            <AuthButton
              title={
                sendDisabled
                  ? `Kirim pautan untuk perubahan kata laluan (${sendCountdown}s)`
                  : 'Kirim pautan untuk perubahan kata laluan'
              }
              onPress={handleSend}
              loading={loading}
              disabled={sendDisabled}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.link}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Ionicons name="arrow-back-outline" size={14} color={theme.primary} />
          <Text style={[styles.linkText, { color: theme.primary }]}>
            Kembali ke log masuk
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  back: { padding: 16 },

  // ── Form screen ──
  inner: {
    flex: 1,
    paddingHorizontal: 24,
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
    fontSize: 22,
    fontWeight: '700',
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
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 2,
  },
  input: {
    width: '100%',
    height: 52,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
  buttonWrapper: {
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 4,
  },

  // ── Success screen ──
  successPage: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  successTop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
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
    fontSize: 24,
    fontWeight: '700',
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
    paddingHorizontal: 4,
  },

  // ── Shared ──
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});