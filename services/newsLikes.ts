import api from './api';
import { getToken } from './authService';
import { subscribeSession } from './sessionEvents';

export type LikeSource = { id: string; kind?: 'short'; likes?: number; likes_count?: number; liked?: boolean; is_liked?: boolean; liked_by_user?: boolean };
export type LikeState = { liked: boolean; count: number; pending: boolean; error: string };
const states = new Map<string, LikeState>();
const lastMutation = new Map<string, number>();
const requests = new Map<string, Promise<LikeState | null | undefined>>();
const intents = new Map<string, { liked: boolean; authorized: boolean }>();
const key = (item: Pick<LikeSource, 'id' | 'kind'>) => item.kind === 'short' ? `short:${item.id}` : String(item.id);
const listeners = new Set<() => void>();
let generation = 0;
let revision = 0;
const emit = () => { revision++; listeners.forEach(fn => fn()); };
export const likesRevision = () => revision;
export const subscribeNewsLikes = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export const initialLikeState = (item: LikeSource): LikeState => ({ liked: !!(item.liked_by_user ?? item.is_liked ?? item.liked), count: item.likes_count ?? item.likes ?? 0, pending: false, error: '' });
export const newsLikeState = (id: string, kind?: 'short') => states.get(key({ id, kind }));
export const newsLikesVersion = () => ({ generation, revision });
export function observeNewsLikes(items: LikeSource[], version = newsLikesVersion()) {
  if (version.generation !== generation) return;
  for (const item of items) if (!requests.has(key(item)) && ((lastMutation.get(key(item)) ?? 0) <= version.revision)) states.set(key(item), initialLikeState(item));
  emit();
}
subscribeSession(() => { generation++; for (const [id, state] of states) states.set(id, { ...state, liked: false, pending: false, error: '' }); requests.clear(); intents.clear(); lastMutation.clear(); emit(); });

export function toggleNewsLike(item: LikeSource): Promise<LikeState | null | undefined> {
  const id = key(item);
  const existing = requests.get(id);
  if (existing) {
    const intent = intents.get(id)!;
    intent.liked = !intent.liked;
    const state = states.get(id);
    if (intent.authorized && state) {
      states.set(id, { ...state, liked: intent.liked, count: Math.max(0, state.count + (intent.liked ? 1 : -1)) });
      emit();
    }
    return existing;
  }
  const session = generation;
  const intent = { liked: !(states.get(id) ?? initialLikeState(item)).liked, authorized: false };
  intents.set(id, intent);
  const request = (async () => {
    // Guests retain their existing navigation/restriction; never show a fake like.
    const token = await getToken();
    if (session !== generation) return undefined;
    if (!token) return null;
    let confirmed = states.get(id) ?? initialLikeState(item);
    intent.authorized = true;
    const publish = (pending: boolean, error = '') => {
      lastMutation.set(id, revision + 1);
      states.set(id, { liked: intent.liked, count: Math.max(0, confirmed.count + Number(intent.liked) - Number(confirmed.liked)), pending, error });
      emit();
    };
    publish(true);
    try {
      // Serialize toggles and coalesce repeated taps to the most recent choice.
      while (intent.liked !== confirmed.liked) {
        const { data } = await api.post(`/${item.kind === 'short' ? 'shorts' : 'news'}/${item.id}/like`, {}, { timeout: 15000 });
        if (session !== generation) return undefined;
        if (typeof data.liked !== 'boolean' || typeof data.likes_count !== 'number') throw Error('Invalid like response');
        confirmed = { liked: data.liked, count: data.likes_count, pending: false, error: '' };
        if (intent.liked !== confirmed.liked) publish(true);
      }
      publish(false);
      return states.get(id);
    } catch (error) {
      if (session === generation) { intent.liked = confirmed.liked; publish(false, 'Suka tidak dapat dikemas kini. Cuba lagi.'); }
      throw error;
    }
  })();
  requests.set(id, request);
  void request.finally(() => { if (requests.get(id) === request) { requests.delete(id); intents.delete(id); } }).catch(() => {});
  return request;
}
