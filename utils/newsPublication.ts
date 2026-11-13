import { NEWS_TIME_ZONE } from '@/constants/news';
import { publicationDay } from './newsFilters';
import type { NewsItem } from '@/hooks/useNews';

/** Absolute publication metadata; never use the feed's relative `time` label. */
export function publicationDateTime(item: Pick<NewsItem, "published_at" | "created_at" | "date">, timeZone = NEWS_TIME_ZONE): string {
  for (const source of [item.published_at, item.created_at, item.date]) {
    if (!source) continue;
    const value = source.trim();
    const wall = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/.exec(value);
    let date: Date;
    let zone = timeZone;
    if (wall) {
      // Legacy Laravel SQL timestamps represent app-local wall time, not device time.
      if (+wall[2] > 23 || +wall[3] > 59 || +(wall[4] || 0) > 59 || !publicationDay({ ...item, published_at: wall[1] } as NewsItem)) continue;
      date = new Date(`${value.replace(' ', 'T')}Z`);
      zone = 'UTC';
    } else {
      if (!/[T ]\d{2}:\d{2}.*(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) continue;
      date = new Date(value.replace(' ', 'T'));
    }
    if (!Number.isFinite(date.getTime())) continue;
    const day = new Intl.DateTimeFormat('en-GB', { timeZone: zone, day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    const clock = new Intl.DateTimeFormat('en-US', { timeZone: zone, hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
    return `${day} · ${clock}`;
  }
  // A date-only legacy response has no recoverable clock time. Do not invent midnight.
  for (const source of [item.published_at, item.created_at, item.date]) {
    const day = source && publicationDay({ ...item, published_at: source } as NewsItem);
    if (day) return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${day}T00:00:00Z`));
  }
  return 'Tarikh penerbitan tidak tersedia';
}
