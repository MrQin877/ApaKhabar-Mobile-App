import axios from "axios";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const BASE_URL = Platform.select({
  web: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000/api",
  default:
    process.env.EXPO_PUBLIC_API_URL ??
    (Platform.OS === "android"
      ? "http://10.0.2.2:8000/api"
      : "http://localhost:8000/api"),
});

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const clearStoredAuth = async () => {
  if (Platform.OS === "web") {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
  } else {
    await SecureStore.deleteItemAsync("auth_token");
    await SecureStore.deleteItemAsync("user");
  }
};

const getStoredToken = async () => {
  if (Platform.OS === "web") {
    return localStorage.getItem("auth_token");
  }
  return SecureStore.getItemAsync("auth_token");
};

const isAuthRequest = (url?: string) =>
  ['/login', '/register', '/forgot-password', '/reset-password'].includes(url ?? '');

api.interceptors.request.use(async (config: any) => {
  if (isAuthRequest(config.url)) return config;
  const token = await getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let invalidatingSession = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Invalid credentials belong on the current form. Only expire the session
    // when a protected request used the token that is still stored now.
    if (error?.response?.status === 401 && !isAuthRequest(error.config?.url)) {
      const authorization = error.config?.headers?.Authorization;
      const currentToken = await getStoredToken();
      if (!currentToken || authorization !== `Bearer ${currentToken}` || invalidatingSession) {
        return Promise.reject(error);
      }
      invalidatingSession = true;
      try {
        await clearStoredAuth();
        router.replace("/(auth)/login");
      } catch {
        // Ignore navigation errors during startup when router may not be ready.
      } finally {
        invalidatingSession = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
