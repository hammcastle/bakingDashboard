import type { OrderStatus } from "./types";

export function statusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    inquiry: "Inquiry",
    confirmed: "Confirmed",
    baking: "Baking",
    ready: "Ready",
    picked_up: "Picked up",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return labels[status];
}

export function formatPrice(cents: number | null): string {
  if (cents == null) return "";
  return `$${(cents / 100).toFixed(2)}`;
}

export const ITEM_SUGGESTIONS = [
  "Sourdough loaf",
  "Focaccia",
  "Chocolate chip cookies",
  "Birthday cake",
  "Croissants",
  "Cupcakes",
  "Cinnamon rolls",
  "Muffins",
];
