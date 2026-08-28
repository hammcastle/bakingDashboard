import Link from "next/link";
import { OrderCard } from "@/components/OrderCard";
import { addDaysKey, dayEndExclusive, dayStart, formatLongDate, formatTime, todayKey } from "@/lib/dates";
import { ordersBetween } from "@/lib/db";

export default function TodayPage() {
  const today = todayKey();
  const tomorrow = addDaysKey(today, 1);
  const todays = ordersBetween(dayStart(today), dayEndExclusive(today));
  const tomorrows = ordersBetween(dayStart(tomorrow), dayEndExclusive(tomorrow));
  const baking = todays.filter((order) => order.status === "baking");
  const due = todays.filter((order) => order.status !== "baking" && order.status !== "ready");
  const ready = todays.filter((order) => order.status === "ready");

  return (
    <main>
      <p className="page-kicker">Kitchen board</p>
      <h1 className="page-title">{formatLongDate(today)}</h1>
      <div className="grid-2">
        <div className="stat">
          <b>{todays.length}</b>
          <span>due today</span>
        </div>
        <div className="stat">
          <b>{tomorrows.length}</b>
          <span>on tomorrow</span>
        </div>
      </div>

      <section className="peek">
        <h2>Tomorrow at a glance</h2>
        {tomorrows.length === 0 ? (
          <p className="muted">Nothing due tomorrow yet.</p>
        ) : (
          <ul className="peek-list">
            {tomorrows.map((order) => (
              <li key={order.id}>
                <Link href={`/orders/${order.id}`}>
                  <strong>{formatTime(order.due_at)}</strong> {order.customer_name} —{" "}
                  {order.items.map((item) => `${item.quantity}× ${item.description}`).join(", ")}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p>
          <Link className="text-link" href="/schedule">
            Open the week →
          </Link>
        </p>
      </section>

      <h2 className="section-title">Baking now</h2>
      {baking.length ? baking.map((order) => <OrderCard key={order.id} order={order} />) : <p className="muted">Nothing in the oven tracked for today.</p>}

      <h2 className="section-title">Ready for pickup / delivery</h2>
      {ready.length ? ready.map((order) => <OrderCard key={order.id} order={order} />) : <p className="muted">Nothing waiting at the counter.</p>}

      <h2 className="section-title">Also due today</h2>
      {due.length ? due.map((order) => <OrderCard key={order.id} order={order} />) : <p className="muted">No other orders today.</p>}
    </main>
  );
}
