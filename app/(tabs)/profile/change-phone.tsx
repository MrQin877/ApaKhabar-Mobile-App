import { phoneError, serverFieldErrors } from "@/utils/formValidation";
import { FormError } from "@/components/ui/FormError";
import { KeyboardForm } from '../../../components/KeyboardForm';
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthButton } from '../../../components/auth/AuthButton';
import { PhoneNumberInput } from '../../../components/phone-number-input';
import { getTheme } from '../../../constants/theme';
import { useColorScheme } from '../../../hooks/use-color-scheme';
import { requestPhoneChangeOtp, phoneVerificationError } from '../../../services/phoneVerification';

export default function ChangePhoneScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    if (pending.current) return;
    setError('');
    setFieldErrors({});
    if (!phone) {
      setFieldErrors({ phone: phoneError(phone) });
      return;
    }
    if (!/^\+(60|62)[1-9]\d{6,12}$/.test(phone)) {
      setFieldErrors({ phone: phoneError(phone) });
      return;
    }
    pending.current = true;
    setLoading(true);
    try {
      const result = await requestPhoneChangeOtp(phone);
      router.push({ pathname: '/verify-phone', params: { challenge: result.challenge } } as Href);
    } catch (err: any) {
      setFieldErrors(serverFieldErrors(err));
      setError(phoneVerificationError(err));
    } finally {
      pending.current = false;
      setLoading(false);
    }
  };

  return (
    <KeyboardForm style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      <TouchableOpacity style={styles.back} disabled={loading} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={theme.text} />
      </TouchableOpacity>

      <View style={styles.inner}>
        <View style={[styles.iconCircle, { backgroundColor: '#3FCC5420' }]}>
          <Ionicons name="call-outline" size={36} color="#3FCC54" />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Ganti Nomor Baru</Text>
        <Text style={[styles.subtitle, { color: theme.secondary }]}>
          Masukkan nomor baru untuk menerima OTP. Nomor lama tetap digunakan sampai nomor baru berhasil diverifikasi.
        </Text>

        <View style={styles.formContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Nomor Telepon Baru</Text>
          <PhoneNumberInput error={fieldErrors.phone}
            value={phone}
            onChangeText={(t) => { setPhone(t); setError(''); setFieldErrors({}); }}
            editable={!loading}
          />

          <FormError message={error}/>

          <View style={styles.buttonWrapper}>
            <AuthButton title="Verifikasi Nomor Telepon" onPress={handleSubmit} loading={loading} />
          </View>
        </View>
      </View>
    </KeyboardForm>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  back: { padding: 16 },
  inner: { flexGrow: 1, flexShrink: 0, paddingHorizontal: 24, paddingTop: 8, alignItems: 'center' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  formContainer: { width: '100%' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 2 },
  errorText: { fontSize: 12, marginTop: 4, marginLeft: 2 },
  buttonWrapper: { marginTop: 24, marginBottom: 8 },
});
