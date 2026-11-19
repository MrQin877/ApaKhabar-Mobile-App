import { sessionChanged } from "./sessionEvents";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import api from "./api";
import { registerPushToken } from "./pushToken";

const saveToken = async (token: string, user: any) => {
  if (Platform.OS === "web") {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("user", JSON.stringify(user ?? {}));
  } else {
    await SecureStore.setItemAsync("auth_token", token);
    await SecureStore.setItemAsync("user", JSON.stringify(user ?? {}));
  }
  sessionChanged();
};

const saveUser = async (user: any) => {
  if (Platform.OS === "web") {
    localStorage.setItem("user", JSON.stringify(user ?? {}));
  } else {
    await SecureStore.setItemAsync("user", JSON.stringify(user ?? {}));
  }
};

const clearToken = async () => {
  if (Platform.OS === "web") {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
  } else {
    await SecureStore.deleteItemAsync("auth_token");
    await SecureStore.deleteItemAsync("user");
  }
  sessionChanged();
};

const parseIdentifierPayload = (identifier: string) => {
  const trimmed = identifier.trim();

  if (trimmed.includes("@")) {
    return { email: trimmed };
  }

  return { phone: trimmed };
};

export const login = async (identifier: string, password: string) => {
  const payload: Record<string, string> = { password };
  const parsed = parseIdentifierPayload(identifier);

  if (parsed.email) {
    payload.email = parsed.email;
  }

  if (parsed.phone) {
    payload.phone = parsed.phone;
  }

  const response = await api.post("/login", payload);
  await saveToken(response.data.token, response.data.user);
  void registerPushToken();

  console.log(
    "[AUTH] ✅ Login OK |",
    response.data.user?.email ?? response.data.user?.phone,
    "| role:",
    response.data.user?.role,
  );

  return response.data;
};

const EMAIL_REGISTRATION_KEY = "pending_email_registration";

export const hasPendingEmailRegistration = async (): Promise<boolean> => {
  if (Platform.OS === "web") return false;
  const email = await SecureStore.getItemAsync(EMAIL_REGISTRATION_KEY);
  return !!email && (await getUser())?.email === email;
};

// Only pass a freshly fetched server profile, never cached verification data.
export const completeEmailRegistration = async (profile: UserProfile): Promise<boolean> => {
  if (Platform.OS === "web" || !profile.email || !profile.email_verified_at) return false;
  if (await SecureStore.getItemAsync(EMAIL_REGISTRATION_KEY) !== profile.email) return false;
  await SecureStore.deleteItemAsync(EMAIL_REGISTRATION_KEY);
  return true;
};

export const register = async (
  name: string,
  email: string | undefined,
  password: string,
  confirmPassword: string,
  phone?: string,
  demographics?: { date_of_birth: string; citizenship: string; gender?: string; ethnicity?: string },
) => {
  const payload: Record<string, string | undefined> = {
    ...demographics,
    name,
    password,
    password_confirmation: confirmPassword,
  };

  if (email && email.trim()) {
    payload.email = email.trim();
    if (Platform.OS !== 'web') {
      const { createURL } = await import('expo-linking');
      payload.return_url = createURL('verify-email', { isTripleSlashed: true });
    }
  }

  if (phone && phone.trim()) {
    payload.phone = phone.trim();
  }

  const response = await api.post("/register", payload);
  if (Platform.OS !== "web" && payload.email) {
    await SecureStore.setItemAsync(EMAIL_REGISTRATION_KEY, response.data.user?.email ?? payload.email);
  }
  await saveToken(response.data.token, response.data.user);
  void registerPushToken();

  return response.data;
};

export const logout = async () => {
  try {
    await api.post("/logout");
    console.log("[AUTH] ✅ Logout OK | token deleted from server");
  } catch (err: any) {
    console.warn(
      "[AUTH] ⚠️ Logout API fail |",
      err?.response?.status ?? err?.message,
    );
  } finally {
    await clearToken();
    console.log("[AUTH] 🧹 Local token cleared");
  }
};

export const getUser = async () => {
  if (Platform.OS === "web") {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } else {
    const user = await SecureStore.getItemAsync("user");
    return user ? JSON.parse(user) : null;
  }
};

export const getToken = async () => {
  if (Platform.OS === "web") {
    return localStorage.getItem("auth_token");
  } else {
    return await SecureStore.getItemAsync("auth_token");
  }
};

export interface UserProfile {
  avatar?: string | null;
  profile_photo_url?: string | null;
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  email_verified_at: string | null;
  phone_verified_at: string | null;
}

export const updateProfile = async (name: string, email: string): Promise<UserProfile> => {
  const response = await api.patch('/profile', { name, email }, { timeout: 15000 });
  await saveUser(response.data);
  return response.data;
};

export const getProfile = async (): Promise<UserProfile> => {
  const token = await getToken();
  if (!token) throw new Error('Authentication required');
  const response = await api.get("/profile", { timeout: 15000 });
  if (await getToken() !== token) throw new Error('Session changed');
  await saveUser(response.data);
  return response.data;
};

export const forgotPassword = async (email: string) => {
  try {
    const { createURL } = await import('expo-linking');
    // Expo Go uses its current Metro address; installed builds use the app scheme.
    const sessionUrl = createURL('reset-password', { isTripleSlashed: true });
    const return_url = sessionUrl.startsWith('apakhabarmobileapp:')
      ? 'apakhabarmobileapp:///reset-password' : sessionUrl;
    const response = await api.post("/forgot-password", { email: email.trim(), return_url }, { timeout: 30000 });
    console.log("[AUTH] ✅ Reset link sent |", email);
    return response.data;
  } catch (err: any) {
    console.warn(
      "[AUTH] ⚠️ Forgot password fail |",
      err?.response?.status ?? err?.message,
    );
    throw err;
  }
};

export const resetPassword = async (
  token: string,
  email: string,
  password: string,
  password_confirmation: string,
) => {
  try {
    const response = await api.post("/reset-password", {
      token,
      email,
      password,
      password_confirmation,
    }, { timeout: 20000 });
    console.log("[AUTH] ✅ Password reset OK |", email);
    return response.data;
  } catch (err: any) {
    console.warn(
      "[AUTH] ⚠️ Reset password fail |",
      err?.response?.status ?? err?.message,
    );
    throw err;
  }
};
