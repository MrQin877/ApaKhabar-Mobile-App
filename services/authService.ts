import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import api from "./api";
import { registerPushToken } from "./pushToken";

const saveToken = async (token: string, user: any) => {
  if (Platform.OS === "web") {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("user", JSON.stringify(user));
  } else {
    await SecureStore.setItemAsync("auth_token", token);
    await SecureStore.setItemAsync("user", JSON.stringify(user));
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
};

export const login = async (email: string, password: string) => {
  const response = await api.post("/login", { email, password });
  await saveToken(response.data.token, response.data.user);
  await registerPushToken(); // ← add here

  // 🔍 DEBUG
  console.log(
    "[AUTH] ✅ Login OK |",
    response.data.user?.email,
    "| role:",
    response.data.user?.role,
  );

  return response.data;
};

export const register = async (
  name: string,
  email: string,
  password: string,
) => {
  const response = await api.post("/register", { name, email, password });
  await saveToken(response.data.token, response.data.user);

  // 🔍 DEBUG
  console.log("[AUTH] ✅ Register OK |", response.data.user?.email);

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

export const forgotPassword = async (email: string) => {
  try {
    const response = await api.post("/forgot-password", { email });
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
    const response = await api.post("/api/reset-password", {
      token,
      email,
      password,
      password_confirmation,
    });
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
