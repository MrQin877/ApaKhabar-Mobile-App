import api from './api';
import { guestToken, postShortComment, postShortCommentReply } from './guestCommentService';
import { getToken } from './authService';
import { subscribeSession } from './sessionEvents';
import type { NewsCommentsSnapshot, PublicNewsComment } from '@/utils/newsComments';

export type ShortVideo = { id: string; title: string; description: string; thumbnail_url: string | null; video_url?: string; published_at?: string; view_count: number; likes_count: number; comments_count: number; liked_by_user?: boolean };
export type ShortsPage = { items: ShortVideo[]; next: number | null; mobileReady: boolean };
const pending = new Map<string, Promise<ShortVideo>>();
let firstPage: { at: number; value: ShortsPage } | undefined;
let firstRequest: Promise<ShortsPage> | undefined;
subscribeSession(() => { firstPage = undefined; });
export async function getShorts(page = 1, force = false): Promise<ShortsPage> {
  if (page === 1 && !force && firstPage && Date.now() - firstPage.at < 60_000) return firstPage.value;
  if (page === 1 && firstRequest) return firstRequest;
  const request = api.get('/shorts', { params: { mobile: 1, page }, timeout: 15000 }).then(({ data }) => {
    const mobileReady = data.mobile_feed === true;
    const paginator = data.shorts ?? data;
    const raw = mobileReady ? paginator.data : [...(page === 1 ? data.topShorts ?? [] : []), ...(paginator.data ?? [])];
    const items = raw.filter((v: ShortVideo & { status?: string; deleted_at?: string }) => (!v.status || v.status === 'published') && !v.deleted_at).map((v: ShortVideo) => ({ ...v, id: String(v.id) }));
    const value = { items, next: paginator.next_page_url ? page + 1 : null, mobileReady };
    if (page === 1) firstPage = { at: Date.now(), value };
    return value;
  });
  if (page !== 1) return request;
  firstRequest = request;
  try { return await request; } finally { firstRequest = undefined; }
}
export function getShort(id: string): Promise<ShortVideo> {
  if (pending.has(id)) return pending.get(id)!;
  const request = api.get(`/shorts/${id}`, { timeout: 15000 }).then(({ data }) => ({ ...data.data, id: String(data.data.id) })).finally(() => pending.delete(id));
  pending.set(id, request); return request;
}
export async function shortComments(id: string, startPage = 1): Promise<NewsCommentsSnapshot> {
  // Fetch only published server pages. Replies use their own paginated endpoint.
  const comments: PublicNewsComment[] = [];
  let page: number | null = startPage;
  let total = 0;
  while (page !== null) {
    const { data }: { data: { count: number; comments: { data: (PublicNewsComment & { replies_count: number })[]; next_page_url: string | null } } } = await api.get(`/shorts/${id}/comments`, { params: { page }, timeout: 15000 });
    total = data.count;
    for (const root of data.comments.data) {
      comments.push({ ...root, id: String(root.id) });
      if (!root.replies_count) continue;
      let replyPage: number | null = 1;
      while (replyPage !== null) {
        const response: { data: { data: PublicNewsComment[]; next_page_url: string | null } } = await api.get(`/shorts/${id}/comments/${root.id}/replies`, { params: { page: replyPage }, timeout: 15000 });
        comments.push(...response.data.data.map((reply: PublicNewsComment) => ({ ...reply, id: String(reply.id) })));
        replyPage = response.data.next_page_url ? replyPage + 1 : null;
      }
    }
    return { comments, total, nextPage: data.comments.next_page_url ? page + 1 : null };
  }
  return { comments, total };
}
export const shortsCommentAdapter = {
  report: async (commentId: string, reason: string, id: string, category?: string) => (await api.post(`/shorts/${id}/comments/${commentId}/report`, category ? { category, details: reason } : { reason })).data,
  load: shortComments,
  more: shortComments,
  post: postShortComment,
  reply: (commentId: string, content: string, id: string) => postShortCommentReply(id, commentId, content),
};
export const toggleShortLike = async (id: string) => (await api.post(`/shorts/${id}/like`)).data as { liked: boolean; likes_count: number };
export const countShortView = async (id: string) => {
  const headers = await getToken() ? {} : { 'X-Guest-Token': await guestToken() };
  const { data } = await api.get(`/shorts/${id}/view-token`, { headers });
  await new Promise(resolve => setTimeout(resolve, 5100));
  return (await api.post(`/shorts/${id}/view`, { token: data.token }, { headers })).data as { view_count: number };
};
