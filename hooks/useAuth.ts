import { router } from "expo-router";
import { useState } from "react";
import { VALIDATION_RULES } from "../constants/authData";
import { login as apiLogin, register as apiRegister } from "../services/authService";

export function useAuth() {
  const [name, setName] = useState("");             // ✅ Was missing
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateName = (value: string) => {         // ✅ Was missing
    if (!value) return "Nama diperlukan";
    return "";
  };

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

  const clearErrors = () => setErrors({});

  const clearFieldError = (field: string) => {
    setErrors(prev => ({ ...prev, [field]: "" }));
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
      await apiLogin(email, password);
      router.replace("/(tabs)");
    } catch (error: any) {
      const message = error?.response?.data?.message || "Log masuk gagal";
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    const nameError = validateName(name);           // ✅ Was missing
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmError = validateConfirmPassword(confirmPassword);

    if (nameError || emailError || passwordError || confirmError) {
      setErrors({
        name: nameError,                            // ✅ Was missing
        email: emailError,
        password: passwordError,
        confirmPassword: confirmError,
      });
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      await apiRegister(name, email, password, confirmPassword); // ✅ Fixed: now 4 args
      router.replace("/(tabs)");
    } catch (error: any) {
      const message = error?.response?.data?.message || "Pendaftaran gagal";
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  return {
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
    login,
    register,
    clearErrors,
    clearFieldError,
  };
}