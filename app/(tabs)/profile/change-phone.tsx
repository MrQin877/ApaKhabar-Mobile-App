import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthButton } from '../../../components/auth/AuthButton';
import { PhoneNumberInput } from '../../../components/phone-number-input';
import { getTheme } from '../../../constants/theme';
import { useColorScheme } from '../../../hooks/use-color-scheme';
import api from '../../../services/api';

export default function ChangePhoneScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!phone || !password) {
      setError('Sila isi semua ruangan.');
      return;
    }
    if (!/^\+(60|62)[1-9]\d{6,12}$/.test(phone)) {
      setError('Format nombor telefon tidak sah. Contoh: +60123456789 atau +628123456789.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/change-phone', { phone, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Gagal mengemaskini nombor telefon.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
        <View style={styles.successPage}>
          <View style={styles.successTop}>
            <View style={[styles.successIconCircle, { backgroundColor: '#3FCC5420' }]}>
              <Ionicons name="checkmark-circle" size={56} color="#3FCC54" />
            </View>
            <Text style={[styles.successTitle, { color: theme.text }]}>Nombor Telefon Dikemaskini!</Text>
            <Text style={[styles.successSubtitle, { color: theme.secondary }]}>
              Nombor telefon akaun anda telah dikemaskini kepada
            </Text>
            <Text style={[styles.successPhone, { color: '#3FCC54' }]}>{phone}</Text>
          </View>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={14} color="#3FCC54" />
            <Text style={[styles.backBtnText, { color: '#3FCC54' }]}>Kembali ke Profil</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={theme.text} />
      </TouchableOpacity>

      <View style={styles.inner}>
        <View style={[styles.iconCircle, { backgroundColor: '#3FCC5420' }]}>
          <Ionicons name="call-outline" size={36} color="#3FCC54" />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Nombor Telefon</Text>
        <Text style={[styles.subtitle, { color: theme.secondary }]}>
          Daftarkan atau kemaskini nombor telefon anda. Kata laluan semasa diperlukan untuk mengesahkan.
        </Text>

        <View style={styles.formContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Nombor Telefon</Text>
          <PhoneNumberInput
            value={phone}
            onChangeText={(t) => { setPhone(t); setError(''); }}
            editable={!loading}
          />

          <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>Kata Laluan Semasa</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={[styles.passwordInput, { borderColor: error ? theme.error : theme.border, color: theme.text, backgroundColor: theme.background }]}
              placeholder="••••••••"
              placeholderTextColor={theme.secondary}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.secondary} />
            </TouchableOpacity>
          </View>

          {error ? <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text> : null}

          <View style={styles.buttonWrapper}>
            <AuthButton title="Simpan Nombor Telefon" onPress={handleSubmit} loading={loading} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  back: { padding: 16 },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 8, alignItems: 'center' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  formContainer: { width: '100%' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 2 },
  passwordWrapper: { position: 'relative', width: '100%' },
  passwordInput: { width: '100%', height: 52, borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingRight: 48, fontSize: 15 },
  eyeBtn: { position: 'absolute', right: 14, top: 16 },
  errorText: { fontSize: 12, marginTop: 4, marginLeft: 2 },
  buttonWrapper: { marginTop: 24, marginBottom: 8 },
  successPage: { flex: 1, paddingHorizontal: 24, paddingBottom: 40, justifyContent: 'space-between' },
  successTop: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  successIconCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  successTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  successSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  successPhone: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  backBtnText: { fontSize: 14, fontWeight: '600' },
});
