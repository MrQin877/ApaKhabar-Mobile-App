import { FormInput } from "@/components/ui/FormInput";
import { emailError, serverFieldErrors } from "@/utils/formValidation";
import { FormError } from "@/components/ui/FormError";
import { KeyboardForm } from '../../../components/KeyboardForm';
import { useRef, useState } from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthButton } from '../../../components/auth/AuthButton';
import { ApprovedBadge } from '../../../components/profile/ApprovedBadge';
import { useVerifiedProfile } from '../../../hooks/useVerifiedProfile';
import { updateProfile } from '../../../services/authService';
import { resendVerification, verificationError } from '../../../services/emailVerification';
import { getTheme } from '../../../constants/theme';
import { useColorScheme } from '../../../hooks/use-color-scheme';

export default function ChangeEmailScreen() {
  const insets = useSafeAreaInsets();
  const theme = getTheme(useColorScheme());
  const { user, loading, confirmed, error, refresh } = useVerifiedProfile();
  const [draft, setDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const pending = useRef(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const email = draft ?? user?.email ?? '';
  const dirty = email !== (user?.email ?? '');
  const approved = confirmed && !dirty && !!user?.email && !!user.email_verified_at;

  async function save() {
    if (pending.current || !user) return;
    const invalid = emailError(email);
    if (invalid) { setFieldErrors({ email: invalid }); return; }
    pending.current = true;
    setBusy(true);
    setMessage('');
    setActionError('');
    try {
      await updateProfile(user.name, email.trim());
      setDraft(null);
      await refresh();
      setMessage('Alamat e-mail disimpan. Anda sekarang boleh mengirim email konfirmasi.');
    } catch (err) {
      setFieldErrors(serverFieldErrors(err));
      setActionError(verificationError(err));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  async function resend() {
    if (pending.current || dirty) return;
    pending.current = true;
    setBusy(true);
    setActionError('');
    try {
      await resendVerification();
      router.push('/verify-email' as Href);
    } catch (err) {
      setFieldErrors(serverFieldErrors(err));
      setActionError(verificationError(err));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <KeyboardForm style={{ backgroundColor: theme.background }} contentContainerStyle={[styles.page, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
      <Text style={[styles.title, { color: theme.text }]}>Alamat e-mail</Text>
      <Text style={{ color: theme.text }}>Simpan perubahan sebelum mengirim email konfirmasi.</Text>
      {loading && <ActivityIndicator color="#16803d" />}
      <FormInput validate={emailError} error={fieldErrors.email} accessibilityLabel="Alamat e-mail" value={email} onChangeText={value => { setDraft(value); setFieldErrors({}); setActionError(""); }} editable={!!user && !busy && !loading} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="email@contoh.com" placeholderTextColor={theme.secondary} style={[styles.input, { borderColor: theme.border, color: theme.text }]} />
      {approved && <ApprovedBadge />}
      <FormError message={actionError || error}/>
      {!!message && <Text accessibilityLiveRegion="polite" style={{ color: theme.text }}>{message}</Text>}
      {dirty && <Text style={{ color: theme.text }}>Perubahan belum disimpan.</Text>}
      <View>
        <AuthButton title="Simpan" onPress={save} loading={busy} disabled={loading || !confirmed || !dirty || !email.trim()} />
        {confirmed && !loading && user?.email && user.email_verified_at === null && <AuthButton title="Klik di sini untuk mengirim ulang email konfirmasi." onPress={resend} disabled={busy || loading || dirty || !confirmed} />}
        {!!error && <AuthButton title="Coba lagi" onPress={() => { void refresh(); }} disabled={busy || loading} />}
        <AuthButton title="Kembali ke Profil" onPress={() => router.replace('/(tabs)/profile')} disabled={busy} />
      </View>
    </KeyboardForm>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, paddingHorizontal: 24, gap: 16 },
  title: { fontSize: 26, fontWeight: '700' },
  input: { height: 52, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 16 },
});
