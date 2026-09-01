import { router } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { useAuth } from "../../hooks/useAuth";
import { PhoneNumberInput } from "../phone-number-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { AuthButton } from "./AuthButton";
import { AuthInput } from "./AuthInput";

export function RegisterForm() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const [method, setMethod] = useState<"email" | "phone">("email");

  const {
    name,
    setName,
    email,
    setEmail,
    phone,
    setPhone,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    errors,
    register,
    clearErrors,
    clearFieldError,
  } = useAuth();

  const handleRegister = () => {
    clearErrors();
    register();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          Buat akun baharu
        </Text>
        <Text style={[styles.description, { color: theme.secondary }]}>
          Masukkan data anda di bawah untuk mendaftar
        </Text>
      </View>

      {/* Form Fields */}
      <View style={styles.formContainer}>
        {/* Name Field */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Nama</Text>
          <AuthInput
            placeholder="Nama lengkap"
            value={name}
            onChangeText={(text: string) => {
              setName(text);
              clearFieldError("name");
            }}
            error={errors.name}
          />
        </View>

        {/* Email/Phone Tabs */}
        <Tabs
          value={method}
          onValueChange={(v) => setMethod(v as "email" | "phone")}
        >
          <TabsList tabs={["email", "phone"]}>
            <TabsTrigger value="email">E-mel</TabsTrigger>
            <TabsTrigger value="phone">Nombor telefon</TabsTrigger>
          </TabsList>

          <TabsContent value="email" activeTab={method}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>
                Alamat e-mail
              </Text>
              <AuthInput
                placeholder="email@contoh.com"
                value={email}
                onChangeText={(text: string) => {
                  setEmail(text);
                  clearFieldError("email");
                }}
                error={errors.email}
              />
            </View>
          </TabsContent>

          <TabsContent value="phone" activeTab={method}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>
                Nombor telefon
              </Text>
              <PhoneNumberInput
                value={phone}
                onChangeText={setPhone}
                error={errors.phone}
              />
            </View>
          </TabsContent>
        </Tabs>

        {/* Password Field */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Kata sandi</Text>
          <AuthInput
            placeholder="Kata sandi"
            value={password}
            onChangeText={(text: string) => {
              setPassword(text);
              clearFieldError("password");
            }}
            secureTextEntry
            error={errors.password}
          />
        </View>

        {/* Confirm Password Field */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.text }]}>
            Ulangi kata sandi
          </Text>
          <AuthInput
            placeholder="Ulangi kata sandi"
            value={confirmPassword}
            onChangeText={(text: string) => {
              setConfirmPassword(text);
              clearFieldError("confirmPassword");
            }}
            secureTextEntry
            error={errors.confirmPassword}
          />
        </View>

        {/* General Error */}
        {errors.general && (
          <Text style={[styles.generalError, { color: theme.error }]}>
            {errors.general}
          </Text>
        )}

        {/* Register Button */}
        <AuthButton
          title="Buat akaun"
          onPress={handleRegister}
          loading={loading}
        />
      </View>

      {/* Login Link */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.secondary }]}>
          Sudah ada akun?{" "}
        </Text>
        <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
          <Text style={[styles.loginLink, { color: theme.primary }]}>
            Log masuk
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
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
  loginLink: {
    fontSize: 14,
    fontWeight: "600",
  },
});
