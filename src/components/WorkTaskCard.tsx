import Link from "next/link";
import { formatTime, formatWeekdayTime } from "@/lib/dates";
import { stepLabel } from "@/lib/plan";
import type { WorkTaskView } from "@/lib/types";
import { MarkWorkDoneButton } from "./MarkWorkDoneButton";

export function WorkTaskCard({
  task,
  showWeekday = false,
}: {
  task: WorkTaskView;
  showWeekday?: boolean;
}) {
  return (
    <article className={`work-card ${task.done ? "is-done" : ""}`}>
      <Link href={`/orders/${task.order_id}`}>
        <div className="order-card-top">
          <div>
            <h3>
              {stepLabel(task.step)} · {task.item_quantity}× {task.item_description}
            </h3>
            <div className="meta">
              {showWeekday ? formatWeekdayTime(task.scheduled_at) : formatTime(task.scheduled_at)}
              {` · ${task.customer_name}`}
              {` · ready ${formatWeekdayTime(task.due_at)}`}
            </div>
          </div>
          <span className={`badge step-${task.step}`}>{stepLabel(task.step)}</span>
        </div>
      </Link>
      <div className="advance">
        <MarkWorkDoneButton taskId={task.id} done={Boolean(task.done)} />
      </div>
    </article>
  );
}
