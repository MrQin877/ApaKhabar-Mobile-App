import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import api from './api';
import { getToken } from './authService';
import type { CommentSubmission } from '@/utils/newsComments';

const IDENTITY_KEY = 'guest_comment_identity_v1';
let initializing: Promise<string> | null = null;
const contexts = new Map<string, Promise<{ challenge: string; readyAt: number; expiresAt: number }>>();

export async function guestToken(): Promise<string> {
  if (initializing) return initializing;
  initializing = (async () => {
    const stored = Platform.OS === 'web' ? localStorage.getItem(IDENTITY_KEY) : await SecureStore.getItemAsync(IDENTITY_KEY);
    if (stored) return stored;
    const { data } = await api.post('/guest-comments/identity');
    if (typeof data.token !== 'string' || !/^[a-f0-9]{64}$/.test(data.token)) throw new Error('Invalid guest identity response');
    // Persist before submitting anything. Never silently rotate credentials on an error.
    if (Platform.OS === 'web') localStorage.setItem(IDENTITY_KEY, data.token);
    else await SecureStore.setItemAsync(IDENTITY_KEY, data.token);
    return data.token;
  })();
  try { return await initializing; } finally { initializing = null; }
}

export async function submitPublicComment(path: string, kind: 'news' | 'short', id: string, content: string): Promise<CommentSubmission> {
  if (await getToken()) return (await api.post(path, { content })).data;
  const token = await guestToken();
  const headers = { 'X-Guest-Token': token };
  const key = `${kind}:${id}`;
  const context = async () => {
    const { data } = await api.get(`/${kind === 'news' ? 'news' : 'shorts'}/${id}/comment-context`, { headers });
    if (typeof data.challenge !== 'string') throw new Error('Invalid comment challenge response');
    return { challenge: data.challenge, readyAt: Date.now() + 3100, expiresAt: Date.now() + 7_190_000 };
  };
  try {
    if (!contexts.has(key)) contexts.set(key, context());
    let challenge = await contexts.get(key)!;
    if (challenge.expiresAt <= Date.now()) {
      contexts.set(key, context());
      challenge = await contexts.get(key)!;
    }
    // Preserve the website's three-second anti-spam challenge without relying on a browser session.
    const delay = challenge.readyAt - Date.now();
    if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
    return (await api.post(path, { content, website: '', challenge: challenge.challenge }, { headers })).data;
  } catch (error) {
    contexts.delete(key);
    throw error;
  }
}

// Shared credential and backend quota for a Shorts client, without a separate local counter.
export const postShortComment = (id: string, content: string) => submitPublicComment(`/shorts/${id}/comments`, 'short', id, content);
export const postShortCommentReply = (id: string, commentId: string, content: string) => submitPublicComment(`/shorts/${id}/comments/${commentId}/replies`, 'short', id, content);
