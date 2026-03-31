import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const BASE_URL = Platform.select({
  web: "http://localhost:8000/api",
  default: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000/api",
});

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use(async (config: any) => {
  let token = null;

  if (Platform.OS === "web") {
    token = localStorage.getItem("auth_token");
  } else {
    token = await SecureStore.getItemAsync("auth_token");
  }

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
