import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(async (config: any) => {
  let token = null;

  if (Platform.OS === 'web') {
    token = localStorage.getItem('auth_token');  // ← web uses localStorage
  } else {
    token = await SecureStore.getItemAsync('auth_token');  // ← mobile uses SecureStore
  }

  console.log('Token being sent:', token ? 'EXISTS' : 'NULL');

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;