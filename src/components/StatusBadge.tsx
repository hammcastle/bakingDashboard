import { statusLabel } from "@/lib/labels";
import type { OrderStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`badge badge-${status}`}>{statusLabel(status)}</span>;
}
