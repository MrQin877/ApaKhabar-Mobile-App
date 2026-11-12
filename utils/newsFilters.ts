import { NEWS_TIME_ZONE } from "@/constants/news";
import type { NewsItem } from "@/hooks/useNews";
export type NewsDateFilter = "all" | "today" | "week" | "month" | `custom:${string}:${string}`;
export function customDateRange(filter: NewsDateFilter) {
  if (!filter.startsWith("custom:")) return null;
  const [, start, end] = filter.split(":");
  const valid = (day: string) => /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Date.parse(day)) && new Date(day).toISOString().slice(0, 10) === day;
  return valid(start) && valid(end) && start <= end ? { start, end } : null;
}
export function newsDateLabel(filter: NewsDateFilter) {
  if (filter === "today") return "Hari Ini";
  if (filter === "week") return "Minggu Ini";
  if (filter === "month") return "Bulan Ini";
  const range = customDateRange(filter);
  const format = (day: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
  return range ? range.start === range.end ? format(range.start) : `${format(range.start)} – ${format(range.end)}` : "Semua tarikh";
}
const months: Record<string, number> = {
  january: 1, januari: 1, february: 2, februari: 2, march: 3, mac: 3, april: 4,
  may: 5, mei: 5, june: 6, jun: 6, july: 7, julai: 7, august: 8, ogos: 8,
  september: 9, october: 10, oktober: 10, november: 11, december: 12, disember: 12,
};
export function localDay(date: Date, timeZone = NEWS_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const part = (type: string) => parts.find(p => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
function validDay(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` : null;
}
export function publicationDay(item: NewsItem, timeZone = NEWS_TIME_ZONE): string | null {
  const value = item.published_at || item.created_at || item.date || "";
  // Date-only and legacy display dates are already in the application's timezone.
  const isoDay = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (isoDay) return validDay(+isoDay[1], +isoDay[2], +isoDay[3]);
  const display = /^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i.exec(value.trim());
  if (display) return validDay(+display[3], months[display[2].toLowerCase()] || 0, +display[1]);
  // Timestamps without an offset from Laravel are local wall-clock times.
  const wallClock = /^(\d{4})-(\d{2})-(\d{2})[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.exec(value.trim());
  if (wallClock) return validDay(+wallClock[1], +wallClock[2], +wallClock[3]);
  if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(value)) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? localDay(date, timeZone) : null;
}
export function matchesNewsDate(item: NewsItem, filter: NewsDateFilter, now = new Date(), timeZone = NEWS_TIME_ZONE) {
  if (filter === "all") return true;
  const day = publicationDay(item, timeZone);
  if (!day) return false;
  const today = localDay(now, timeZone);
  if (day > today) return false;
  if (filter.startsWith("custom:")) {
    const range = customDateRange(filter);
    return !!range && day >= range.start && day <= range.end;
  }
  if (filter === "today") return day === today;
  if (filter === "month") return day.slice(0, 7) === today.slice(0, 7);
  const start = new Date(`${today}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 6);
  return day >= start.toISOString().slice(0, 10);
}
export function filterNews(items: NewsItem[], filters: { query?: string; category?: string; date?: NewsDateFilter }, now = new Date()) {
  const words = (filters.query || "").trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const seen = new Set<string>();
  return items.filter(item => {
    const id = String(item.id);
    if (seen.has(id)) return false;
    seen.add(id);
    const category = filters.category;
    const text = `${item.title} ${item.description || item.preview || ""} ${item.body || ""}`.replace(/<[^>]*>/g, " ").toLocaleLowerCase();
    return (!category || category === "Semua" || item.category === category)
      && words.every(word => text.includes(word)) && matchesNewsDate(item, filters.date || "all", now);
  });
}
export function newsPostingTime(item: NewsItem, now = new Date()) {
  if (item.time) return item.time;
  const timestamp = item.published_at || item.created_at;
  if (timestamp && /(Z|[+-]\d{2}:?\d{2})$/i.test(timestamp)) {
    const elapsed = now.getTime() - Date.parse(timestamp);
    if (Number.isFinite(elapsed) && elapsed >= 0) {
      const minutes = Math.floor(elapsed / 60000);
      if (minutes < 1) return "Baru sahaja";
      if (minutes < 60) return `${minutes} min`;
      if (minutes < 1440) return `${Math.floor(minutes / 60)} jam`;
      return `${Math.floor(minutes / 1440)} hari`;
    }
  }
  return item.date || "";
}
