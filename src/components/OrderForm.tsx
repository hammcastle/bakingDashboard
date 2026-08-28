"use client";

import { useMemo, useState } from "react";
import { saveOrderAction } from "@/lib/actions";
import { ITEM_SUGGESTIONS, statusLabel } from "@/lib/labels";
import { addDaysKey, stampToDateInput, todayKey } from "@/lib/dates";
import { FULFILLMENTS, ORDER_STATUSES, type Customer, type OrderView } from "@/lib/types";

type Line = { description: string; quantity: number };

function defaultDue(): { date: string; time: string } {
  return { date: addDaysKey(todayKey(), 1), time: "10:00" };
}

export function OrderForm({
  customers,
  order,
  selectedCustomerId,
}: {
  customers: Customer[];
  order?: OrderView;
  selectedCustomerId?: number;
}) {
  const initialDue = order ? stampToDateInput(order.due_at) : defaultDue();
  const [mode, setMode] = useState<"existing" | "new">(customers.length && !order ? "existing" : order ? "existing" : "new");
  const [lines, setLines] = useState<Line[]>(
    order?.items.length
      ? order.items.map((item) => ({ description: item.description, quantity: item.quantity }))
      : [{ description: "", quantity: 1 }],
  );

  const sortedCustomers = useMemo(
    () => [...customers].sort((a, b) => a.name.localeCompare(b.name)),
    [customers],
  );

  function setLine(index: number, patch: Partial<Line>) {
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  return (
    <form action={saveOrderAction} className="form-grid">
      {order ? <input type="hidden" name="id" value={order.id} /> : null}

      <div>
        <span className="label">Customer</span>
        <div className="seg" style={{ marginBottom: 10 }}>
          <label>
            <input
              type="radio"
              name="customer_mode"
              checked={mode === "existing"}
              onChange={() => setMode("existing")}
              disabled={sortedCustomers.length === 0}
            />
            <span>Existing</span>
          </label>
          <label>
            <input type="radio" name="customer_mode" checked={mode === "new"} onChange={() => setMode("new")} />
            <span>New person</span>
          </label>
        </div>
        {mode === "existing" ? (
          <select name="customer_id" defaultValue={order?.customer_id || selectedCustomerId || ""} required={mode === "existing"}>
            <option value="">Choose a customer</option>
            {sortedCustomers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="form-grid">
            <label>
              <span>Name</span>
              <input name="new_customer_name" type="text" placeholder="Name" required={mode === "new"} />
            </label>
            <div className="grid-2">
              <label>
                <span>Phone</span>
                <input name="new_customer_phone" type="tel" inputMode="tel" placeholder="Phone" />
              </label>
              <label>
                <span>Email</span>
                <input name="new_customer_email" type="email" placeholder="Email" />
              </label>
            </div>
          </div>
        )}
      </div>

      <div>
        <span className="label">Items</span>
        <div className="chips">
          {ITEM_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="chip"
              onClick={() => {
                setLines((current) => {
                  const blank = current.findIndex((line) => !line.description.trim());
                  if (blank >= 0) {
                    return current.map((line, i) =>
                      i === blank ? { ...line, description: suggestion } : line,
                    );
                  }
                  return [...current, { description: suggestion, quantity: 1 }];
                });
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
        {lines.map((line, index) => (
          <div className="item-row" key={index} style={{ marginBottom: 8 }}>
            <input
              name="item_desc"
              value={line.description}
              onChange={(event) => setLine(index, { description: event.target.value })}
              placeholder="What are you baking?"
            />
            <input
              name="item_qty"
              type="number"
              min="0.5"
              step="0.5"
              value={line.quantity}
              onChange={(event) => setLine(index, { quantity: Number(event.target.value) })}
            />
            <button
              type="button"
              className="btn btn-ghost btn-small"
              aria-label="Remove item"
              onClick={() => setLines((current) => current.filter((_, i) => i !== index))}
              disabled={lines.length === 1}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-ghost btn-small"
          onClick={() => setLines((current) => [...current, { description: "", quantity: 1 }])}
        >
          + Add item
        </button>
      </div>

      <div className="grid-2">
        <label>
          <span>Due date</span>
          <input name="due_date" type="date" defaultValue={initialDue.date} required />
        </label>
        <label>
          <span>Time</span>
          <input name="due_time" type="time" defaultValue={initialDue.time} required />
        </label>
      </div>

      <div>
        <span className="label">Pickup or delivery</span>
        <div className="seg">
          {FULFILLMENTS.map((value) => (
            <label key={value}>
              <input
                type="radio"
                name="fulfillment"
                value={value}
                defaultChecked={(order?.fulfillment || "pickup") === value}
              />
              <span>{value === "pickup" ? "Pickup" : "Delivery"}</span>
            </label>
          ))}
        </div>
      </div>

      <label>
        <span>Status</span>
        <select name="status" defaultValue={order?.status || "confirmed"}>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Price (optional)</span>
        <input
          name="price"
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          defaultValue={order?.price_cents != null ? (order.price_cents / 100).toFixed(2) : ""}
        />
      </label>

      <label>
        <span>Notes</span>
        <textarea
          name="notes"
          placeholder="Dietary needs, door codes, frosting color…"
          defaultValue={order?.notes || ""}
        />
      </label>

      <div className="sticky-save">
        <button className="btn btn-copper btn-wide" type="submit">
          {order ? "Save order" : "Add order"}
        </button>
      </div>
    </form>
  );
}
