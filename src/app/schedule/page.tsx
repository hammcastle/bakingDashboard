import Link from "next/link";
import { DayItemSummary } from "@/components/DayItemSummary";
import { MonthMarks } from "@/components/MonthMarks";
import { OrderCard } from "@/components/OrderCard";
import { OrderChip } from "@/components/OrderChip";
import { WorkTaskCard } from "@/components/WorkTaskCard";
import { ZoomControl } from "@/components/ZoomControl";
import { dayEndExclusive, dayStart, formatDayLabel, todayKey } from "@/lib/dates";
import { ordersBetween, workBetween } from "@/lib/db";
import {
  groupByDay,
  parseAnchor,
  parseZoom,
  rangeDays,
  rangeHeading,
  rangeLabel,
  scheduleHref,
  shiftAnchor,
  summarizeDayItems,
} from "@/lib/timeline";
import type { OrderView } from "@/lib/types";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; zoom?: string }>;
}) {
  const params = await searchParams;
  const today = todayKey();
  const zoom = parseZoom(params.zoom);
  const anchor = parseAnchor(params.from);
  const days = rangeDays(anchor, zoom);
  const start = dayStart(days[0]);
  const end = dayEndExclusive(days[days.length - 1]);
  const orders = ordersBetween(start, end);
  const work = zoom === "day" ? workBetween(start, end) : [];
  const ordersByDay = groupByDay(orders, (order) => order.due_at);
  const workByDay = groupByDay(work, (task) => task.scheduled_at);
  const prev = shiftAnchor(anchor, zoom, -1);
  const next = shiftAnchor(anchor, zoom, 1);
  const lede =
    zoom === "day"
      ? "Starter, mix, form, proof, bake, then pickup. Zoom out to see the book."
      : zoom === "week"
        ? "Who ordered what, and what to bake that day. Tighten in for the work steps."
        : "Each mark is a due day. Tap a day to tighten in.";

  return (
    <main>
      <p className="page-kicker">Upcoming</p>
      <h1 className="page-title">{rangeHeading(days, zoom)}</h1>
      <p className="lede">
        {rangeLabel(days)}. {lede}
      </p>
      <ZoomControl zoom={zoom} from={anchor} />
      <div className="row-between timeline-nav">
        <Link className="btn btn-ghost btn-small" href={scheduleHref(zoom, prev)}>
          Prev
        </Link>
        <Link className="btn btn-ghost btn-small" href={scheduleHref(zoom, today)}>
          Now
        </Link>
        <Link className="btn btn-ghost btn-small" href={scheduleHref(zoom, next)}>
          Next
        </Link>
      </div>

      {zoom === "month" ? (
        <MonthView days={days} byDay={ordersByDay} today={today} total={orders.length} />
      ) : null}

      {zoom === "week"
        ? days.map((day) => {
            const dayOrders = ordersByDay.get(day) || [];
            const bake = summarizeDayItems(dayOrders);
            return (
              <section key={day} id={`day-${day}`} className={`week-day ${day === today ? "today" : ""}`}>
                <h2 className="section-title">
                  <Link href={scheduleHref("day", day)}>{formatDayLabel(day)}</Link>
                  <span className="muted">
                    {dayOrders.length} {dayOrders.length === 1 ? "order" : "orders"}
                  </span>
                </h2>
                <DayItemSummary items={bake} />
                {dayOrders.length ? dayOrders.map((order) => <OrderChip key={order.id} order={order} />) : (
                  <p className="muted">Quiet day.</p>
                )}
              </section>
            );
          })
        : null}

      {zoom === "day"
        ? days.map((day) => {
            const dayWork = workByDay.get(day) || [];
            const dayOrders = ordersByDay.get(day) || [];
            return (
              <section key={day} id={`day-${day}`} className={`week-day ${day === today ? "today" : ""}`}>
                <h2 className="section-title">
                  Work
                  <span className="muted">
                    {dayWork.length} steps · {dayOrders.length} pickup
                  </span>
                </h2>
                {dayWork.length ? dayWork.map((task) => <WorkTaskCard key={task.id} task={task} />) : (
                  <p className="muted">No mix, shape, or bake steps land this day.</p>
                )}
                <h2 className="section-title">Pickup / delivery</h2>
                {dayOrders.length ? dayOrders.map((order) => <OrderCard key={order.id} order={order} />) : (
                  <p className="muted">Nothing due this day.</p>
                )}
              </section>
            );
          })
        : null}
    </main>
  );
}

function MonthView({
  days,
  byDay,
  today,
  total,
}: {
  days: string[];
  byDay: Map<string, OrderView[]>;
  today: string;
  total: number;
}) {
  const busy = days.filter((day) => (byDay.get(day) || []).length > 0);
  return (
    <>
      <div className="grid-2" style={{ marginBottom: 12 }}>
        <div className="stat">
          <b>{total}</b>
          <span>orders in view</span>
        </div>
        <div className="stat">
          <b>{busy.length}</b>
          <span>busy days</span>
        </div>
      </div>
      <MonthMarks days={days} byDay={byDay} today={today} />
    </>
  );
}
