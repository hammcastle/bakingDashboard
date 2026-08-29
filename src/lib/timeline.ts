import {
  addDaysKey,
  dayKey,
  formatDayLabel,
  formatLongDate,
  formatWeekdayDate,
  todayKey,
  weekKeys,
} from "./dates";
import type { OrderView } from "./types";

export const ZOOMS = ["day", "week", "month"] as const;
export type Zoom = (typeof ZOOMS)[number];

export function parseZoom(raw?: string): Zoom {
  if (raw === "day" || raw === "month") return raw;
  return "week";
}

export function parseAnchor(raw?: string, now = new Date()): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(raw || "") ? raw! : todayKey(now);
}

/** Day = that date. Week = Mon–Sun. Month = four weeks from that Monday. */
export function rangeDays(anchor: string, zoom: Zoom): string[] {
  if (zoom === "day") return [anchor];
  if (zoom === "week") return weekKeys(anchor);
  const start = weekKeys(anchor)[0];
  return Array.from({ length: 28 }, (_, i) => addDaysKey(start, i));
}

export function shiftAnchor(anchor: string, zoom: Zoom, dir: -1 | 1): string {
  if (zoom === "day") return addDaysKey(anchor, dir);
  if (zoom === "week") return addDaysKey(anchor, dir * 7);
  return addDaysKey(anchor, dir * 28);
}

export function rangeHeading(days: string[], zoom: Zoom, now = new Date()): string {
  const today = todayKey(now);
  if (zoom === "day") return formatDayLabel(days[0], now);
  if (zoom === "week") {
    return weekKeys(today)[0] === days[0] ? "This week" : "Week ahead";
  }
  return weekKeys(today)[0] === days[0] ? "Four weeks" : "Further out";
}

export function rangeLabel(days: string[]): string {
  if (days.length === 1) return formatLongDate(days[0]);
  return `${formatWeekdayDate(days[0])} – ${formatWeekdayDate(days[days.length - 1])}`;
}

export function groupByDay<T>(items: T[], stamp: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = dayKey(stamp(item));
    const list = groups.get(key);
    if (list) list.push(item);
    else groups.set(key, [item]);
  }
  return groups;
}

export function productLine(order: Pick<OrderView, "items">): string {
  const parts = order.items.map((item) => `${item.quantity}× ${item.description}`);
  if (parts.length === 0) return "No items";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} +${parts.length - 1}`;
}

export type DayItemTotal = {
  key: string;
  description: string;
  quantity: number;
};

/** Totals for each product due that day. Cancelled orders are off the book. */
export function summarizeDayItems(
  orders: Pick<OrderView, "status" | "items">[],
): DayItemTotal[] {
  const totals = new Map<string, DayItemTotal>();
  for (const order of orders) {
    if (order.status === "cancelled") continue;
    for (const item of order.items) {
      const description = item.description.trim();
      if (!description) continue;
      const key = description.toLowerCase();
      const existing = totals.get(key);
      if (existing) existing.quantity += item.quantity;
      else totals.set(key, { key, description, quantity: item.quantity });
    }
  }
  return [...totals.values()].sort((a, b) => {
    if (b.quantity !== a.quantity) return b.quantity - a.quantity;
    return a.description.localeCompare(b.description);
  });
}

export function orderNames(orders: Pick<OrderView, "customer_name">[], max = 2): string {
  const names = orders.map((order) => order.customer_name);
  if (names.length <= max) return names.join(", ");
  return `${names.slice(0, max).join(", ")} +${names.length - max}`;
}

export function scheduleHref(zoom: Zoom, from: string): string {
  return `/schedule?zoom=${zoom}&from=${from}`;
}
