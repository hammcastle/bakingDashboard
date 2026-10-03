import { createHash } from "node:crypto";
import { createCustomer, createOrder, getCustomer, getDb, getOrder } from "./db";
import { plainRows, runTransaction } from "./sqlite";
import type { Fulfillment, OrderItemInput } from "./types";

// Local handoff rehearsal only. Public catalog validation remains in the order-site API.
export type RequestSnapshot = {
  reference: string;
  customer: { name: string; email: string };
  due_at: string;
  fulfillment: Fulfillment;
  items: OrderItemInput[];
  total_cents: number;
};
export type BakeryRequest = {
  reference: string; payload: string; payload_hash: string;
  state: "pending" | "approved" | "declined";
  payment: "not_requested" | "instructions_ready" | "paid";
  version: number; order_id: number | null; created_at: string;
};
type Event = { reference: string | null; kind: string; actor: string; note: string; created_at: string };

function database() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS incoming_requests (
      reference TEXT PRIMARY KEY, payload TEXT NOT NULL, payload_hash TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','approved','declined')),
      payment TEXT NOT NULL DEFAULT 'not_requested' CHECK(payment IN ('not_requested','instructions_ready','paid')),
      version INTEGER NOT NULL DEFAULT 1, order_id INTEGER UNIQUE REFERENCES orders(id), created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS request_events (
      id INTEGER PRIMARY KEY, reference TEXT REFERENCES incoming_requests(reference),
      kind TEXT NOT NULL, actor TEXT NOT NULL, note TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS request_closed_dates (date TEXT PRIMARY KEY);
  `);
  return db;
}
function event(reference: string | null, kind: string, actor: string, note = "") {
  if (!actor.trim() || actor.length > 100 || note.length > 500) throw new Error("Check review details");
  database().prepare("INSERT INTO request_events(reference,kind,actor,note,created_at) VALUES (?,?,?,?,?)")
    .run(reference, kind, actor, note, new Date().toISOString());
}
function validDate(date: string) {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(date + "T12:00:00Z");
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}
function normalize(input: RequestSnapshot): RequestSnapshot {
  if (!input || typeof input.reference !== "string" || !/^demo-[a-z0-9-]{1,64}$/.test(input.reference)) throw new Error("Local fictional references must start with demo-");
  if (!input.customer || typeof input.customer.name !== "string" || typeof input.customer.email !== "string" || input.customer.email.length > 254 || !/^Fixture [A-Za-z ]{1,60}$/.test(input.customer.name) || !/^[a-z0-9.-]+@example\.com$/.test(input.customer.email)) throw new Error("Use fictional fixture contacts only");
  if (typeof input.due_at !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input.due_at) || !validDate(input.due_at.slice(0,10)) || Number(input.due_at.slice(11,13)) > 23 || Number(input.due_at.slice(14)) > 59) throw new Error("Check requested time");
  if (!["pickup", "delivery"].includes(input.fulfillment)) throw new Error("Check fulfillment");
  if (!Number.isSafeInteger(input.total_cents) || input.total_cents < 0 || input.total_cents > 1000000) throw new Error("Check amount");
  if (!Array.isArray(input.items) || !input.items.length || input.items.length > 20) throw new Error("Check items");
  const items = input.items.map(item => {
    if (!item || typeof item.description !== "string" || !item.description.trim() || item.description.length > 100 || /[\x00-\x1f]/.test(item.description) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) throw new Error("Check items");
    return { description: item.description.trim(), quantity: item.quantity };
  });
  return { reference: input.reference, customer: { name: input.customer.name, email: input.customer.email }, due_at: input.due_at, fulfillment: input.fulfillment, items, total_cents: input.total_cents };
}
export function listRequests(): BakeryRequest[] {
  return plainRows(database().prepare("SELECT * FROM incoming_requests ORDER BY state='pending' DESC, created_at DESC, reference").all() as BakeryRequest[]);
}
export function requestHistory(reference: string): Event[] {
  return plainRows(database().prepare("SELECT reference,kind,actor,note,created_at FROM request_events WHERE reference=? ORDER BY id").all(reference) as Event[]);
}
export function closedDates(): string[] {
  return (database().prepare("SELECT date FROM request_closed_dates ORDER BY date").all() as { date: string }[]).map(row => row.date);
}
function findRequest(reference: string): BakeryRequest | undefined {
  return plainRows(database().prepare("SELECT * FROM incoming_requests WHERE reference=?").all(reference) as BakeryRequest[])[0];
}
export function ingestFixture(input: RequestSnapshot): BakeryRequest {
  const snapshot = normalize(input);
  const payload = JSON.stringify(snapshot);
  const hash = createHash("sha256").update(payload).digest("hex");
  return runTransaction(database(), () => {
    const existing = findRequest(snapshot.reference);
    // Reconcile a saved request even if its date was subsequently closed.
    if (existing) {
      if (existing.payload_hash !== hash) throw new Error("Reference already saved with different contents");
      return existing;
    }
    if (closedDates().includes(snapshot.due_at.slice(0,10))) throw new Error("That date is full");
    database().prepare("INSERT INTO incoming_requests(reference,payload,payload_hash,created_at) VALUES (?,?,?,?)")
      .run(snapshot.reference, payload, hash, new Date().toISOString());
    event(snapshot.reference, "received", "fixture intake");
    return findRequest(snapshot.reference)!;
  });
}
export function setRequestDate(date: string, full: boolean, actor: string) {
  if (!validDate(date)) throw new Error("Check date");
  if (typeof full !== "boolean") throw new Error("Choose full or reopen");
  return runTransaction(database(), () => {
    if (full) database().prepare("INSERT OR IGNORE INTO request_closed_dates(date) VALUES (?)").run(date);
    else database().prepare("DELETE FROM request_closed_dates WHERE date=?").run(date);
    event(null, full ? "date_full" : "date_reopened", actor, date);
  });
}
export function reviewRequest(reference: string, version: number, action: "approve" | "decline" | "instructions" | "paid", actor: string, note = "") {
  return runTransaction(database(), () => {
    const row = findRequest(reference);
    if (!row || row.version !== version) throw new Error("This request changed. Refresh before reviewing");
    const snapshot = JSON.parse(row.payload) as RequestSnapshot;
    let orderId = row.order_id;
    let state = row.state;
    let payment = row.payment;
    if ((action === "instructions" || action === "paid") && row.state === "approved" && requestNeedsReconciliation(row)) throw new Error("Bake order changed or was cancelled. Reconcile it before recording payment");
    if (action === "approve" || action === "decline") {
      if (state !== "pending") throw new Error("Request already reviewed");
      if (action === "approve") {
        if (closedDates().includes(snapshot.due_at.slice(0,10))) throw new Error("That date is full. Reopen it before approval");
        if (snapshot.due_at <= new Date().toLocaleString("sv-SE").replace(" ", "T").slice(0,16)) throw new Error("Requested time has passed");
        const customer = createCustomer(snapshot.customer);
        orderId = createOrder({ customer_id: customer.id, due_at: snapshot.due_at, fulfillment: snapshot.fulfillment, status: "confirmed", price_cents: snapshot.total_cents, items: snapshot.items, notes: `Local request ${reference}; payment tracked in Requests` }).id;
      }
      state = action === "approve" ? "approved" : "declined";
    } else if (action === "instructions") {
      if (state !== "approved" || payment !== "not_requested") throw new Error("Approve before preparing payment instructions");
      if (!note.trim()) throw new Error("Record how instructions will be handed off");
      payment = "instructions_ready";
    } else if (action === "paid") {
      if (state !== "approved" || payment === "paid" || !note.trim()) throw new Error("Record independent payment evidence for an approved request");
      payment = "paid";
    } else throw new Error("Invalid action");
    database().prepare("UPDATE incoming_requests SET state=?,payment=?,order_id=?,version=version+1 WHERE reference=? AND version=?")
      .run(state, payment, orderId, reference, version);
    event(reference, action, actor, note);
    return { ...row, state, payment, order_id: orderId, version: version + 1 };
  });
}
export function requestFulfillment(row: BakeryRequest): string {
  if (row.order_id && requestNeedsReconciliation(row)) return "Needs reconciliation";
  return row.order_id ? getOrder(row.order_id)?.status || "Order unavailable" : "Awaiting review";
}
export function requestNeedsReconciliation(row: BakeryRequest): boolean {
  if (!row.order_id) return row.state === "approved";
  const order = getOrder(row.order_id);
  const snapshot = JSON.parse(row.payload) as RequestSnapshot;
  return !order || order.status === "cancelled" || order.status === "inquiry" || order.due_at !== snapshot.due_at || order.fulfillment !== snapshot.fulfillment || order.price_cents !== snapshot.total_cents || order.customer_name !== snapshot.customer.name || getCustomer(order.customer_id)?.email !== snapshot.customer.email || JSON.stringify(order.items.map(item => ({ description: item.description, quantity: item.quantity }))) !== JSON.stringify(snapshot.items);
}
