import { passwordError, confirmationError, requiredError, serverFieldErrors } from "@/utils/formValidation";
import { FormError } from "@/components/ui/FormError";
import { KeyboardForm } from '../../../components/KeyboardForm';
import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PasswordInput } from '../../../components/auth/PasswordInput';
import { Button } from 'heroui-native/button';
import { AuthButton } from '../../../components/auth/AuthButton';
import { Design, getTheme } from '../../../constants/theme';
import { useColorScheme } from '../../../hooks/use-color-scheme';
import api from '../../../services/api';

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const pending = useRef(false);
  const goBack = () => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile');
  const pageBackground = colorScheme === 'dark' ? theme.background : theme.accent;

  const handleSubmit = async () => {
    if (pending.current) return;
    setError('');
    setFieldErrors({
      current_password: requiredError(currentPassword),
      password: passwordError(newPassword) || (newPassword === currentPassword ? "Pilih kata laluan baharu yang berbeza." : ""),
      password_confirmation: confirmationError(newPassword)(confirmPassword),
    });
    if (!currentPassword || !newPassword || !confirmPassword) {
      return;
    }
    if (newPassword.length < 8) {
      return;
    }
    if (newPassword !== confirmPassword) {
      return;
    }
    if (newPassword === currentPassword) {
      return;
    }
    pending.current = true;
    setLoading(true);
    try {
      await api.post('/api/change-password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      setFieldErrors(serverFieldErrors(err));
      setError(err?.response?.data?.message ?? 'Gagal menukar kata laluan.');
    } finally {
      pending.current = false;
      setLoading(false);
    }
  };

  const pageStyle = [styles.page, {
    paddingTop: insets.top + 16,
    paddingBottom: Math.max(24, insets.bottom),
    paddingLeft: Math.max(20, insets.left),
    paddingRight: Math.max(20, insets.right),
  }];

  if (success) {
    return <KeyboardForm style={{ backgroundColor: pageBackground }} contentContainerStyle={pageStyle}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}/>
      <View style={styles.successPage}>
        <View style={[styles.successIcon, { backgroundColor: theme.communityBg }]}>
          <Ionicons name="shield-checkmark-outline" size={44} color={theme.primary}/>
        </View>
        <Text accessibilityRole="header" style={[styles.successTitle, { color: theme.text }]}>Kata Laluan Berjaya Ditukar!</Text>
        <Text style={[styles.successBody, { color: theme.secondary }]}>Kata laluan akaun anda telah berjaya dikemaskini. Sila gunakan kata laluan baharu semasa log masuk.</Text>
        <Button variant="ghost" className="h-auto min-w-0 rounded-xl px-4 py-3" onPress={goBack} style={{ minHeight: 48 }}>
          <Ionicons name="arrow-back" size={18} color={theme.primary}/>
          <Text style={[styles.link, { color: theme.primary }]}>Kembali ke Profil</Text>
        </Button>
      </View>
    </KeyboardForm>;
  }

  const renderPasswordField = (key: 'current_password' | 'password' | 'password_confirmation', label: string, value: string, onChange: (text: string) => void) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <PasswordInput
        error={fieldErrors[key]}
        validate={key === 'current_password' ? requiredError : key === 'password' ? value => passwordError(value) || (value === currentPassword ? 'Pilih kata laluan baharu yang berbeza.' : '') : confirmationError(newPassword)}
        accessibilityLabel={label}
        style={[styles.passwordInput, {
          borderColor: focused === key ? theme.primary : theme.border,
          color: theme.text, backgroundColor: theme.card,
        }]}
        placeholder={'\u2022'.repeat(8)}
        placeholderTextColor={theme.secondary}
        value={value}
        editable={!loading}
        autoComplete={key === 'current_password' ? 'current-password' : 'new-password'}
        textContentType={key === 'current_password' ? 'password' : 'newPassword'}
        returnKeyType={key === 'password_confirmation' ? 'done' : 'next'}
        onSubmitEditing={key === 'password_confirmation' ? () => { void handleSubmit(); } : undefined}
        onFocus={() => setFocused(key)}
        onBlur={() => setFocused(current => current === key ? null : current)}
        onChangeText={text => { onChange(text); setError(''); setFieldErrors({}); }}
      />
    </View>
  );

  return <KeyboardForm style={{ backgroundColor: pageBackground }} contentContainerStyle={pageStyle} showsVerticalScrollIndicator={false}>
    <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}/>
    <View style={styles.heading}>
      <Button variant="ghost" className="min-h-0 min-w-0 rounded-full p-0" accessibilityLabel="Kembali ke Profil" isDisabled={loading} onPress={goBack} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={theme.text}/>
      </Button>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>Ubah kata laluan</Text>
    </View>
    <Text style={[styles.subtitle, { color: theme.secondary }]}>Gunakan kata laluan unik yang belum pernah digunakan.</Text>
    <View style={styles.form}>
      {renderPasswordField('current_password', 'Kata laluan semasa', currentPassword, setCurrentPassword)}
      {renderPasswordField('password', 'Kata laluan baharu', newPassword, setNewPassword)}
      {renderPasswordField('password_confirmation', 'Ulang kata laluan', confirmPassword, setConfirmPassword)}
      <View style={[styles.helper, { backgroundColor: theme.communityBg }]}>
        <Ionicons name="shield-checkmark-outline" size={18} color={theme.primary} accessible={false}/>
        <Text style={[styles.helperText, { color: theme.primary }]}>Minimum 8 aksara. Pilih kata laluan berbeza daripada yang semasa.</Text>
      </View>
      <FormError message={error}/>
      <AuthButton variant="solid" title="Kemas kini kata laluan" onPress={handleSubmit} loading={loading}/>
    </View>
  </KeyboardForm>;
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, width: '100%', maxWidth: Design.contentWidth, alignSelf: 'center' },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  back: { width: 32, height: 44, marginLeft: -8 },
  title: { flexShrink: 1, fontSize: 28, lineHeight: 36, fontWeight: '800', letterSpacing: -0.6 },
  subtitle: { fontSize: 13, lineHeight: 20, marginTop: 4, marginBottom: 20 },
  form: { width: '100%' },
  fieldGroup: { marginBottom: 16, gap: 8 },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  passwordInput: { width: '100%', height: 52, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 15 },
  helper: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 4 },
  helperText: { flex: 1, fontSize: 12, lineHeight: 18 },
  successPage: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  successIcon: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 24, lineHeight: 30, fontWeight: '700', textAlign: 'center' },
  successBody: { fontSize: 14, lineHeight: 22, textAlign: 'center', maxWidth: 360 },
  link: { fontSize: 14, fontWeight: '600' },
});
