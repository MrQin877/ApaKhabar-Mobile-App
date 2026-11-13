export type Validator = (value: string) => string;

export const emailError: Validator = value =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) && value.trim().length <= 255
    ? "" : "Masukkan alamat e-mel yang sah, seperti nama@email.com.";
export const phoneError: Validator = value =>
  /^\+(60|62)[1-9]\d{6,12}$/.test(value.trim())
    ? "" : "Masukkan nombor telefon Malaysia atau Indonesia yang sah.";
export const identifierError: Validator = value =>
  value.includes("@") || /[a-z]/i.test(value) ? emailError(value)
    : /^\+?[1-9]\d{8,14}$/.test(value.trim()) ? "" : "Masukkan e-mel atau nombor telefon yang sah.";
export const passwordError: Validator = value =>
  value.length >= 8 ? "" : "Kata laluan mesti sekurang-kurangnya 8 aksara.";
export const requiredError: Validator = value => value.trim() ? "" : "Ruangan ini diperlukan.";
export const confirmationError = (password: string): Validator => value =>
  value === password && !!value ? "" : "Kata laluan tidak sepadan.";

// Laravel field errors can be strings or arrays. Keep genuine server messages.
export function serverFieldErrors(error: unknown): Record<string, string> {
  const data = (error as { response?: { data?: { errors?: Record<string, unknown> } } })?.response?.data;
  return Object.fromEntries(Object.entries(data?.errors ?? {}).flatMap(([key, value]) =>
    typeof value === "string" ? [[key, value]]
      : Array.isArray(value) && typeof value[0] === "string" ? [[key, value[0]]] : []));
}
