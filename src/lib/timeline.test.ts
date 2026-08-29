import { test } from "node:test";
import assert from "node:assert/strict";
import { addDaysKey, onWeekday, weekKeys } from "./dates";
import {
  groupByDay,
  parseAnchor,
  parseZoom,
  productLine,
  rangeDays,
  rangeHeading,
  rangeLabel,
  shiftAnchor,
} from "./timeline";

test("zoom defaults to week and only accepts day/week/month", () => {
  assert.equal(parseZoom(undefined), "week");
  assert.equal(parseZoom("gantt"), "week");
  assert.equal(parseZoom("day"), "day");
  assert.equal(parseZoom("month"), "month");
});

test("day / week / month are one timeline range, not three calendars", () => {
  const monday = "2026-08-24";
  assert.deepEqual(rangeDays("2026-08-29", "day"), ["2026-08-29"]);
  assert.deepEqual(rangeDays("2026-08-29", "week"), weekKeys("2026-08-29"));
  const month = rangeDays("2026-08-29", "month");
  assert.equal(month.length, 28);
  assert.equal(month[0], monday);
  assert.equal(month[27], "2026-09-20");
});

test("prev/next step by the current zoom unit", () => {
  assert.equal(shiftAnchor("2026-08-29", "day", 1), "2026-08-30");
  assert.equal(shiftAnchor("2026-08-29", "week", -1), "2026-08-22");
  assert.equal(shiftAnchor("2026-08-24", "month", 1), "2026-09-21");
});

test("headings stay kitchen-short", () => {
  const now = new Date(2026, 7, 29);
  assert.equal(rangeHeading(["2026-08-29"], "day", now), "Today");
  assert.equal(rangeHeading(weekKeys("2026-08-29"), "week", now), "This week");
  assert.equal(rangeHeading(rangeDays("2026-09-21", "month"), "month", now), "Further out");
  assert.match(rangeLabel(["2026-08-24", "2026-08-30"]), /Aug/);
});

test("week density groups orders by due day and collapses item lines", () => {
  const grouped = groupByDay(
    [
      { due_at: "2026-09-02T10:30", name: "a" },
      { due_at: "2026-09-02T16:00", name: "b" },
      { due_at: "2026-09-04T09:00", name: "c" },
    ],
    (row) => row.due_at,
  );
  assert.equal(grouped.get("2026-09-02")?.length, 2);
  assert.equal(grouped.get("2026-09-04")?.length, 1);
  assert.equal(
    productLine({
      items: [
        { id: 1, order_id: 1, description: "Croissants", quantity: 24, sort_order: 0 },
        { id: 2, order_id: 1, description: "Muffins", quantity: 12, sort_order: 1 },
      ],
    }),
    "24× Croissants +1",
  );
});

test("onWeekday keeps standing orders on the same weekday", () => {
  assert.equal(onWeekday("2026-08-29", 6, 0), "2026-08-29");
  assert.equal(onWeekday("2026-08-29", 6, 1), "2026-09-05");
  assert.equal(onWeekday("2026-08-29", 1, 0), "2026-08-31");
});

test("parseAnchor rejects junk and keeps a real date", () => {
  assert.equal(parseAnchor("nope", new Date(2026, 7, 29)), "2026-08-29");
  assert.equal(parseAnchor("2026-09-04"), "2026-09-04");
});

test("shiftAnchor stays on the same day-of-week for week and month", () => {
  assert.equal(addDaysKey(shiftAnchor("2026-08-26", "week", 1), -7), "2026-08-26");
});
