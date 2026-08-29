import Link from "next/link";
import { notFound } from "next/navigation";
import { AdvanceStatusButton } from "@/components/AdvanceStatusButton";
import { OrderForm } from "@/components/OrderForm";
import { StatusBadge } from "@/components/StatusBadge";
import { WorkPlanList } from "@/components/WorkPlanList";
import { formatLongDate, formatTime } from "@/lib/dates";
import { formatPrice, getOrder, listCustomers, listWorkForOrder, nextStatus, statusLabel } from "@/lib/db";
import { ORDER_STATUSES } from "@/lib/types";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = getOrder(Number(id));
  if (!order) notFound();
  const customers = listCustomers();
  const next = nextStatus(order);
  const plan = listWorkForOrder(order.id);

  return (
    <main>
      <p className="page-kicker">Order #{order.id}</p>
      <div className="row-between">
        <h1 className="page-title">{order.customer_name}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="lede">
        {formatLongDate(order.due_at.slice(0, 10))} at {formatTime(order.due_at)} ·{" "}
        {order.fulfillment === "delivery" ? "Delivery" : "Pickup"}
        {order.price_cents != null ? ` · ${formatPrice(order.price_cents)}` : ""}
      </p>
      <p>
        <Link className="text-link" href={`/customers/${order.customer_id}`}>
          View customer →
        </Link>
        {order.customer_phone ? <span className="muted"> · {order.customer_phone}</span> : null}
      </p>

      <ul>
        {order.items.map((item) => (
          <li key={item.id}>
            {item.quantity}× {item.description}
          </li>
        ))}
      </ul>
      {order.notes ? <p className="panel">{order.notes}</p> : null}

      <h2 className="section-title">Bake plan</h2>
      <p className="lede">Work counted backward from pickup. Adjust product hours on Recipes if this loaf needs a longer rise.</p>
      <div className="panel">
        <WorkPlanList tasks={plan} />
      </div>

      <div className="detail-actions">
        {next ? (
          <AdvanceStatusButton
            orderId={order.id}
            status={next}
            label={`Mark ${statusLabel(next).toLowerCase()}`}
          />
        ) : null}
      </div>
      <div className="status-grid" style={{ marginBottom: 18 }}>
        {ORDER_STATUSES.map((status) => (
          <AdvanceStatusButton
            key={status}
            orderId={order.id}
            status={status}
            label={statusLabel(status)}
          />
        ))}
      </div>

      <h2 className="section-title">Edit order</h2>
      <div className="panel">
        <OrderForm customers={customers} order={order} />
      </div>
    </main>
  );
}
