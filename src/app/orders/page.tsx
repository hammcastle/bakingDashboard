import Link from "next/link";
import { OrderCard } from "@/components/OrderCard";
import { listOrders } from "@/lib/db";
import type { OrderStatus } from "@/lib/types";
import { ORDER_STATUSES } from "@/lib/types";
import { statusLabel } from "@/lib/labels";

const FILTERS = ["active", "all", ...ORDER_STATUSES] as const;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = FILTERS.includes(params.status as (typeof FILTERS)[number])
    ? (params.status as (typeof FILTERS)[number])
    : "active";
  const orders = listOrders(
    status === "all" ? undefined : { status: status as OrderStatus | "active" },
  );

  return (
    <main>
      <div className="row-between">
        <div>
          <p className="page-kicker">Orders</p>
          <h1 className="page-title">All orders</h1>
        </div>
        <Link href="/orders/new" className="btn btn-copper btn-small">
          + New
        </Link>
      </div>
      <div className="chips">
        {FILTERS.map((filter) => (
          <Link
            key={filter}
            href={filter === "active" ? "/orders" : `/orders?status=${filter}`}
            className={`chip ${status === filter ? "active" : ""}`}
          >
            {filter === "all" ? "All" : filter === "active" ? "Active" : statusLabel(filter)}
          </Link>
        ))}
      </div>
      {orders.length ? (
        orders.map((order) => <OrderCard key={order.id} order={order} showDate />)
      ) : (
        <p className="empty">No orders in this view. Add one with the button above.</p>
      )}
    </main>
  );
}
