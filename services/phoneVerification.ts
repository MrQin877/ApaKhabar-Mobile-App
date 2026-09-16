import { isAxiosError } from 'axios';
import api from './api';

export interface PhoneVerificationStatus {
  phone: string | null;
  phone_verified_at: string | null;
  otp_pending: boolean;
  retry_after: number;
  daily_limit_reached: boolean;
  daily_reset_after: number;
  status?: 'otp-sent' | 'phone-verified' | 'already-verified';
}

export const getPhoneVerificationStatus = async (): Promise<PhoneVerificationStatus> =>
  (await api.get('/phone/verification-status', { timeout: 15000 })).data;

export const requestPhoneOtp = async (): Promise<PhoneVerificationStatus> =>
  (await api.post('/phone/verification-notification', {}, { timeout: 25000 })).data;

export const verifyPhoneOtp = async (phone: string, otp: string): Promise<PhoneVerificationStatus> =>
  (await api.post('/phone/verify', { phone, otp }, { timeout: 15000 })).data;

export function phoneVerificationError(error: unknown): string {
  if (__DEV__) {
    // Log the error category/message only, never Axios config, auth headers or OTP payloads.
    const name = error instanceof Error ? error.name : typeof error;
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn('[Phone verification]', name, message.replace(/https?:\/\/\S+/g, '[URL]').replace(/\b\d{6,}\b/g, '[redacted]'));
  }
  if (isAxiosError(error)) {
    if (error.response?.status === 401) return 'Sila masuk semula ke akaun anda.';
    if (error.response?.data?.daily_limit_reached) return 'Had 5 permintaan OTP sehari telah dicapai. Sila cuba lagi esok.';
    return error.response?.data?.errors?.otp?.[0]
      ?? error.response?.data?.errors?.phone?.[0]
      ?? error.response?.data?.message
      ?? 'Tidak dapat menghubungi pelayan. Semak sambungan internet dan cuba lagi.';
  }
  return 'Permintaan gagal. Sila cuba lagi.';
}

export function phoneStatusFromError(error: unknown): PhoneVerificationStatus | null {
  const data = isAxiosError(error) ? error.response?.data : null;
  return data && typeof data.retry_after === 'number' && typeof data.daily_reset_after === 'number'
    && typeof data.daily_limit_reached === 'boolean' ? data : null;
}
