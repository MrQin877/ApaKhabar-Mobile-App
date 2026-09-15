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

api.interceptors.request.use(async (config: any) => {
  let token = null;

  if (Platform.OS === "web") {
    token = localStorage.getItem("auth_token");
  } else {
    token = await SecureStore.getItemAsync("auth_token");
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      await clearStoredAuth();

      try {
        router.replace("/(auth)/login");
      } catch {
        // Ignore navigation errors during startup when router may not be ready.
      }
    }

    return Promise.reject(error);
  },
);

export default api;
