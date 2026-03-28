import { router } from "expo-router";
import { useState } from "react";
import { VALIDATION_RULES } from "../constants/authData";
import { login as apiLogin, register as apiRegister } from "../services/authService";

export function useAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = (value: string) => {
    if (!value) return VALIDATION_RULES.email.required;
    if (!VALIDATION_RULES.email.pattern.test(value))
      return VALIDATION_RULES.email.message;
    return "";
  };

  const validatePassword = (value: string) => {
    if (!value) return VALIDATION_RULES.password.required;
    if (value.length < VALIDATION_RULES.password.minLength)
      return VALIDATION_RULES.password.message;
    return "";
  };

  const validateConfirmPassword = (value: string) => {
    if (value !== password) return "Kata laluan tidak sepadan";
    return "";
  };

  const login = async () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      await apiLogin(email, password); // ← calls Laravel /api/login
      router.replace("/(tabs)");
    } catch (error: any) {
      const message = error?.response?.data?.message || "Log masuk gagal";
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmError = validateConfirmPassword(confirmPassword);
    if (emailError || passwordError || confirmError) {
      setErrors({
        email: emailError,
        password: passwordError,
        confirmPassword: confirmError,
      });
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      await apiRegister(email, password, email); // ← calls Laravel /api/register
      router.replace("/(tabs)");
    } catch (error: any) {
      const message = error?.response?.data?.message || "Pendaftaran gagal";
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  const clearErrors = () => setErrors({});

  return {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    errors,
    login,
    register,
    clearErrors,
  };
}