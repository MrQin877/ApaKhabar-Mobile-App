import { isAxiosError } from 'axios';
import api from './api';
import { Platform } from 'react-native';

export type VerificationResponse = {
  status: 'verification-link-sent' | 'already-verified';
  email: string;
};

export async function resendVerification(): Promise<VerificationResponse> {
  // The server chooses the authenticated user's saved email.
  const { createURL } = await import('expo-linking');
  const return_url = Platform.OS === 'web' ? undefined : createURL('verify-email', { isTripleSlashed: true });
  const response = await api.post('/email/verification-notification', { return_url }, { timeout: 15000 });
  return response.data;
}

export function verificationError(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 429) {
      const seconds = Number(error.response.headers['retry-after']) || 60;
      return `Terlalu banyak permintaan. Coba lagi dalam ${seconds} detik.`;
    }
    if (error.response?.status === 401) return 'Sila masuk semula ke akaun anda.';
    return error.response?.data?.errors?.email?.[0]
      ?? error.response?.data?.message
      ?? 'Tidak dapat terhubung. Periksa sambungan internet dan coba lagi.';
  }
  return 'Permintaan gagal. Silakan coba lagi.';
}
