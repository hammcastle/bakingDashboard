import { setWorkTaskDoneAction } from "@/lib/actions";

export function MarkWorkDoneButton({ taskId, done }: { taskId: number; done: boolean }) {
  return (
    <form action={setWorkTaskDoneAction.bind(null, taskId, !done)}>
      <button className={`btn btn-small btn-wide ${done ? "btn-ghost" : ""}`} type="submit">
        {done ? "Undo" : "Mark done"}
      </button>
    </form>
  );
}
