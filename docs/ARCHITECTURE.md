# Architecture

Facts about the code as it exists. If this file and the code disagree, the code wins — update this file.

## Stack

| Piece | Choice |
| --- | --- |
| UI | Next.js 15 App Router, React 19, TypeScript |
| Styling | one file, `src/app/globals.css` (paper / cocoa / copper). No Tailwind. |
| Data | SQLite via `node:sqlite` (`DatabaseSync`) |
| Mutations | Server Actions in `src/lib/actions.ts` |
| Tests | `node:test` through `tsx --test src/lib/*.test.ts` |
| Host | single process, `next dev` / `next start` on `0.0.0.0:3000` |

`src/lib/sqlite.ts` opens the file, enables foreign keys, WAL, and wraps transactions. **`plainRow` / `plainRows` are required** — `node:sqlite` rows have a null prototype and Next.js cannot pass them to Client Components.

## Screens (bottom nav)

| Route | Nav label | Job |
| --- | --- | --- |
| `/` | Today | Kitchen board: work today, baking, ready, other pickups, tomorrow peek |
| `/schedule` | Week | One timeline. Default zoom is week. `?zoom=day\|week\|month&from=YYYY-MM-DD` |
| `/orders` | Orders | Filterable list (`active` default) |
| `/orders/new`, `/orders/[id]` | — | Create / edit |
| `/customers`, `/customers/new`, `/customers/[id]` | People | Directory |
| `/recipes` | Recipes | Edit hour offsets. Not a formula book. |

Header brand + **+ Order** live in `src/components/Header.tsx`.

## Data model

Created in `migrate()` in `src/lib/db.ts`. No extra migration runner.

**customers** — `name`, `phone`, `email`, `notes`, `created_at`

**orders** — `customer_id`, `due_at`, `status`, `fulfillment`, `price_cents` (nullable), `notes`, timestamps

Statuses: `inquiry`, `confirmed`, `baking`, `ready`, `picked_up`, `delivered`, `cancelled`

Fulfillment: `pickup` | `delivery`. Ready + pickup → picked up; ready + delivery → delivered (`nextStatus`).

**order_items** — `order_id`, `description` (free text), `quantity` (real), `sort_order`

There is no products table. Item names are whatever was typed. Week bake totals group by trimmed, case-insensitive `description`.

**product_plans** — `name`, `match_words` (comma list), `is_default`, and nullable `*_hours` for starter / mix / form / proof / bake. Hours are **hours before pickup**. `null` skips that step (cookies skip starter).

Defaults live in `src/lib/plan.ts` (`DEFAULT_PRODUCT_PLANS`). First empty DB gets them. Sourdough is the default plan (`is_default`). Matching is keyword-in-description; first non-default hit wins, else default.

**work_tasks** — `order_id`, `item_id`, `step`, `scheduled_at`, `done`, `sort_order`

Rebuilt whenever an order’s items or due time change (`rebuildWorkForOrder`), and when a recipe row is saved (`rebuildAllWorkPlans`). `getDb()` also backfills orders that have no tasks yet.

## Date and range rules

All helpers are in `src/lib/dates.ts`.

- Week is **Monday–Sunday** (`weekKeys`)
- Month zoom is **28 days** starting that week’s Monday, not a calendar month
- `ordersBetween` / `workBetween` use half-open `[start, end)`
- Schedule queries drop cancelled orders; work queries also drop picked up / delivered
- Today board hides picked up / delivered / cancelled from the pending columns (`isOpenStatus` in `src/lib/board.ts`)

## Key files

| File | Role |
| --- | --- |
| `src/lib/db.ts` | schema, CRUD, work rebuild, queries |
| `src/lib/types.ts` | TypeScript shapes |
| `src/lib/dates.ts` | local stamps and labels |
| `src/lib/timeline.ts` | zoom, ranges, `productLine`, `summarizeDayItems` |
| `src/lib/plan.ts` | product families, matching, step offsets |
| `src/lib/board.ts` | today grouping |
| `src/lib/actions.ts` | form posts |
| `src/lib/seed.ts` | sample book (relative to today) |
| `src/lib/sqlite.ts` | `node:sqlite` wrapper |
| `src/app/schedule/page.tsx` | day / week / month UI |
| `src/components/OrderChip.tsx` | week: who ordered what |
| `src/components/DayItemSummary.tsx` | week: per-day item totals |
| `src/components/WorkTaskCard.tsx` | day / today work step |
| `src/app/globals.css` | all visual language |

## Seed and env

- Empty customer table + `BAKERY_SKIP_SEED` not `1` → `seedDatabase` on first `getDb()`
- `npm run seed` deletes `data/bakery.db` (+ wal/shm) and reloads
- `BAKERY_DB_PATH` points tests at a temp file
- Seed is written so several people order the **same item name on the same day** (today’s sourdough/focaccia, next Thursday’s stacked bake). Keep that if you change seed: week totals should be obvious without scanning names.

## Tests

`src/lib/db.test.ts` — create/update, status, seed fullness, work back-schedule, overlapping seed items.

`src/lib/timeline.test.ts` — zoom math, `productLine`, `summarizeDayItems` (merge + skip cancelled).
