import api from './api';
import type { PhoneVerificationStatus } from './phoneVerification';

export type PhoneResetStatus = PhoneVerificationStatus & { reset_token?: string };

export const requestPhonePasswordReset = async (phone: string): Promise<PhoneResetStatus> =>
  (await api.post('/phone/password/send', { phone }, { timeout: 25000 })).data;

export const getPhoneResetStatus = async (challenge: string): Promise<PhoneResetStatus> =>
  (await api.get('/phone/password/status', { params: { challenge }, timeout: 15000 })).data;

export const resendPhoneResetOtp = async (challenge: string): Promise<PhoneResetStatus> =>
  (await api.post('/phone/password/send', { challenge }, { timeout: 25000 })).data;

export const verifyPhoneResetOtp = async (challenge: string, otp: string): Promise<PhoneResetStatus> =>
  (await api.post('/phone/password/verify', { challenge, otp }, { timeout: 15000 })).data;

export const resetPhonePassword = async (challenge: string, token: string, password: string, confirmation: string): Promise<void> => {
  await api.post('/phone/password/reset', { challenge, token, password, password_confirmation: confirmation }, { timeout: 15000 });
};
