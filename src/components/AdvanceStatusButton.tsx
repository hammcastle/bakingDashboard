import { setOrderStatusAction } from "@/lib/actions";
import type { OrderStatus } from "@/lib/types";

export function AdvanceStatusButton({
  orderId,
  status,
  label,
}: {
  orderId: number;
  status: OrderStatus;
  label: string;
}) {
  return (
    <form action={setOrderStatusAction.bind(null, orderId, status)}>
      <button className="btn btn-small btn-wide" type="submit">
        {label}
      </button>
    </form>
  );
}
