import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import api from "./api";

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
  return response.data;
};

export const register = async (
  name: string,
  email: string,
  password: string,
) => {
  const response = await api.post("/register", { name, email, password });
  await saveToken(response.data.token, response.data.user);
  return response.data;
};

export const logout = async () => {
  await api.post("/logout");
  await clearToken();
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
