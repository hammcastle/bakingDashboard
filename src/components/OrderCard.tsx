import Link from "next/link";
import { formatPrice, nextStatus, statusLabel } from "@/lib/db";
import { formatTime } from "@/lib/dates";
import type { OrderView } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { AdvanceStatusButton } from "./AdvanceStatusButton";

export function OrderCard({ order, showDate = false }: { order: OrderView; showDate?: boolean }) {
  const next = nextStatus(order);
  const items = order.items
    .map((item) => `${item.quantity}× ${item.description}`)
    .join(" · ");
  return (
    <article className="order-card">
      <Link href={`/orders/${order.id}`}>
        <div className="order-card-top">
          <div>
            <h3>{order.customer_name}</h3>
            <div className="meta">
              {formatTime(order.due_at)}
              {showDate ? ` · ${order.due_at.slice(0, 10)}` : ""}
              {` · ${order.fulfillment === "delivery" ? "Delivery" : "Pickup"}`}
              {order.price_cents != null ? ` · ${formatPrice(order.price_cents)}` : ""}
            </div>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <p className="items-line">{items || "No items"}</p>
        {order.notes ? <p className="muted">{order.notes}</p> : null}
      </Link>
      {next ? (
        <div className="advance">
          <AdvanceStatusButton orderId={order.id} status={next} label={`Mark ${statusLabel(next).toLowerCase()}`} />
        </div>
      ) : null}
    </article>
  );
}
