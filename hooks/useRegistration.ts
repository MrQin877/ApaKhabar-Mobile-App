import { useRef, useState } from "react";
import { Platform } from "react-native";
import { router, type Href } from "expo-router";
import { register } from "@/services/authService";
import { VALIDATION_RULES } from "@/constants/authData";

export function birthDateBounds(now = new Date()) {
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const earliest = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
  return { today, earliest: `${earliest.getFullYear()}-${String(earliest.getMonth() + 1).padStart(2, "0")}-${String(earliest.getDate()).padStart(2, "0")}` };
}
export function validBirthDate(day: string, now = new Date()) {
  const bounds = birthDateBounds(now);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Date.parse(day))
    && new Date(day).toISOString().slice(0, 10) === day && day >= bounds.earliest && day <= bounds.today;
}
export function useRegistration() {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [fields, setFields] = useState({ name: "", date_of_birth: "", citizenship: "", gender: "", ethnicity: "", email: "", phone: "", password: "", password_confirmation: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const pending = useRef(false);
  const update = (field: keyof typeof fields, value: string) => {
    setFields(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "", general: "" }));
  };
  const personalErrors = () => {
    const result: Record<string, string> = {};
    if (!fields.name.trim() || fields.name.trim().length > 255) result.name = "Masukkan nama penuh (maksimum 255 aksara).";
    if (!validBirthDate(fields.date_of_birth)) result.date_of_birth = "Pilih tarikh lahir yang sah dalam 120 tahun terakhir.";
    if (!["wni", "wna", "dual"].includes(fields.citizenship)) result.citizenship = "Pilih kewarganegaraan.";
    if (fields.gender && !["male", "female", "undisclosed"].includes(fields.gender)) result.gender = "Pilih jantina yang sah.";
    if (fields.ethnicity.trim().length > 100) result.ethnicity = "Etnik maksimum 100 aksara.";
    return result;
  };
  const next = () => { const result = personalErrors(); setErrors(result); if (!Object.keys(result).length) setStep(2); };
  const submit = async () => {
    if (pending.current) return;
    const result = personalErrors();
    if (Object.keys(result).length) { setErrors(result); setStep(1); return; }
    if (method === "email" && (!VALIDATION_RULES.email.pattern.test(fields.email.trim()) || fields.email.trim().length > 255)) result.email = "Masukkan alamat e-mel yang sah.";
    if (method === "phone" && !/^\+[1-9]\d{1,14}$/.test(fields.phone)) result.phone = "Masukkan nombor telefon yang sah dengan kod negara.";
    if (fields.password.length < VALIDATION_RULES.password.minLength) result.password = VALIDATION_RULES.password.message;
    if (!fields.password_confirmation || fields.password_confirmation !== fields.password) result.password_confirmation = "Kata laluan tidak sepadan.";
    if (Object.keys(result).length) { setErrors(result); return; }
    pending.current = true; setLoading(true); setErrors({});
    try {
      const response = await register(fields.name.trim(), method === "email" ? fields.email.trim() : undefined, fields.password, fields.password_confirmation,
        method === "phone" ? fields.phone : undefined, { date_of_birth: fields.date_of_birth, citizenship: fields.citizenship,
          ...(fields.gender ? { gender: fields.gender } : {}), ...(fields.ethnicity.trim() ? { ethnicity: fields.ethnicity.trim() } : {}) });
      router.replace((Platform.OS !== "web" && method === "email" ? "/verify-email" : response.user?.phone && !response.user.phone_verified_at ? "/verify-phone" : "/(tabs)/news_content") as Href);
    } catch (error: any) {
      const data = error?.response?.data;
      const mapped: Record<string, string> = {};
      for (const [key, value] of Object.entries(data?.errors || {})) {
        if (typeof value === "string") mapped[key] = value;
        else if (Array.isArray(value) && typeof value[0] === "string") mapped[key] = value[0];
      }
      mapped.general = data?.message || "Pendaftaran gagal. Sila cuba lagi.";
      setErrors(mapped);
      if (["name", "date_of_birth", "citizenship", "gender", "ethnicity"].some(key => mapped[key])) setStep(1);
      pending.current = false; setLoading(false);
    }
  };
  return { step, setStep, method, setMethod, fields, update, errors, loading, next, submit };
}
