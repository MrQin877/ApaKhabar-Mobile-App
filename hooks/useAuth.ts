import { router, type Href } from "expo-router";
import { useRef, useState } from "react";
import { Platform } from "react-native";
import { VALIDATION_RULES } from "../constants/authData";
import {
  login as apiLogin,
  register as apiRegister,
} from "../services/authService";

const getServerErrorMessage = (error: any) => {
  const data = error?.response?.data;

  if (data?.message) return data.message;

  if (data?.errors) {
    const firstError = Object.values(data.errors)[0];

    if (Array.isArray(firstError) && firstError.length > 0) {
      return firstError[0];
    }

    if (typeof firstError === "string") {
      return firstError;
    }
  }

  return "Permintaan gagal. Sila cuba lagi.";
};

export function useAuth() {
  const submitting = useRef(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateName = (value: string) => {
    if (!value.trim()) return "Nama diperlukan";
    return "";
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) return VALIDATION_RULES.email.required;
    if (!VALIDATION_RULES.email.pattern.test(value.trim()))
      return VALIDATION_RULES.email.message;
    return "";
  };

  const validatePhone = (value: string) => {
    if (!value.trim()) return "Nombor telefon diperlukan";

    const normalized = value.trim();
    const phonePattern = /^\+?[1-9]\d{8,14}$/;

    if (!phonePattern.test(normalized)) {
      return "Nombor telefon tidak sah. Contoh: +60123456789";
    }

    return "";
  };

  const validateIdentifier = (value: string) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return "Sila masukkan e-mel atau nombor telefon.";
    }

    if (trimmed.includes("@")) {
      return validateEmail(trimmed);
    }

    return validatePhone(trimmed);
  };

  const validatePassword = (value: string) => {
    if (!value) return VALIDATION_RULES.password.required;
    if (value.length < VALIDATION_RULES.password.minLength)
      return VALIDATION_RULES.password.message;
    return "";
  };

  const validateConfirmPassword = (value: string) => {
    if (!value) return "Sila sahkan kata laluan";
    if (value !== password) return "Kata laluan tidak sepadan";
    return "";
  };

  const clearErrors = () => setErrors({});

  const clearFieldError = (field: string) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const login = async () => {
    if (submitting.current) return;
    const identifierError = validateIdentifier(email);
    const passwordError = validatePassword(password);

    if (identifierError || passwordError) {
      setErrors({
        email: identifierError,
        password: passwordError,
      });
      return;
    }

    submitting.current = true;
    setLoading(true);
    setErrors({});

    try {
      await apiLogin(email.trim(), password);
      router.replace("/(tabs)/news_content");
    } catch (error: any) {
      setErrors({ general: getServerErrorMessage(error) });
      submitting.current = false;
      setLoading(false);
    }
  };

  const register = async () => {
    if (submitting.current) return;
    const nameError = validateName(name);
    const emailError = email.trim() ? validateEmail(email) : "";
    const phoneError = phone.trim() ? validatePhone(phone) : "";
    const passwordError = validatePassword(password);
    const confirmError = validateConfirmPassword(confirmPassword);

    const hasAnyIdentifier = !!email.trim() || !!phone.trim();

    if (!hasAnyIdentifier) {
      setErrors({
        name: nameError,
        email: "Sila masukkan e-mel atau nombor telefon.",
        phone: "Sila masukkan e-mel atau nombor telefon.",
        password: passwordError,
        confirmPassword: confirmError,
      });
      return;
    }

    if (
      nameError ||
      emailError ||
      phoneError ||
      passwordError ||
      confirmError
    ) {
      setErrors({
        name: nameError,
        email: emailError,
        phone: phoneError,
        password: passwordError,
        confirmPassword: confirmError,
      });
      return;
    }

    submitting.current = true;
    setLoading(true);
    setErrors({});

    try {
      const result = await apiRegister(
        name.trim(),
        email.trim() || undefined,
        password,
        confirmPassword,
        phone.trim() || undefined,
      );
      router.replace((Platform.OS !== "web" && email.trim()
        ? "/verify-email"
        : result.user?.phone && !result.user.phone_verified_at
        ? "/verify-phone"
        : "/(tabs)/news_content") as Href);
    } catch (error: any) {
      setErrors({ general: getServerErrorMessage(error) });
      submitting.current = false;
      setLoading(false);
    }
  };

  return {
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
    login,
    register,
    clearErrors,
    clearFieldError,
  };
}
