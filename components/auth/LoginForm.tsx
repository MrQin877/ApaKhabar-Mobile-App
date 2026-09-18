import { KeyboardForm } from '../KeyboardForm';
import { router } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { useAuth } from "../../hooks/useAuth";
import { Checkbox } from "../ui/checkbox";
import { AuthButton } from "./AuthButton";
import { AuthInput } from "./AuthInput";

export function LoginForm({
  initialStatus,
}: {
  initialStatus?: string | null;
}) {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    errors,
    login,
    clearErrors,
  } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);
  const [status] = useState<string | null>(initialStatus ?? null);

  const handleLogin = () => {
    clearErrors();
    login();
  };

  return (
    <KeyboardForm style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          Log masuk ke akun anda
        </Text>
        <Text style={[styles.description, { color: theme.secondary }]}>
          Masukkan e-mail dan kata sandi anda untuk log masuk
        </Text>
      </View>

      {/* Status Message */}
      {status && (
        <View
          style={[
            styles.statusContainer,
            { backgroundColor: theme.primary + "20" },
          ]}
        >
          <Text style={[styles.statusText, { color: theme.primary }]}>
            {status}
          </Text>
        </View>
      )}

      {/* Form Fields */}
      <View style={styles.formContainer}>
        {/* Email/Phone Field */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.text }]}>
            Alamat e-mail atau nombor telefon
          </Text>
          <AuthInput
            placeholder="email@contoh.com atau +60123456789"
            value={email}
            onChangeText={(text: string) => {
              setEmail(text);
              clearErrors();
            }}
            error={errors.email}
          />
          {errors.email && (
            <Text style={[styles.fieldError, { color: theme.error }]}>
              {errors.email}
            </Text>
          )}
        </View>

        {/* Password Field */}
        <View style={styles.fieldGroup}>
          <View style={styles.passwordLabelRow}>
            <Text style={[styles.label, { color: theme.text }]}>
              Kata sandi
            </Text>
            <TouchableOpacity
              disabled={loading}
              onPress={() => router.navigate("/(auth)/forgot-password")}
            >
              <Text style={[styles.forgotLink, { color: theme.primary }]}>
                Lupa kata sandi?
              </Text>
            </TouchableOpacity>
          </View>
          <AuthInput
            placeholder="Kata sandi"
            value={password}
            onChangeText={(text: string) => {
              setPassword(text);
              clearErrors();
            }}
            secureTextEntry
            error={errors.password}
          />
          {errors.password && (
            <Text style={[styles.fieldError, { color: theme.error }]}>
              {errors.password}
            </Text>
          )}
        </View>

        {/* Remember Me Checkbox */}
        <Checkbox
          value={rememberMe}
          onValueChange={setRememberMe}
          label="Ingat saya"
        />

        {/* General Error */}
        {errors.general && (
          <Text style={[styles.generalError, { color: theme.error }]}>
            {errors.general}
          </Text>
        )}

        {/* Login Button */}
        <AuthButton title="Log masuk" onPress={handleLogin} loading={loading} />
      </View>

      {/* Register Link */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.secondary }]}>
          Belum ada akun?{" "}
        </Text>
        <TouchableOpacity disabled={loading} onPress={() => router.replace("/(auth)/register")}>
          <Text style={[styles.registerLink, { color: theme.primary }]}>
            Daftar sekarang
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardForm>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "flex-start",
    paddingTop: 32,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
  },
  statusContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "500",
  },
  formContainer: {
    gap: 24,
    marginBottom: 32,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  passwordLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: "500",
  },
  fieldError: {
    fontSize: 12,
    fontWeight: "500",
  },
  generalError: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: "600",
  },
});
