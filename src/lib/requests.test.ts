import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { closeDb, getDb, getOrder, listWorkForOrder, updateOrder, updateOrderStatus } from "./db";
import { closedDates, ingestFixture, listRequests, requestFulfillment, requestHistory, reviewRequest, setRequestDate, type RequestSnapshot } from "./requests";
import { localRequestAccess } from "./request-access";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ovenboard-requests-"));
process.env.BAKERY_DB_PATH = path.join(dir, "requests.db");
process.env.BAKERY_SKIP_SEED = "1";
const snapshot = (reference: string): RequestSnapshot => ({ reference, customer: { name: "Fixture Test Customer", email: "fixture@example.com" }, due_at: "2099-11-12T10:00", fulfillment: "pickup", items: [{ description: "Sourdough loaf", quantity: 2 }], total_cents: 1800 });
after(() => { closeDb(); fs.rmSync(dir, { recursive: true, force: true }); });

test("ingestion is durable, does not schedule work and retries the same reference", () => {
  const row = ingestFixture(snapshot("demo-retry"));
  assert.equal(row.state, "pending");
  assert.equal(row.order_id, null);
  assert.equal((getDb().prepare("SELECT COUNT(*) n FROM orders").get() as { n: number }).n, 0);
  closeDb();
  assert.equal(ingestFixture(snapshot("demo-retry")).reference, row.reference);
  assert.equal(requestHistory(row.reference).length, 1);
  assert.throws(() => ingestFixture({ ...snapshot(row.reference), total_cents: 900 }), /different contents/);
});
test("closed dates block new requests and approval while saved retries reconcile", () => {
  setRequestDate("2099-11-12", true, "test owner");
  assert.throws(() => ingestFixture(snapshot("demo-full")), /full/);
  assert.equal(ingestFixture(snapshot("demo-retry")).reference, "demo-retry");
  assert.throws(() => reviewRequest("demo-retry", 1, "approve", "test owner"), /full/);
  assert.equal(listRequests()[0].version, 1);
  setRequestDate("2099-11-12", false, "test owner");
  assert.deepEqual(closedDates(), []);
});
test("approval creates one bake order; stale or repeated reviews cannot create another", () => {
  const row = reviewRequest("demo-retry", 1, "approve", "test owner");
  assert.equal(getOrder(row.order_id!)?.status, "confirmed");
  assert.ok(listWorkForOrder(row.order_id!).length > 0);
  assert.equal(row.payment, "not_requested");
  assert.throws(() => reviewRequest(row.reference, 1, "approve", "other owner"), /changed/);
  assert.throws(() => reviewRequest(row.reference, 2, "approve", "test owner"), /reviewed/);
});
test("payment instructions do not mark paid; paid needs evidence and approval", () => {
  assert.throws(() => reviewRequest("demo-retry", 2, "paid", "test owner"), /evidence/);
  const instructions = reviewRequest("demo-retry", 2, "instructions", "test owner", "Manual payment handoff to be reviewed");
  assert.equal(instructions.payment, "instructions_ready");
  const paid = reviewRequest("demo-retry", 3, "paid", "test owner", "Fixture payment independently checked");
  assert.equal(paid.payment, "paid");
  assert.equal(requestHistory(paid.reference).at(-1)?.note, "Fixture payment independently checked");
});
test("declined requests have no order and cannot receive payment instructions", () => {
  const row = ingestFixture(snapshot("demo-decline"));
  assert.throws(() => reviewRequest(row.reference, 1, "instructions", "test owner", "note"), /Approve/);
  const declined = reviewRequest(row.reference, 1, "decline", "test owner");
  assert.equal(declined.order_id, null);
  assert.throws(() => reviewRequest(row.reference, 2, "paid", "test owner", "note"), /approved/);
});
test("closing a date preserves an approved order and its payment evidence", () => {
  const row = listRequests().find(row => row.reference === "demo-retry")!;
  setRequestDate("2099-11-12", true, "test owner");
  assert.equal(getOrder(row.order_id!)?.status, "confirmed");
  assert.equal(listRequests().find(request => request.reference === row.reference)?.payment, "paid");
  setRequestDate("2099-11-12", false, "test owner");
});
test("elapsed requested times cannot be approved", () => {
  const row = ingestFixture({ ...snapshot("demo-past"), due_at: "2000-01-01T10:00" });
  assert.throws(() => reviewRequest(row.reference, 1, "approve", "test owner"), /passed/);
  assert.equal(listRequests().find(request => request.reference === row.reference)?.order_id, null);
});
test("audit failure rolls back approval, customer, order and work atomically", () => {
  ingestFixture(snapshot("demo-rollback"));
  const before = (getDb().prepare("SELECT COUNT(*) n FROM orders").get() as { n: number }).n;
  assert.throws(() => reviewRequest("demo-rollback", 1, "approve", ""), /review details/);
  assert.equal(listRequests().find(row => row.reference === "demo-rollback")?.state, "pending");
  assert.equal((getDb().prepare("SELECT COUNT(*) n FROM orders").get() as { n: number }).n, before);
});
test("malformed quantities, dates and real contacts are rejected", () => {
  assert.throws(() => ingestFixture({ ...snapshot("demo-bad"), items: [{ description: "Bread", quantity: NaN }] }), /items/);
  assert.throws(() => ingestFixture({ ...snapshot("demo-bad"), due_at: "2099-02-31T10:00" }), /time/);
  assert.throws(() => ingestFixture({ ...snapshot("demo-bad"), customer: { name: "Real Person", email: "real@gmail.com" } }), /fictional/);
});
test("local rehearsal fails closed and requires exact origin for writes", () => {
  delete process.env.OVENBOARD_LOCAL_REQUESTS;
  assert.equal(localRequestAccess("127.0.0.1:3104", "http://127.0.0.1:3104", true), false);
  process.env.OVENBOARD_LOCAL_REQUESTS = "1";
  assert.equal(localRequestAccess("127.0.0.1:3104", "http://127.0.0.1:3104", true), true);
  for (const host of ["hammserver:3104", "evil.example:3104", "127.0.0.1.evil:3104"]) assert.equal(localRequestAccess(host, `http://${host}`, true), false);
  assert.equal(localRequestAccess("localhost:3104", null, true), false);
  assert.equal(localRequestAccess("localhost:3104", "https://evil.example", true), false);
});

