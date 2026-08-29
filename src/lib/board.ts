import type { OrderStatus, OrderView } from "./types";

const CLOSED: OrderStatus[] = ["picked_up", "delivered", "cancelled"];

export function isOpenStatus(status: OrderStatus): boolean {
  return !CLOSED.includes(status);
}

export function groupTodayOrders(orders: OrderView[]) {
  const open = orders.filter((order) => isOpenStatus(order.status));
  return {
    open,
    baking: open.filter((order) => order.status === "baking"),
    ready: open.filter((order) => order.status === "ready"),
    due: open.filter((order) => order.status !== "baking" && order.status !== "ready"),
  };
}
