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

export const WORK_STEPS = ["starter", "mix", "form", "proof", "bake"] as const;
export type WorkStep = (typeof WORK_STEPS)[number];

export type ProductPlan = {
  id: number;
  name: string;
  match_words: string;
  is_default: number;
  starter_hours: number | null;
  mix_hours: number | null;
  form_hours: number | null;
  proof_hours: number | null;
  bake_hours: number | null;
};

export type WorkTask = {
  id: number;
  order_id: number;
  item_id: number;
  step: WorkStep;
  scheduled_at: string;
  done: number;
  sort_order: number;
};

export type WorkTaskView = WorkTask & {
  customer_name: string;
  item_description: string;
  item_quantity: number;
  due_at: string;
  order_status: OrderStatus;
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
