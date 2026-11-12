import { localDay } from "./newsFilters";

export function notificationDateLabel(value: string, now = new Date()): string {
  const raw = value.split(",")[0].trim();
  if (!raw) return "Terdahulu";
  const match = /^(\d{1,2})\s+(\S+)\s+(\d{4})$/.exec(raw);
  let day = /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : "";
  if (match) {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const aliases: Record<string, string> = { mac: "mar", mei: "may", ogo: "aug", ogs: "aug", okt: "oct", dis: "dec", des: "dec", agu: "aug" };
    const word = match[2].toLowerCase().replace(/\.$/, "");
    const month = months.indexOf(aliases[word] || word);
    if (month >= 0) day = `${match[3]}-${String(month + 1).padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  }
  const today = localDay(now);
  const yesterday = new Date(`${today}T00:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return day === today ? "Hari Ini" : day === yesterday.toISOString().slice(0, 10) ? "Semalam" : raw;
}

export function notificationInstructions(value: unknown): string[] {
  if (typeof value === "string") {
    try { return notificationInstructions(JSON.parse(value)); } catch { return value.trim() ? [value.trim()] : []; }
  }
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && !!item.trim()) : [];
}
