export const ORDER_STATUSES = [
  "inquiry",
  "confirmed",
  "baking",
  "ready",
  "picked_up",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const FULFILLMENTS = ["pickup", "delivery"] as const;
export type Fulfillment = (typeof FULFILLMENTS)[number];

export type Customer = {
  id: number;
  name: string;
  phone: string;
  email: string;
  notes: string;
  created_at: string;
};

export type OrderItem = {
  id: number;
  order_id: number;
  description: string;
  quantity: number;
  sort_order: number;
};

export type Order = {
  id: number;
  customer_id: number;
  due_at: string;
  status: OrderStatus;
  fulfillment: Fulfillment;
  price_cents: number | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type OrderView = Order & {
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
};

export type CustomerInput = {
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
};

export type OrderItemInput = {
  description: string;
  quantity: number;
};

export type OrderInput = {
  customer_id: number;
  due_at: string;
  status: OrderStatus;
  fulfillment: Fulfillment;
  price_cents?: number | null;
  notes?: string;
  items: OrderItemInput[];
};
