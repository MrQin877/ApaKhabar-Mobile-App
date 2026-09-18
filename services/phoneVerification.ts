import { isAxiosError } from 'axios';
import api from './api';

export interface PhoneVerificationStatus {
  challenge?: string;
  phone: string | null;
  phone_verified_at: string | null;
  otp_pending: boolean;
  retry_after: number;
  daily_limit_reached: boolean;
  daily_reset_after: number;
  status?: 'otp-sent' | 'phone-verified' | 'already-verified' | 'reset-authorized';
}

export const getPhoneVerificationStatus = async (challenge?: string): Promise<PhoneVerificationStatus> =>
  (await api.get(challenge ? '/phone/change-verification' : '/phone/verification-status', { params: challenge ? { challenge } : undefined, timeout: 15000 })).data;

export const requestPhoneOtp = async (challenge?: string): Promise<PhoneVerificationStatus> =>
  (await api.post(challenge ? '/phone/change-verification' : '/phone/verification-notification', challenge ? { challenge } : {}, { timeout: 25000 })).data;

export const requestPhoneChangeOtp = async (phone: string): Promise<PhoneVerificationStatus> =>
  (await api.post('/phone/change-verification', { phone }, { timeout: 25000 })).data;

export const verifyPhoneOtp = async (phone: string, otp: string, challenge?: string): Promise<PhoneVerificationStatus> =>
  (await api.post(challenge ? '/phone/change-verification/verify' : '/phone/verify', challenge ? { challenge, otp } : { phone, otp }, { timeout: 15000 })).data;

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
