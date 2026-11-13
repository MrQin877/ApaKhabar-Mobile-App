import api from './api';
import { getToken } from './authService';
import { subscribeSession } from './sessionEvents';

export type LikeSource = { id: string; likes?: number; likes_count?: number; liked?: boolean; is_liked?: boolean; liked_by_user?: boolean };
export type LikeState = { liked: boolean; count: number; pending: boolean; error: string };
const states = new Map<string, LikeState>();
const lastMutation = new Map<string, number>();
const requests = new Map<string, Promise<LikeState | null | undefined>>();
const listeners = new Set<() => void>();
let generation = 0;
let revision = 0;
const emit = () => { revision++; listeners.forEach(fn => fn()); };
export const likesRevision = () => revision;
export const subscribeNewsLikes = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export const initialLikeState = (item: LikeSource): LikeState => ({ liked: !!(item.liked_by_user ?? item.is_liked ?? item.liked), count: item.likes_count ?? item.likes ?? 0, pending: false, error: '' });
export const newsLikeState = (id: string) => states.get(String(id));
export const newsLikesVersion = () => ({ generation, revision });
export function observeNewsLikes(items: LikeSource[], version = newsLikesVersion()) {
  if (version.generation !== generation) return;
  for (const item of items) if (!requests.has(String(item.id)) && ((lastMutation.get(String(item.id)) ?? 0) <= version.revision)) states.set(String(item.id), initialLikeState(item));
  emit();
}
subscribeSession(() => { generation++; for (const [id, state] of states) states.set(id, { ...state, liked: false, pending: false, error: '' }); requests.clear(); lastMutation.clear(); emit(); });

export function toggleNewsLike(item: LikeSource): Promise<LikeState | null | undefined> {
  const id = String(item.id);
  const existing = requests.get(id);
  if (existing) return existing;
  const session = generation;
  const request = (async () => {
    // Guests retain their existing navigation/restriction; never show a fake like.
    const token = await getToken();
    if (session !== generation) return undefined;
    if (!token) return null;
    const previous = states.get(id) ?? initialLikeState(item);
    lastMutation.set(id, revision + 1);
    states.set(id, { liked: !previous.liked, count: Math.max(0, previous.count + (previous.liked ? -1 : 1)), pending: true, error: '' });
    emit();
    try {
      const { data } = await api.post(`/news/${id}/like`);
      if (session !== generation) return undefined;
      if (typeof data.liked !== 'boolean' || typeof data.likes_count !== 'number') throw Error('Invalid like response');
      const confirmed = { liked: data.liked, count: data.likes_count, pending: false, error: '' };
      lastMutation.set(id, revision + 1);
      states.set(id, confirmed); emit(); return confirmed;
    } catch (error) {
      if (session === generation) { lastMutation.set(id, revision + 1); states.set(id, { ...previous, pending: false, error: 'Suka tidak dapat dikemas kini. Cuba lagi.' }); emit(); }
      throw error;
    }
  })();
  requests.set(id, request);
  void request.finally(() => { if (requests.get(id) === request) requests.delete(id); }).catch(() => {});
  return request;
}
