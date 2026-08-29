# Agents

Read these before changing Ovenboard. They replace asking Joshua or Picard how the bakery app works.

1. [docs/PROJECT_REQUIREMENTS.md](docs/PROJECT_REQUIREMENTS.md) — what it is, who it is for, v1 in/out, Node 26 + `node:sqlite`
2. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — stack, tables, screens, key files
3. [README.md](README.md) — human runbook (install, seed, what you can tap)

Do not invent a process, a second product, or features listed as out of scope.

## Run / test / seed

Needs Node **22.13+** (Node **26** is the target). No native addon.

```bash
npm install
npm test
npm run seed          # wipe data/bakery.db and reload sample orders
npm run dev           # http://localhost:3000
npm run build && npm start
```

`data/*.db` is gitignored. First `getDb()` creates and seeds it.

If you change schedule, orders, seed, or work planning, run `npm test`. If you change UI, check the phone-wide layout (max ~760px) and the other zoom levels you did not mean to touch.

## Conventions

- **Kitchen / phone first.** 44px taps, short copy, wrap — do not add dense tables to Week.
- **One CSS file.** Tokens and components live in `src/app/globals.css`.
- **Server-first.** Pages read `src/lib/db.ts`. Writes go through `src/lib/actions.ts`. No client-side database.
- **Always `plainRow` SQLite results** before they cross into the UI (`src/lib/sqlite.ts`).
- **Never add `better-sqlite3`** or any compile-step SQLite binding.
- **Item lines are the product list.** Week bake totals (`summarizeDayItems`) group by item `description`, not by recipe plan. Do not add a new table for those totals.
- **Work is derived.** Change due time, items, or recipe hours → rebuild `work_tasks`. Do not hand-edit schedules in the DB from feature code.
- **Local timestamps** `YYYY-MM-DDTHH:mm`. Use `src/lib/dates.ts`; do not switch the app to UTC.
- **Voice:** baker, not enterprise. Match existing kickers (`Upcoming`, `To bake`, `Quiet day`).

## How to extend

### Orders

1. Types in `src/lib/types.ts` (`Order`, `OrderItem`, `OrderInput`).
2. Persistence and validation in `src/lib/db.ts` (`createOrder` / `updateOrder` / `commitOrder`). Creating or updating items calls `rebuildWorkForOrder`.
3. Form post in `saveOrderAction` (`src/lib/actions.ts`). Fields: `item_desc[]`, `item_qty[]`, `due_date`, `due_time`, `status`, `fulfillment`, `price`, `notes`, plus existing or new customer.
4. UI: `OrderForm`, `OrderCard` (full), `OrderChip` (week, collapsed `productLine`).

Statuses move with `nextStatus` + `setOrderStatusAction`. Do not invent extra status values without updating `ORDER_STATUSES` and labels.

### Schedule (day / week / month)

One page: `src/app/schedule/page.tsx`. Range math is `src/lib/timeline.ts`.

- **Day:** `workBetween` + `WorkTaskCard`, then `OrderCard` for pickups.
- **Week:** `DayItemSummary` (production volume) **above** `OrderChip` (who ordered what). Keep both.
- **Month:** `MonthMarks` only — dots and counts, tap into day.

`?zoom=` and `?from=` are the only schedule state. Prev / Now / Next use `shiftAnchor`. Default zoom is week.

Week summaries stay in memory from `order.items`. Day and month stay as they are unless a tiny consistency tweak is required.

### Production steps

1. Families and keyword match: `src/lib/plan.ts` (`matchProductPlan`, `plannedSteps`).
2. Hours on `/recipes` via `updateProductPlan` — saving rebuilds every order’s tasks.
3. Tasks stored in `work_tasks`, listed by `workBetween` / `listWorkForOrder`.
4. Done flag: `setWorkTaskDoneAction` + `MarkWorkDoneButton`.

To add a step, you must extend `WORK_STEPS`, the `product_plans` columns, `plannedSteps`, the recipe form, and labels. That is a real schema change — do not fake it in the UI only.

To add a product family, add a `DEFAULT_PRODUCT_PLANS` row (and handle existing DBs that already have rows; `ensureDefaultPlans` no-ops when the table is non-empty).

## When you are done

A baker should see the change on a phone without a tutorial. An incoming agent should not need Joshua to explain Ovenboard, the Node 26 / `node:sqlite` rule, or how week zoom differs from day and month.