test("reordered fields and normalized item whitespace reconcile after approval", () => {
  const original = snapshot("demo-normalized");
  const saved = ingestFixture(original);
  const approved = reviewRequest(saved.reference, 1, "approve", "test owner");
  const retry = ingestFixture({ total_cents: original.total_cents, items: [{ quantity: 2, description: " Sourdough loaf " }], fulfillment: original.fulfillment, due_at: original.due_at, customer: { email: original.customer.email, name: original.customer.name }, reference: original.reference });
  assert.equal(retry.order_id, approved.order_id);
  assert.equal(retry.version, 2);
  assert.equal(requestHistory(retry.reference).length, 2);
  assert.throws(() => ingestFixture({ ...original, items: [{ description: "Different bread", quantity: 2 }] }), /different contents/);
});

test("received audit insert failure rolls back intake and leaves retry usable", () => {
  const db = getDb();
  db.exec("CREATE TRIGGER fail_fixture_received BEFORE INSERT ON request_events WHEN NEW.reference='demo-audit-failure' BEGIN SELECT RAISE(ABORT, 'fixture audit unavailable'); END");
  try {
    assert.throws(() => ingestFixture(snapshot("demo-audit-failure")), /audit unavailable/);
    assert.ok(!listRequests().some(row => row.reference === "demo-audit-failure"));
  } finally { db.exec("DROP TRIGGER fail_fixture_received"); }
  assert.equal(ingestFixture(snapshot("demo-audit-failure")).version, 1);
});

test("cancelled or edited bake orders block payment changes without corrupting history", () => {
  ingestFixture(snapshot("demo-reconcile"));
  const approved = reviewRequest("demo-reconcile", 1, "approve", "test owner");
  updateOrderStatus(approved.order_id!, "cancelled");
  assert.equal(requestFulfillment(approved), "Needs reconciliation");
  assert.throws(() => reviewRequest(approved.reference, 2, "paid", "test owner", "fixture evidence"), /Reconcile/);
  updateOrderStatus(approved.order_id!, "confirmed");
  const original = getOrder(approved.order_id!)!;
  updateOrder(original.id, { ...original, items: original.items, price_cents: 1900 });
  assert.throws(() => reviewRequest(approved.reference, 2, "instructions", "test owner", "fixture note"), /Reconcile/);
  assert.equal(requestHistory(approved.reference).length, 2);
  updateOrder(original.id, { ...original, items: original.items });
  assert.equal(reviewRequest(approved.reference, 2, "paid", "test owner", "fixture verified after reconciliation").payment, "paid");
});

test("invalid runtime field types, impossible dates, versions and transitions fail closed", () => {
  for (const mutation of [{ reference: ["demo-coerced"] }, { customer: { name: ["Fixture Test Customer"], email: "fixture@example.com" } }, { due_at: null }, { due_at: "2099-99-99T10:00" }]) {
    assert.throws(() => ingestFixture({ ...snapshot("demo-invalid"), ...mutation } as unknown as RequestSnapshot));
  }
  assert.throws(() => setRequestDate("2099-99-99", true, "test owner"), /Check date/);
  assert.throws(() => setRequestDate("2099-11-12", "false" as unknown as boolean, "test owner"), /Choose full or reopen/);
  ingestFixture(snapshot("demo-state"));
  for (const version of [NaN, Infinity, 0, -1, 1.1]) assert.throws(() => reviewRequest("demo-state", version, "approve", "test owner"), /changed/);
  assert.throws(() => reviewRequest("demo-state", 1, "invalid" as "approve", "test owner"), /Invalid action/);
  assert.equal(listRequests().find(row => row.reference === "demo-state")?.version, 1);
});
