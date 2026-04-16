import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AUTH_STRINGS } from "../../constants/authData";
import { getTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { useAuth } from "../../hooks/useAuth";
import { AuthButton } from "./AuthButton";
import { AuthInput } from "./AuthInput";

export function RegisterForm() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    errors,
    register,
    clearErrors,
    clearFieldError, // ✅ New
  } = useAuth();

  const handleRegister = () => {
    clearErrors(); // clears general error before each submit attempt
    register();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        {AUTH_STRINGS.registerTitle}
      </Text>

      <AuthInput
        placeholder="Nama Pengguna"
        value={name}
        onChangeText={(text: string) => {
          setName(text);
          clearFieldError("name");
        }}
        error={errors.name}
      />
      
      {/* ✅ Only clears email error when user types in email field */}
      <AuthInput
        placeholder={AUTH_STRINGS.emailPlaceholder}
        value={email}
        onChangeText={(text: string) => {
          setEmail(text);
          clearFieldError("email");
        }}
        error={errors.email}
      />

      {/* ✅ Only clears password error when user types in password field */}
      <AuthInput
        placeholder={AUTH_STRINGS.passwordPlaceholder}
        value={password}
        onChangeText={(text: string) => {
          setPassword(text);
          clearFieldError("password");
        }}
        secureTextEntry
        error={errors.password}
      />

      {/* ✅ Only clears confirmPassword error when user types here */}
      <AuthInput
        placeholder={AUTH_STRINGS.confirmPasswordPlaceholder}
        value={confirmPassword}
        onChangeText={(text: string) => {
          setConfirmPassword(text);
          clearFieldError("confirmPassword");
        }}
        secureTextEntry
        error={errors.confirmPassword}
      />

      {errors.general && (
        <Text style={[styles.error, { color: theme.error }]}>
          {errors.general}
        </Text>
      )}

      <AuthButton
        title={AUTH_STRINGS.registerButton}
        onPress={handleRegister}
        loading={loading}
      />

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.secondary }]}>
          {AUTH_STRINGS.haveAccount}{" "}
        </Text>
        <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
          <Text style={[styles.linkText, { color: theme.primary }]}>
            {AUTH_STRINGS.signIn}
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
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
  },
});