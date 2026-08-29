import Link from "next/link";
import { OrderCard } from "@/components/OrderCard";
import { WorkTaskCard } from "@/components/WorkTaskCard";
import { groupTodayOrders, isOpenStatus } from "@/lib/board";
import { addDaysKey, dayEndExclusive, dayStart, formatLongDate, formatTime, todayKey } from "@/lib/dates";
import { ordersBetween, workBetween } from "@/lib/db";
import { stepLabel } from "@/lib/plan";

export default function TodayPage() {
  const today = todayKey();
  const tomorrow = addDaysKey(today, 1);
  const { open, baking, ready, due } = groupTodayOrders(
    ordersBetween(dayStart(today), dayEndExclusive(today)),
  );
  const tomorrows = ordersBetween(dayStart(tomorrow), dayEndExclusive(tomorrow)).filter((order) =>
    isOpenStatus(order.status),
  );
  const workToday = workBetween(dayStart(today), dayEndExclusive(today));
  const workTomorrow = workBetween(dayStart(tomorrow), dayEndExclusive(tomorrow));
  const openWork = workToday.filter((task) => !task.done);

  return (
    <main>
      <p className="page-kicker">Kitchen board</p>
      <h1 className="page-title">{formatLongDate(today)}</h1>
      <div className="grid-2">
        <div className="stat">
          <b>{openWork.length}</b>
          <span>work steps today</span>
        </div>
        <div className="stat">
          <b>{open.length}</b>
          <span>pickups today</span>
        </div>
      </div>

      <section className="peek">
        <h2>Tomorrow at a glance</h2>
        {workTomorrow.length === 0 && tomorrows.length === 0 ? (
          <p className="muted">Nothing on the board tomorrow yet.</p>
        ) : (
          <ul className="peek-list">
            {workTomorrow.map((task) => (
              <li key={`w-${task.id}`}>
                <Link href={`/orders/${task.order_id}`}>
                  <strong>{formatTime(task.scheduled_at)}</strong> {stepLabel(task.step)} · {task.item_quantity}×{" "}
                  {task.item_description} ({task.customer_name})
                </Link>
              </li>
            ))}
            {tomorrows.map((order) => (
              <li key={`o-${order.id}`}>
                <Link href={`/orders/${order.id}`}>
                  <strong>{formatTime(order.due_at)}</strong>{" "}
                  {order.fulfillment === "delivery" ? "Delivery" : "Pickup"} {order.customer_name} —{" "}
                  {order.items.map((item) => `${item.quantity}× ${item.description}`).join(", ")}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p>
          <Link className="text-link" href="/schedule">
            See upcoming orders →
          </Link>
        </p>
      </section>

      <h2 className="section-title">Work today</h2>
      {workToday.length ? (
        workToday.map((task) => <WorkTaskCard key={task.id} task={task} />)
      ) : (
        <p className="muted">No mix, shape, or bake steps land today.</p>
      )}

      <h2 className="section-title">Baking now</h2>
      {baking.length ? baking.map((order) => <OrderCard key={order.id} order={order} />) : <p className="muted">Nothing in the oven tracked for today.</p>}

      <h2 className="section-title">Ready for pickup / delivery</h2>
      {ready.length ? ready.map((order) => <OrderCard key={order.id} order={order} />) : <p className="muted">Nothing waiting at the counter.</p>}

      <h2 className="section-title">Also due today</h2>
      {due.length ? due.map((order) => <OrderCard key={order.id} order={order} />) : <p className="muted">No other pickups today.</p>}
    </main>
  );
}
