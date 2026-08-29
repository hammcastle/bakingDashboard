/** Local date helpers. Times are stored as `YYYY-MM-DDTHH:mm` in the baker's timezone. */

export function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function toStamp(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function dayKey(stamp: string): string {
  return stamp.slice(0, 10);
}

export function todayKey(now = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addDaysKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dayStart(key: string): string {
  return `${key}T00:00`;
}

export function dayEndExclusive(key: string): string {
  return dayStart(addDaysKey(key, 1));
}

export function atTime(key: string, hours: number, minutes: number): string {
  return `${key}T${pad(hours)}:${pad(minutes)}`;
}

export function formatDayLabel(key: string, now = new Date()): string {
  const today = todayKey(now);
  if (key === today) return "Today";
  if (key === addDaysKey(today, 1)) return "Tomorrow";
  if (key === addDaysKey(today, -1)) return "Yesterday";
  return formatWeekdayDate(key);
}

export function formatWeekdayDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatLongDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(stamp: string): string {
  const [hours, minutes] = stamp.slice(11, 16).split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function weekKeys(anchor: string): string[] {
  const [y, m, d] = anchor.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(y, m - 1, d + mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const next = new Date(monday);
    next.setDate(monday.getDate() + i);
    return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
  });
}

export function stampToDateInput(stamp: string): { date: string; time: string } {
  return { date: stamp.slice(0, 10), time: stamp.slice(11, 16) };
}

export function addHours(stamp: string, hours: number): string {
  const [y, m, d] = stamp.slice(0, 10).split("-").map(Number);
  const [hh, mm] = stamp.slice(11, 16).split(":").map(Number);
  const date = new Date(y, m - 1, d, hh, mm);
  date.setMinutes(date.getMinutes() + Math.round(hours * 60));
  return toStamp(date);
}

export function subtractHours(stamp: string, hours: number): string {
  return addHours(stamp, -hours);
}

export function formatWeekdayTime(stamp: string): string {
  const [y, m, d] = stamp.slice(0, 10).split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
  return `${weekday} ${formatTime(stamp)}`;
}

export function weekdayShort(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short" });
}

export function formatMonthDay(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Sunday = 0 … Saturday = 6, matching `Date#getDay`. */
export function weekdayIndex(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

/** The next date with this weekday (0–6). `weeksOut` skips additional weeks. Same weekday on `from` is week 0. */
export function onWeekday(from: string, weekday: number, weeksOut = 0): string {
  const delta = (weekday - weekdayIndex(from) + 7) % 7;
  return addDaysKey(from, delta + weeksOut * 7);
}
