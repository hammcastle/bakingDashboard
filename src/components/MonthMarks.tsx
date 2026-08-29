import Link from "next/link";
import { weekdayShort } from "@/lib/dates";
import { scheduleHref } from "@/lib/timeline";
import type { OrderView } from "@/lib/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthMarks({
  days,
  byDay,
  today,
}: {
  days: string[];
  byDay: Map<string, OrderView[]>;
  today: string;
}) {
  return (
    <div className="month-cal" role="grid" aria-label="Four-week order marks">
      {WEEKDAYS.map((label) => (
        <div key={label} className="month-dow" aria-hidden="true">
          {label}
        </div>
      ))}
      {days.map((day) => {
        const orders = byDay.get(day) || [];
        const count = orders.length;
        const dots = Math.min(count, 3);
        return (
          <Link
            key={day}
            href={scheduleHref("day", day)}
            className={`month-cell ${day === today ? "today" : ""} ${count ? "has-orders" : "quiet"}`}
            aria-label={`${weekdayShort(day)} ${day.slice(8)} · ${count} ${count === 1 ? "order" : "orders"}`}
          >
            <span className="month-num">{Number(day.slice(8))}</span>
            <span className="month-dots" aria-hidden="true">
              {count ? (
                <>
                  {Array.from({ length: dots }, (_, i) => (
                    <i key={i} />
                  ))}
                  <b>{count}</b>
                </>
              ) : (
                <span className="month-empty">·</span>
              )}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
