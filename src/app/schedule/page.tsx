import Link from "next/link";
import { OrderCard } from "@/components/OrderCard";
import { WorkTaskCard } from "@/components/WorkTaskCard";
import {
  addDaysKey,
  dayStart,
  formatDayLabel,
  formatWeekdayDate,
  todayKey,
  weekKeys,
} from "@/lib/dates";
import { ordersBetween, workBetween } from "@/lib/db";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const params = await searchParams;
  const today = todayKey();
  const anchor = /^\d{4}-\d{2}-\d{2}$/.test(params.from || "") ? params.from! : today;
  const days = weekKeys(anchor);
  const weekStart = days[0];
  const weekEnd = addDaysKey(days[6], 1);
  const orders = ordersBetween(dayStart(weekStart), dayStart(weekEnd));
  const work = workBetween(dayStart(weekStart), dayStart(weekEnd));
  const prev = addDaysKey(weekStart, -7);
  const next = addDaysKey(weekStart, 7);

  return (
    <main>
      <p className="page-kicker">Schedule</p>
      <h1 className="page-title">This week</h1>
      <p className="lede">
        {formatWeekdayDate(days[0])} – {formatWeekdayDate(days[6])}. Work steps first, then pickups.
      </p>
      <div className="row-between" style={{ marginBottom: 12 }}>
        <Link className="btn btn-ghost btn-small" href={`/schedule?from=${prev}`}>
          Prev week
        </Link>
        <Link className="btn btn-ghost btn-small" href="/schedule">
          This week
        </Link>
        <Link className="btn btn-ghost btn-small" href={`/schedule?from=${next}`}>
          Next week
        </Link>
      </div>
      <div className="chips">
        {days.map((day) => (
          <a key={day} className={`chip ${day === today ? "active" : ""}`} href={`#day-${day}`}>
            {formatDayLabel(day)}
          </a>
        ))}
      </div>
      {days.map((day) => {
        const dayWork = work.filter((task) => task.scheduled_at.startsWith(day));
        const dayOrders = orders.filter((order) => order.due_at.startsWith(day));
        return (
          <section key={day} id={`day-${day}`} className={`week-day ${day === today ? "today" : ""}`}>
            <h2 className="section-title">
              {formatDayLabel(day)}
              <span className="muted">
                {dayWork.length} work · {dayOrders.length} pickup
              </span>
            </h2>
            {dayWork.length ? dayWork.map((task) => <WorkTaskCard key={task.id} task={task} />) : null}
            {dayOrders.length ? dayOrders.map((order) => <OrderCard key={order.id} order={order} />) : null}
            {!dayWork.length && !dayOrders.length ? <p className="muted">Quiet day.</p> : null}
          </section>
        );
      })}
    </main>
  );
}
