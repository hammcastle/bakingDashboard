"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createCustomer,
  createOrder,
  parsePrice,
  updateCustomer,
  updateOrder,
  updateOrderStatus,
} from "./db";
import type { Fulfillment, OrderStatus } from "./types";
import { FULFILLMENTS, ORDER_STATUSES } from "./types";

function refresh(): void {
  revalidatePath("/", "layout");
}

function required(formData: FormData, key: string): string {
  const value = String(formData.get(key) || "").trim();
  if (!value) throw new Error(`${key} is required`);
  return value;
}

function optional(formData: FormData, key: string): string {
  return String(formData.get(key) || "").trim();
}

function parseItems(formData: FormData) {
  const descriptions = formData.getAll("item_desc").map((value) => String(value));
  const quantities = formData.getAll("item_qty").map((value) => String(value));
  return descriptions.map((description, index) => ({
    description,
    quantity: Number.parseFloat(quantities[index] || "1") || 1,
  }));
}

function parseStatus(raw: string): OrderStatus {
  if (!ORDER_STATUSES.includes(raw as OrderStatus)) throw new Error("Invalid status");
  return raw as OrderStatus;
}

function parseFulfillment(raw: string): Fulfillment {
  if (!FULFILLMENTS.includes(raw as Fulfillment)) throw new Error("Invalid fulfillment");
  return raw as Fulfillment;
}

export async function saveCustomerAction(formData: FormData): Promise<void> {
  const idRaw = optional(formData, "id");
  const input = {
    name: required(formData, "name"),
    phone: optional(formData, "phone"),
    email: optional(formData, "email"),
    notes: optional(formData, "notes"),
  };
  const customer = idRaw
    ? updateCustomer(Number(idRaw), input)
    : createCustomer(input);
  refresh();
  redirect(`/customers/${customer.id}`);
}

export async function saveOrderAction(formData: FormData): Promise<void> {
  const idRaw = optional(formData, "id");
  let customerId = Number(formData.get("customer_id") || 0);
  const newName = optional(formData, "new_customer_name");
  if (newName) {
    const customer = createCustomer({
      name: newName,
      phone: optional(formData, "new_customer_phone"),
      email: optional(formData, "new_customer_email"),
    });
    customerId = customer.id;
  }
  if (!customerId) throw new Error("Choose a customer");

  const date = required(formData, "due_date");
  const time = required(formData, "due_time");
  const order = {
    customer_id: customerId,
    due_at: `${date}T${time}`,
    status: parseStatus(required(formData, "status")),
    fulfillment: parseFulfillment(required(formData, "fulfillment")),
    price_cents: parsePrice(optional(formData, "price")),
    notes: optional(formData, "notes"),
    items: parseItems(formData),
  };

  const saved = idRaw ? updateOrder(Number(idRaw), order) : createOrder(order);
  refresh();
  redirect(`/orders/${saved.id}`);
}

export async function setOrderStatusAction(orderId: number, status: OrderStatus): Promise<void> {
  updateOrderStatus(orderId, status);
  refresh();
}
