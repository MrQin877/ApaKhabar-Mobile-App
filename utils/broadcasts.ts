export interface BroadcastAnnouncement {
  id?: string; notification_id?: string; title?: string; message: string;
  channel?: string; sent_at?: string; sent_at_full?: string;
}
export function readLatestBroadcast(payload: unknown): BroadcastAnnouncement | null {
  const wrapper = payload as { data?: unknown } | null;
  const data = wrapper?.data ?? payload;
  const item = (Array.isArray(data) ? data[0] : data) as BroadcastAnnouncement | null;
  if (!item || typeof item.message !== "string" || !item.message.trim()) return null;
  if (item.title) return item;
  // The existing Laravel endpoint returns only "title: message" (or message: null).
  const separator = item.message.indexOf(": ");
  return separator > 0 ? { ...item, title: item.message.slice(0, separator), message: item.message.slice(separator + 2) } : item;
}
