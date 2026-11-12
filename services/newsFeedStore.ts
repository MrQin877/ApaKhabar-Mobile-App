import api from "./api";
import { NEWS_STALE_TIME } from "@/constants/news";
import type { NewsItem } from "@/hooks/useNews";
type FeedState = { items: NewsItem[]; categories: string[]; loading: boolean; refreshing: boolean; error: string | null; loadedAt: number };
let state: FeedState = { items: [], categories: [], loading: true, refreshing: false, error: null, loadedAt: 0 };
const listeners = new Set<() => void>();
let pending: Promise<void> | null = null;
const emit = (patch: Partial<FeedState>) => { state = { ...state, ...patch }; listeners.forEach(listener => listener()); };
export const newsFeedSnapshot = () => state;
export const subscribeNewsFeed = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function loadNewsFeed(force = false): Promise<void> {
  if (pending) return pending;
  if (!force && state.loadedAt && Date.now() - state.loadedAt < NEWS_STALE_TIME) return Promise.resolve();
  emit({ loading: !state.loadedAt, refreshing: !!state.loadedAt, error: null });
  pending = Promise.all([api.get("/news", { timeout: 15000 }), api.get("/categories", { timeout: 15000 }).catch(() => null)]).then(([response, categoryResponse]) => {
    const payload = response.data?.data ?? response.data;
    if (!Array.isArray(payload)) throw new Error("Invalid news response");
    const seen = new Set<string>();
    const items = (payload as NewsItem[]).filter(item => { const id = String(item.id); if (seen.has(id)) return false; seen.add(id); return true; });
    const categoryPayload = categoryResponse?.data?.categories;
    const categoryNames: string[] = Array.isArray(categoryPayload) ? categoryPayload.map((category: { name: string }) => category.name).filter(Boolean) : [];
    const categories = Array.from(new Set([...categoryNames, ...items.map(item => item.category)]));
    emit({ items, categories, loadedAt: Date.now(), loading: false, refreshing: false });
  }).catch(() => { emit({ loading: false, refreshing: false, error: "Berita tidak dapat dimuatkan. Sila cuba lagi." }); })
    .finally(() => { pending = null; });
  return pending;
}

// Refresh cached counts on the next focused news screen after engagement changes.
export function invalidateNewsFeed() { if (state.loadedAt) emit({ loadedAt: 1 }); }
