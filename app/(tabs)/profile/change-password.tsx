import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthButton } from '../../../components/auth/AuthButton';
import { getTheme } from '../../../constants/theme';
import { useColorScheme } from '../../../hooks/use-color-scheme';
import api from '../../../services/api';

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Sila isi semua ruangan.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Kata laluan baharu mestilah sekurang-kurangnya 8 aksara.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Kata laluan baharu tidak sepadan.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('Kata laluan baharu mestilah berbeza daripada kata laluan semasa.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/change-password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Gagal menukar kata laluan.');
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
              <Ionicons name="shield-checkmark" size={56} color="#3FCC54" />
            </View>
            <Text style={[styles.successTitle, { color: theme.text }]}>Kata Laluan Berjaya Ditukar!</Text>
            <Text style={[styles.successSubtitle, { color: theme.secondary }]}>
              Kata laluan akaun anda telah berjaya dikemaskini. Sila gunakan kata laluan baharu semasa log masuk.
            </Text>
          </View>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={14} color="#3FCC54" />
            <Text style={[styles.backBtnText, { color: '#3FCC54' }]}>Kembali ke Profil</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const PasswordField = ({
    label, value, onChange, show, onToggle, placeholder,
  }: {
    label: string;
    value: string;
    onChange: (t: string) => void;
    show: boolean;
    onToggle: () => void;
    placeholder?: string;
  }) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View style={styles.passwordWrapper}>
        <TextInput
          style={[styles.passwordInput, { borderColor: error ? theme.error : theme.border, color: theme.text, backgroundColor: theme.background }]}
          placeholder={placeholder ?? '••••••••'}
          placeholderTextColor={theme.secondary}
          value={value}
          onChangeText={(t) => { onChange(t); setError(''); }}
          secureTextEntry={!show}
        />
        <TouchableOpacity style={styles.eyeBtn} onPress={onToggle}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={theme.text} />
      </TouchableOpacity>

      <View style={styles.inner}>
        <View style={[styles.iconCircle, { backgroundColor: '#3FCC5420' }]}>
          <Ionicons name="lock-closed-outline" size={36} color="#3FCC54" />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Tukar Kata Laluan</Text>
        <Text style={[styles.subtitle, { color: theme.secondary }]}>
          Masukkan kata laluan semasa anda dan pilih kata laluan baharu yang kuat.
        </Text>

        <View style={styles.formContainer}>
          <PasswordField
            label="Kata Laluan Semasa"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggle={() => setShowCurrent(!showCurrent)}
          />
          <PasswordField
            label="Kata Laluan Baharu"
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggle={() => setShowNew(!showNew)}
          />
          <PasswordField
            label="Sahkan Kata Laluan Baharu"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirm}
            onToggle={() => setShowConfirm(!showConfirm)}
          />

          {/* Password strength hint */}
          <Text style={[styles.hint, { color: theme.secondary }]}>
            Kata laluan mestilah sekurang-kurangnya 8 aksara.
          </Text>

          {error ? <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text> : null}

          <View style={styles.buttonWrapper}>
            <AuthButton title="Kemaskini Kata Laluan" onPress={handleSubmit} loading={loading} />
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
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 2 },
  passwordWrapper: { position: 'relative', width: '100%' },
  passwordInput: { width: '100%', height: 52, borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingRight: 48, fontSize: 15 },
  eyeBtn: { position: 'absolute', right: 14, top: 16 },
  hint: { fontSize: 12, marginTop: 4, marginLeft: 2, marginBottom: 4 },
  errorText: { fontSize: 12, marginTop: 4, marginLeft: 2 },
  buttonWrapper: { marginTop: 8, marginBottom: 8 },
  successPage: { flex: 1, paddingHorizontal: 24, paddingBottom: 40, justifyContent: 'space-between' },
  successTop: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  successIconCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  successTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  successSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  backBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  backBtnText: { fontSize: 14, fontWeight: '600' },
});