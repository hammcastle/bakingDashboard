import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { seedDatabase } from "./seed";
import { formatPrice, statusLabel } from "./labels";
import type {
  Customer,
  CustomerInput,
  Order,
  OrderInput,
  OrderItem,
  OrderStatus,
  OrderView,
} from "./types";
import { ORDER_STATUSES } from "./types";

export { formatPrice, statusLabel };

let db: Database.Database | null = null;

export function dbPath(): string {
  return process.env.BAKERY_DB_PATH || path.join(process.cwd(), "data", "bakery.db");
}

export function getDb(): Database.Database {
  if (db) return db;
  const file = dbPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  if (process.env.BAKERY_SKIP_SEED !== "1") {
    const count = db.prepare("SELECT COUNT(*) AS n FROM customers").get() as { n: number };
    if (count.n === 0) seedDatabase(db);
  }
  return db;
}

export function closeDb(): void {
  db?.close();
  db = null;
}

function migrate(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      due_at TEXT NOT NULL,
      status TEXT NOT NULL,
      fulfillment TEXT NOT NULL,
      price_cents INTEGER,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_orders_due_at ON orders(due_at);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
  `);
}

function nowIso(): string {
  return new Date().toISOString();
}

function mapOrder(row: Order & { customer_name: string; customer_phone: string }): OrderView {
  const items = getDb()
    .prepare(
      `SELECT id, order_id, description, quantity, sort_order
       FROM order_items WHERE order_id = ? ORDER BY sort_order, id`,
    )
    .all(row.id) as OrderItem[];
  return { ...row, items };
}

export function listCustomers(search = ""): Customer[] {
  const q = search.trim();
  if (!q) {
    return getDb()
      .prepare("SELECT * FROM customers ORDER BY name COLLATE NOCASE")
      .all() as Customer[];
  }
  const like = `%${q}%`;
  return getDb()
    .prepare(
      `SELECT * FROM customers
       WHERE name LIKE @like OR phone LIKE @like OR email LIKE @like
       ORDER BY name COLLATE NOCASE`,
    )
    .all({ like }) as Customer[];
}

export function getCustomer(id: number): Customer | undefined {
  return getDb().prepare("SELECT * FROM customers WHERE id = ?").get(id) as Customer | undefined;
}

export function createCustomer(input: CustomerInput): Customer {
  const name = input.name.trim();
  if (!name) throw new Error("Customer name is required");
  const info = getDb()
    .prepare(
      `INSERT INTO customers (name, phone, email, notes, created_at)
       VALUES (@name, @phone, @email, @notes, @created_at)`,
    )
    .run({
      name,
      phone: (input.phone || "").trim(),
      email: (input.email || "").trim(),
      notes: (input.notes || "").trim(),
      created_at: nowIso(),
    });
  const customer = getCustomer(Number(info.lastInsertRowid));
  if (!customer) throw new Error("Failed to create customer");
  return customer;
}

export function updateCustomer(id: number, input: CustomerInput): Customer {
  const existing = getCustomer(id);
  if (!existing) throw new Error("Customer not found");
  const name = input.name.trim();
  if (!name) throw new Error("Customer name is required");
  getDb()
    .prepare(
      `UPDATE customers SET name = @name, phone = @phone, email = @email, notes = @notes
       WHERE id = @id`,
    )
    .run({
      id,
      name,
      phone: (input.phone || "").trim(),
      email: (input.email || "").trim(),
      notes: (input.notes || "").trim(),
    });
  return getCustomer(id)!;
}

export function getOrder(id: number): OrderView | undefined {
  const row = getDb()
    .prepare(
      `SELECT o.*, c.name AS customer_name, c.phone AS customer_phone
       FROM orders o JOIN customers c ON c.id = o.customer_id
       WHERE o.id = ?`,
    )
    .get(id) as (Order & { customer_name: string; customer_phone: string }) | undefined;
  return row ? mapOrder(row) : undefined;
}

export function listOrders(filters?: {
  status?: OrderStatus | "active" | "done";
  customerId?: number;
}): OrderView[] {
  const clauses: string[] = [];
  const params: Record<string, number | string> = {};
  if (filters?.customerId) {
    clauses.push("o.customer_id = @customerId");
    params.customerId = filters.customerId;
  }
  if (filters?.status === "active") {
    clauses.push("o.status NOT IN ('picked_up', 'delivered', 'cancelled')");
  } else if (filters?.status === "done") {
    clauses.push("o.status IN ('picked_up', 'delivered', 'cancelled')");
  } else if (filters?.status) {
    clauses.push("o.status = @status");
    params.status = filters.status;
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = getDb()
    .prepare(
      `SELECT o.*, c.name AS customer_name, c.phone AS customer_phone
       FROM orders o JOIN customers c ON c.id = o.customer_id
       ${where}
       ORDER BY o.due_at, o.id`,
    )
    .all(params) as (Order & { customer_name: string; customer_phone: string })[];
  return rows.map(mapOrder);
}

export function ordersBetween(start: string, endExclusive: string, includeCancelled = false): OrderView[] {
  const rows = getDb()
    .prepare(
      `SELECT o.*, c.name AS customer_name, c.phone AS customer_phone
       FROM orders o JOIN customers c ON c.id = o.customer_id
       WHERE o.due_at >= @start AND o.due_at < @end
         AND (@includeCancelled = 1 OR o.status != 'cancelled')
       ORDER BY o.due_at, o.id`,
    )
    .all({
      start,
      end: endExclusive,
      includeCancelled: includeCancelled ? 1 : 0,
    }) as (Order & { customer_name: string; customer_phone: string })[];
  return rows.map(mapOrder);
}

function replaceItems(orderId: number, items: OrderInput["items"]): void {
  const database = getDb();
  database.prepare("DELETE FROM order_items WHERE order_id = ?").run(orderId);
  const insert = database.prepare(
    `INSERT INTO order_items (order_id, description, quantity, sort_order)
     VALUES (@order_id, @description, @quantity, @sort_order)`,
  );
  items
    .filter((item) => item.description.trim())
    .forEach((item, index) => {
      insert.run({
        order_id: orderId,
        description: item.description.trim(),
        quantity: item.quantity > 0 ? item.quantity : 1,
        sort_order: index,
      });
    });
}

export function createOrder(input: OrderInput): OrderView {
  if (!getCustomer(input.customer_id)) throw new Error("Customer not found");
  if (!ORDER_STATUSES.includes(input.status)) throw new Error("Invalid status");
  if (!input.due_at) throw new Error("Due date is required");
  const usableItems = input.items.filter((item) => item.description.trim());
  if (usableItems.length === 0) throw new Error("Add at least one item");
  const ts = nowIso();
  const info = getDb()
    .prepare(
      `INSERT INTO orders (customer_id, due_at, status, fulfillment, price_cents, notes, created_at, updated_at)
       VALUES (@customer_id, @due_at, @status, @fulfillment, @price_cents, @notes, @created_at, @updated_at)`,
    )
    .run({
      customer_id: input.customer_id,
      due_at: input.due_at,
      status: input.status,
      fulfillment: input.fulfillment,
      price_cents: input.price_cents ?? null,
      notes: (input.notes || "").trim(),
      created_at: ts,
      updated_at: ts,
    });
  const id = Number(info.lastInsertRowid);
  replaceItems(id, usableItems);
  const order = getOrder(id);
  if (!order) throw new Error("Failed to create order");
  return order;
}

export function updateOrder(id: number, input: OrderInput): OrderView {
  const existing = getOrder(id);
  if (!existing) throw new Error("Order not found");
  if (!getCustomer(input.customer_id)) throw new Error("Customer not found");
  if (!ORDER_STATUSES.includes(input.status)) throw new Error("Invalid status");
  const usableItems = input.items.filter((item) => item.description.trim());
  if (usableItems.length === 0) throw new Error("Add at least one item");
  getDb()
    .prepare(
      `UPDATE orders
       SET customer_id = @customer_id, due_at = @due_at, status = @status,
           fulfillment = @fulfillment, price_cents = @price_cents, notes = @notes,
           updated_at = @updated_at
       WHERE id = @id`,
    )
    .run({
      id,
      customer_id: input.customer_id,
      due_at: input.due_at,
      status: input.status,
      fulfillment: input.fulfillment,
      price_cents: input.price_cents ?? null,
      notes: (input.notes || "").trim(),
      updated_at: nowIso(),
    });
  replaceItems(id, usableItems);
  return getOrder(id)!;
}

export function updateOrderStatus(id: number, status: OrderStatus): OrderView {
  if (!ORDER_STATUSES.includes(status)) throw new Error("Invalid status");
  const existing = getOrder(id);
  if (!existing) throw new Error("Order not found");
  getDb()
    .prepare("UPDATE orders SET status = @status, updated_at = @updated_at WHERE id = @id")
    .run({ id, status, updated_at: nowIso() });
  return getOrder(id)!;
}

export function nextStatus(order: Pick<Order, "status" | "fulfillment">): OrderStatus | null {
  switch (order.status) {
    case "inquiry":
      return "confirmed";
    case "confirmed":
      return "baking";
    case "baking":
      return "ready";
    case "ready":
      return order.fulfillment === "delivery" ? "delivered" : "picked_up";
    default:
      return null;
  }
}

export function parsePrice(raw: string): number | null {
  const trimmed = raw.trim().replace(/^\$/, "");
  if (!trimmed) return null;
  const value = Number.parseFloat(trimmed);
  if (!Number.isFinite(value) || value < 0) throw new Error("Price must be a number");
  return Math.round(value * 100);
}
