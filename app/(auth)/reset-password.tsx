import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthButton } from "../../components/auth/AuthButton";
import { getTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { resetPassword } from "../../services/authService";

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  const { token, email } = useLocalSearchParams<{
    token: string;
    email: string;
  }>();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    setError("");
    if (!password || password.length < 8) {
      setError("Kata sandi mestilah sekurang-kurangnya 8 aksara.");
      return;
    }
    if (password !== confirm) {
      setError("Kata sandi tidak sepadan.");
      return;
    }
    if (!token || !email) {
      setError("Pautan tidak sah atau telah tamat tempoh.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, email, password, confirm);
      setDone(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Token tidak sah atau telah tamat tempoh.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background, paddingTop: insets.top },
      ]}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />

      {/* Back button — same as forgot-password */}
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={theme.text} />
      </TouchableOpacity>

      <View style={styles.inner}>
        {/* Icon */}
        <View
          style={[styles.iconCircle, { backgroundColor: theme.primary + "20" }]}
        >
          <Ionicons name="key-outline" size={36} color={theme.primary} />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>
          Tetapkan Kata Sandi
        </Text>
        <Text style={[styles.subtitle, { color: theme.secondary }]}>
          {"Masukkan kata sandi baharu untuk "}
          <Text style={{ fontWeight: "700", color: theme.text }}>
            {email ?? "-"}
          </Text>
        </Text>

        {done ? (
          // ── Success state ──
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={48} color="#3FCC54" />
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
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: error ? theme.error : theme.border,
                  color: theme.text,
                  backgroundColor: theme.background,
                },
              ]}
              placeholder="Masukkan kata sandi baharu"
              placeholderTextColor={theme.secondary}
              value={password}
              onChangeText={(t: string) => {
                setPassword(t);
                setError("");
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Sahkan kata sandi */}
            <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>
              Sahkan Kata Sandi
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
              placeholder="Ulangi kata sandi baharu"
              placeholderTextColor={theme.secondary}
              value={confirm}
              onChangeText={(t: string) => {
                setConfirm(t);
                setError("");
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Error message */}
            {error ? (
              <Text style={[styles.errorText, { color: theme.error }]}>
                {error}
              </Text>
            ) : null}

            {/* Button */}
            <View style={styles.buttonWrapper}>
              <AuthButton
                title="Tetapkan Kata Sandi"
                onPress={handleReset}
                loading={loading}
              />
            </View>
          </View>
        )}

        {/* Back to login */}
        {!done && (
          <TouchableOpacity
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
          </TouchableOpacity>
        )}

        {/* After success — go to login */}
        {done && (
          <TouchableOpacity
            style={styles.link}
            onPress={() => router.replace("/(auth)/login")}
          >
            <Ionicons name="log-in-outline" size={14} color={theme.primary} />
            <Text style={[styles.linkText, { color: theme.primary }]}>
              Log masuk sekarang
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  back: { padding: 16 },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
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
    fontSize: 22,
    fontWeight: "700",
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
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 2,
  },
  input: {
    width: "100%",
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
