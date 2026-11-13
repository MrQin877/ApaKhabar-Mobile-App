import { newsLikesVersion, observeNewsLikes } from "./newsLikes";
import { subscribeSession } from "./sessionEvents";
import api from "./api";
import { NEWS_STALE_TIME } from "@/constants/news";
import type { NewsItem } from "@/hooks/useNews";
type FeedState = { items: NewsItem[]; categories: string[]; loading: boolean; refreshing: boolean; error: string | null; loadedAt: number };
let state: FeedState = { items: [], categories: [], loading: true, refreshing: false, error: null, loadedAt: 0 };
const listeners = new Set<() => void>();
let pending: Promise<void> | null = null;
let session = 0;
let commentRevision = 0;
const confirmedCommentCounts = new Map<string, { count: number; revision: number }>();
const emit = (patch: Partial<FeedState>) => { state = { ...state, ...patch }; listeners.forEach(listener => listener()); };
export const newsFeedSnapshot = () => state;
export const subscribeNewsFeed = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function loadNewsFeed(force = false): Promise<void> {
  if (pending) return pending;
  if (!force && state.loadedAt && Date.now() - state.loadedAt < NEWS_STALE_TIME) return Promise.resolve();
  emit({ loading: !state.loadedAt, refreshing: !!state.loadedAt, error: null });
  const currentSession = session;
  const readCommentRevision = commentRevision;
  const likesVersion = newsLikesVersion();
  pending = Promise.all([api.get("/news", { timeout: 15000 }), api.get("/categories", { timeout: 15000 }).catch(() => null)]).then(([response, categoryResponse]) => {
    if (currentSession !== session) return;
    const payload = response.data?.data ?? response.data;
    if (!Array.isArray(payload)) throw new Error("Invalid news response");
    const seen = new Set<string>();
    const items = (payload as NewsItem[]).filter(item => { const id = String(item.id); if (seen.has(id)) return false; seen.add(id); return true; }).map(item => {
      const confirmed = confirmedCommentCounts.get(String(item.id));
      return confirmed && confirmed.revision > readCommentRevision ? { ...item, comments: confirmed.count, comments_count: confirmed.count } : item;
    });
    observeNewsLikes(items, likesVersion);
    const categoryPayload = categoryResponse?.data?.categories;
    const categoryNames: string[] = Array.isArray(categoryPayload) ? categoryPayload.map((category: { name: string }) => category.name).filter(Boolean) : [];
    const categories = Array.from(new Set([...categoryNames, ...items.map(item => item.category)]));
    emit({ items, categories, loadedAt: Date.now(), loading: false, refreshing: false });
  }).catch(() => { if (currentSession !== session) return; emit({ loading: false, refreshing: false, error: "Berita tidak dapat dimuatkan. Sila cuba lagi." }); })
    .finally(() => { if (currentSession === session) pending = null; });
  return pending;
}

export function updateNewsCommentCount(id: string, count: number) {
  confirmedCommentCounts.set(String(id), { count, revision: ++commentRevision });
  emit({ items: state.items.map(item => String(item.id) === String(id) ? { ...item, comments: count, comments_count: count } : item) });
}

// Refresh cached counts on the next focused news screen after engagement changes.
export function invalidateNewsFeed() { if (state.loadedAt) emit({ loadedAt: 1 }); }

subscribeSession(() => {
  session++; pending = null; confirmedCommentCounts.clear();
  emit({ items: [], loadedAt: 0, loading: true, error: null });
  if (listeners.size) void loadNewsFeed(true);
});
