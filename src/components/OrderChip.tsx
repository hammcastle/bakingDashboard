import Link from "next/link";
import { formatTime } from "@/lib/dates";
import { productLine } from "@/lib/timeline";
import type { OrderView } from "@/lib/types";

export function OrderChip({ order }: { order: OrderView }) {
  return (
    <Link href={`/orders/${order.id}`} className="order-chip">
      <span className={`chip-pip badge-${order.status}`} aria-hidden="true" />
      <span className="order-chip-body">
        <strong>
          {order.customer_name}
          <span className="muted">
            {" · "}
            {formatTime(order.due_at)}
            {order.fulfillment === "delivery" ? " delivery" : " pickup"}
          </span>
        </strong>
        <span className="order-chip-items">{productLine(order)}</span>
      </span>
    </Link>
  );
}
