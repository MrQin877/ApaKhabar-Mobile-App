// ── Login form component for the login screen ──
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AUTH_STRINGS } from "../../constants/authData";
import { getTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { useAuth } from "../../hooks/useAuth";
import { AuthButton } from "./AuthButton";
import { AuthInput } from "./AuthInput";

export function LoginForm() {
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

  const handleLogin = () => {
    clearErrors();
    login();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        {AUTH_STRINGS.loginTitle}
      </Text>

      <AuthInput
        placeholder={AUTH_STRINGS.emailPlaceholder}
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          clearErrors();
        }}
        error={errors.email}
      />

      <AuthInput
        placeholder={AUTH_STRINGS.passwordPlaceholder}
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          clearErrors();
        }}
        secureTextEntry
        error={errors.password}
      />

      {errors.general && (
        <Text style={[styles.error, { color: theme.error }]}>
          {errors.general}
        </Text>
      )}

      <AuthButton
        title={AUTH_STRINGS.loginButton}
        onPress={handleLogin}
        loading={loading}
      />

      <TouchableOpacity style={styles.link}>
        <Text style={[styles.linkText, { color: theme.primary }]}>
          {AUTH_STRINGS.forgotPassword}
        </Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.secondary }]}>
          {AUTH_STRINGS.noAccount}{" "}
        </Text>
        <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
          <Text style={[styles.linkText, { color: theme.primary }]}>
            {AUTH_STRINGS.signUp}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 32,
  },
  error: {
    textAlign: "center",
    marginBottom: 16,
    fontSize: 14,
  },
  link: {
    alignSelf: "center",
    marginTop: 16,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
});
