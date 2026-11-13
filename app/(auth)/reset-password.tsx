import { Button } from "heroui-native/button";
import { passwordError, confirmationError, serverFieldErrors } from "@/utils/formValidation";
import { FormError } from "@/components/ui/FormError";
import { resetPhonePassword } from '../../services/phonePasswordReset';
import { KeyboardForm } from '../../components/KeyboardForm';
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import { passwordResetError, resetParameters } from '@/utils/passwordReset';
import {
  StatusBar,
  StyleSheet,
  Text,

  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthButton } from "../../components/auth/AuthButton";
import { PasswordInput } from "../../components/auth/PasswordInput";
import { Design, getTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { resetPassword } from "../../services/authService";

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  const { token, email, phone, challenge, valid } = resetParameters(useLocalSearchParams());
  const submitting = useRef(false);
  const linkError = valid ? '' : 'Pautan tidak sah atau telah tamat tempoh. Sila minta pautan baharu.';

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [focused, setFocused] = useState<"password" | "confirmation" | null>(null);

  const handleReset = async () => {
    if (submitting.current) return;
    setError("");
    if (!valid) { setError(linkError); return; }
    setFieldErrors({ password: passwordError(password), password_confirmation: confirmationError(password)(confirm) });
    if (!password || password.length < 8) {
      return;
    }
    if (password !== confirm) {
      return;
    }
    if (!token || (challenge ? !phone : !email)) {
      setError("Pautan tidak sah atau telah tamat tempoh.");
      return;
    }

    submitting.current = true;
    setLoading(true);
    try {
      if (challenge) await resetPhonePassword(challenge, token, password, confirm);
      else await resetPassword(token, email!, password, confirm);
      router.replace({
        pathname: "/(auth)/login",
        params: {
          successMessage: "Kata sandi berjaya ditukar. Sila log masuk.",
        },
      });
    } catch (err: any) {
      setFieldErrors(serverFieldErrors(err));
      setError(passwordResetError(err));
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  return (
    <KeyboardForm
      style={[
        styles.container,
        { backgroundColor: theme.background, paddingTop: insets.top },
      ]}
      contentContainerStyle={[styles.page, { paddingBottom: insets.bottom + 24, paddingLeft: insets.left, paddingRight: insets.right }]}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />

      {/* Back button — same as forgot-password */}
      <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-lg px-0 py-2" style={styles.back} accessibilityLabel="Kembali" onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/login')}>
        <Ionicons name="arrow-back" size={22} color={theme.text} />
      </Button>

      <View style={styles.inner}>
        {/* Icon */}
        <View
          style={[styles.iconCircle, { backgroundColor: theme.communityBg }]}
        >
          <Ionicons name="key-outline" size={36} color={theme.primary} />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>
          {challenge ? 'Tetapkan Semula Kata Laluan' : 'Tetapkan Kata Sandi'}
        </Text>
        <Text style={[styles.subtitle, { color: theme.secondary }]}>
          {"Masukkan kata sandi baharu untuk "}
          <Text style={{ fontWeight: "700", color: theme.text }}>
            {phone ?? email ?? "-"}
          </Text>
        </Text>

        {done ? (
          // ── Success state ──
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={48} color={theme.primary} />
            <Text style={[styles.successText, { color: theme.text }]}>
              Kata sandi berjaya ditukar!
            </Text>
          </View>
        ) : (
          // ── Form state ──
          <View style={styles.formContainer}>
            {/* Kata sandi baharu */}
            <Text style={[styles.label, { color: theme.text }]}>
              Kata Sandi Baharu
            </Text>
            <PasswordInput
              validate={passwordError} error={fieldErrors.password} accessibilityLabel="Kata Sandi Baharu"
              style={[
                styles.input,
                {
                  borderColor: focused === "password" ? theme.primary : theme.border,
                  color: theme.text,
                  backgroundColor: focused === "password" ? theme.communityBg : theme.accent,
                },
              ]}
              placeholder="Masukkan kata sandi baharu"
              placeholderTextColor={theme.secondary}
              value={password}
              onChangeText={(t: string) => {
                setPassword(t);
                setError(""); setFieldErrors({});
              }}
              editable={!loading}
              autoComplete="new-password"
              textContentType="newPassword"
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(current => current === "password" ? null : current)}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Sahkan kata sandi */}
            <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>
              Sahkan Kata Sandi
            </Text>
            <PasswordInput
              validate={confirmationError(password)} error={fieldErrors.password_confirmation} accessibilityLabel="Sahkan Kata Sandi"
              style={[
                styles.input,
                {
                  borderColor: focused === "confirmation" ? theme.primary : theme.border,
                  color: theme.text,
                  backgroundColor: focused === "confirmation" ? theme.communityBg : theme.accent,
                },
              ]}
              placeholder="Ulangi kata sandi baharu"
              placeholderTextColor={theme.secondary}
              value={confirm}
              onChangeText={(t: string) => {
                setConfirm(t);
                setError(""); setFieldErrors({});
              }}
              editable={!loading}
              autoComplete="new-password"
              textContentType="newPassword"
              onFocus={() => setFocused("confirmation")}
              onBlur={() => setFocused(current => current === "confirmation" ? null : current)}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={[styles.helper, { backgroundColor: theme.communityBg }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.primary} accessible={false}/>
              <Text style={[styles.helperText, { color: theme.primary }]}>Minimum 8 aksara untuk kata laluan baharu.</Text>
            </View>

            {/* Error message */}
            <FormError message={error || linkError}/>

            {/* Button */}
            <View style={styles.buttonWrapper}>
              <AuthButton variant="solid"
                title="Tetapkan Kata Sandi"
                onPress={handleReset}
                loading={loading}
                disabled={!valid}
              />
            </View>
          </View>
        )}

        {/* Back to login */}
        {!!linkError && <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-lg px-0 py-2" style={styles.link} onPress={() => router.replace('/(auth)/forgot-password')}><Text style={[styles.linkText, { color: theme.primary }]}>Minta pautan baharu</Text></Button>}
        {!done && (
          <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-lg px-0 py-2"
            style={styles.link}
            onPress={() => router.replace("/(auth)/login")}
          >
            <Ionicons
              name="arrow-back-outline"
              size={14}
              color={theme.primary}
            />
            <Text style={[styles.linkText, { color: theme.primary }]}>
              Kembali ke log masuk
            </Text>
          </Button>
        )}

        {/* After success — go to login */}
        {done && (
          <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-lg px-0 py-2"
            style={styles.link}
            onPress={() => router.replace("/(auth)/login")}
          >
            <Ionicons name="log-in-outline" size={14} color={theme.primary} />
            <Text style={[styles.linkText, { color: theme.primary }]}>
              Log masuk sekarang
            </Text>
          </Button>
        )}
      </View>
    </KeyboardForm>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  page: { flexGrow: 1, width: "100%", maxWidth: Design.contentWidth, alignSelf: "center" },
  back: { width: 44, height: 44, marginLeft: 12, marginTop: 8, marginBottom: 12 },
  inner: {
    flexGrow: 1,
    flexShrink: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
    alignItems: "center",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.6,
    fontWeight: "800",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  formContainer: {
    width: "100%",
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 2,
  },
  input: {
    width: "100%",
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  helper: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, marginTop: 16, marginBottom: 12 },
  helperText: { flex: 1, fontSize: 12, lineHeight: 18 },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
  buttonWrapper: {
    marginTop: 4,
    marginBottom: 8,
  },
  successBox: {
    alignItems: "center",
    gap: 16,
    marginTop: 16,
  },
  successText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  link: {
    minHeight: 44,
    alignSelf: "center",
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 28,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
