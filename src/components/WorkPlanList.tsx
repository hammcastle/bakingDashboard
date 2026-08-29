import { formatWeekdayTime } from "@/lib/dates";
import { stepLabel } from "@/lib/plan";
import type { WorkTaskView } from "@/lib/types";
import { MarkWorkDoneButton } from "./MarkWorkDoneButton";

export function WorkPlanList({ tasks }: { tasks: WorkTaskView[] }) {
  if (tasks.length === 0) {
    return <p className="muted">No production steps yet. Add an item and a due time.</p>;
  }
  return (
    <ol className="work-plan">
      {tasks.map((task) => (
        <li key={task.id} className={task.done ? "is-done" : undefined}>
          <div>
            <strong>{stepLabel(task.step)}</strong>
            <div className="meta">
              {formatWeekdayTime(task.scheduled_at)} · {task.item_quantity}× {task.item_description}
            </div>
          </div>
          <MarkWorkDoneButton taskId={task.id} done={Boolean(task.done)} />
        </li>
      ))}
    </ol>
  );
}
