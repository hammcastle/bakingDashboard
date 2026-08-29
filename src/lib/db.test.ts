import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import assert from "node:assert/strict";
import {
  closeDb,
  commitOrder,
  createCustomer,
  createOrder,
  getCustomer,
  getDb,
  getOrder,
  ensureWorkPlans,
  listCustomers,
  listWorkForOrder,
  nextStatus,
  ordersBetween,
  parsePrice,
  updateCustomer,
  updateOrder,
  updateOrderStatus,
  workBetween,
} from "./db";
import { seedDatabase } from "./seed";
import { groupTodayOrders } from "./board";
import { addDaysKey, atTime, dayEndExclusive, dayStart, todayKey } from "./dates";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ovenboard-"));
process.env.BAKERY_DB_PATH = path.join(dir, "test.db");
process.env.BAKERY_SKIP_SEED = "1";

after(() => {
  closeDb();
  fs.rmSync(dir, { recursive: true, force: true });
});

test("create a customer, order, change status, and see it on the schedule", () => {
  const customer = createCustomer({
    name: "Cassandra Test",
    phone: "555-0001",
    email: "cass@example.com",
    notes: "Prefers Saturday pickup",
  });
  assert.equal(getCustomer(customer.id)?.name, "Cassandra Test");
  assert.equal(listCustomers("cass").length, 1);
  assert.equal(Object.getPrototypeOf(listCustomers()[0]), Object.prototype);

  const due = atTime(todayKey(), 10, 0);
  const order = createOrder({
    customer_id: customer.id,
    due_at: due,
    status: "inquiry",
    fulfillment: "pickup",
    price_cents: parsePrice("24.50"),
    notes: "Dairy-free frosting",
    items: [
      { description: "Vanilla cupcakes", quantity: 12 },
      { description: " ", quantity: 1 },
    ],
  });
  assert.equal(order.customer_name, "Cassandra Test");
  assert.equal(order.items.length, 1);
  assert.equal(order.items[0].description, "Vanilla cupcakes");
  assert.equal(order.price_cents, 2450);

  const baking = updateOrderStatus(order.id, "baking");
  assert.equal(baking.status, "baking");
  assert.equal(nextStatus(baking), "ready");

  const scheduled = ordersBetween(dayStart(todayKey()), dayEndExclusive(todayKey()));
  assert.equal(scheduled.some((row) => row.id === order.id), true);
  assert.equal(scheduled[0].items[0].quantity, 12);
});

test("seed data fills today and tomorrow so the board is not empty", () => {
  closeDb();
  process.env.BAKERY_SKIP_SEED = "1";
  seedDatabase(getDb());
  ensureWorkPlans();
  const today = todayKey();
  const tomorrow = addDaysKey(today, 1);
  const todays = ordersBetween(dayStart(today), dayEndExclusive(today));
  const tomorrows = ordersBetween(dayStart(tomorrow), dayEndExclusive(tomorrow));
  assert.ok(todays.length >= 2, "today should have sample orders");
  assert.ok(tomorrows.length >= 2, "tomorrow should have sample orders");
  assert.ok(listCustomers().length >= 5);
  assert.ok(getOrder(todays[0].id));
  const first = listCustomers()[0];
  updateCustomer(first.id, {
    name: first.name,
    notes: "Updated note",
  });
  assert.equal(listCustomers().find((c) => c.id === first.id)?.notes, "Updated note");
});

test("parsePrice accepts whole amounts and rejects leftover characters", () => {
  assert.equal(parsePrice(""), null);
  assert.equal(parsePrice("24.50"), 2450);
  assert.equal(parsePrice("$1,200.00"), 120000);
  assert.throws(() => parsePrice("12abc"));
  assert.throws(() => parsePrice("12.345"));
});

test("a failed new-person order does not leave an orphan customer", () => {
  const before = listCustomers().length;
  assert.throws(() =>
    commitOrder({
      newCustomer: { name: "Orphan Guest", phone: "555-0999" },
      order: {
        due_at: atTime(todayKey(), 11, 0),
        status: "confirmed",
        fulfillment: "pickup",
        items: [{ description: "   ", quantity: 1 }],
      },
    }),
  );
  assert.equal(listCustomers().length, before);
  assert.equal(listCustomers("Orphan Guest").length, 0);
});

test("today's board hides picked up and delivered orders from pending work", () => {
  const customer = createCustomer({ name: "Done Today" });
  const due = atTime(todayKey(), 15, 0);
  const picked = createOrder({
    customer_id: customer.id,
    due_at: due,
    status: "picked_up",
    fulfillment: "pickup",
    items: [{ description: "Cookies", quantity: 6 }],
  });
  const baking = createOrder({
    customer_id: customer.id,
    due_at: due,
    status: "baking",
    fulfillment: "pickup",
    items: [{ description: "Loaf", quantity: 1 }],
  });
  const grouped = groupTodayOrders([picked, baking]);
  assert.equal(grouped.open.length, 1);
  assert.equal(grouped.baking[0].id, baking.id);
  assert.equal(grouped.due.length, 0);
  assert.equal(
    grouped.open.some((order) => order.status === "picked_up"),
    false,
  );
});

test("Thursday 9am sourdough pickup schedules starter Tuesday 8pm and bake Thursday 7am", () => {
  const customer = createCustomer({ name: "Thursday Loaf" });
  const order = createOrder({
    customer_id: customer.id,
    due_at: "2026-09-03T09:00",
    status: "confirmed",
    fulfillment: "pickup",
    items: [{ description: "Sourdough loaf", quantity: 2 }],
  });
  const tasks = listWorkForOrder(order.id);
  const byStep = Object.fromEntries(tasks.map((task) => [task.step, task.scheduled_at]));
  assert.equal(byStep.starter, "2026-09-01T20:00");
  assert.equal(byStep.form, "2026-09-02T14:00");
  assert.equal(byStep.bake, "2026-09-03T07:00");
  const tuesday = workBetween("2026-09-01T00:00", "2026-09-02T00:00");
  assert.ok(tuesday.some((task) => task.order_id === order.id && task.step === "starter"));

  const moved = updateOrder(order.id, {
    customer_id: customer.id,
    due_at: "2026-09-04T09:00",
    status: "confirmed",
    fulfillment: "pickup",
    items: [{ description: "Sourdough loaf", quantity: 2 }],
  });
  const rebaked = listWorkForOrder(moved.id).find((task) => task.step === "bake");
  assert.equal(rebaked?.scheduled_at, "2026-09-04T07:00");
});

test("cookies skip starter and still get a bake step", () => {
  const customer = createCustomer({ name: "Cookie Tray" });
  const order = createOrder({
    customer_id: customer.id,
    due_at: "2026-09-03T16:00",
    status: "confirmed",
    fulfillment: "pickup",
    items: [{ description: "Chocolate chip cookies", quantity: 12 }],
  });
  const tasks = listWorkForOrder(order.id);
  assert.equal(tasks.some((task) => task.step === "starter"), false);
  assert.ok(tasks.some((task) => task.step === "bake"));
});

test("seed data puts bakery work on the board, not only pickups", () => {
  const today = todayKey();
  const workToday = workBetween(dayStart(today), dayEndExclusive(today));
  assert.ok(workToday.length >= 1, "today should list production steps");
});
