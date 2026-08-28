# Ovenboard

Operations dashboard for **Cassandra's bakery**, used by Joshua Hamm to help her run it.

It tracks customers, orders, and the bake/pickup calendar. It is meant to be used on a phone in a kitchen: large tap targets, a one-tap status advance, and a **+ Order** button on every screen.

## Run locally

Needs Node 20+.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

First load creates `data/bakery.db` (SQLite) and fills it with sample customers and orders for today, tomorrow, and the rest of the week.

```bash
npm test          # data-layer checks
npm run seed      # wipe the database and reload sample data
npm run build && npm start   # production mode
```

Dates and times use the **local timezone of the machine running the app**.

## What you can do

1. Add a customer (People → + Person), with phone/email and notes.
2. Add an order (+ Order): pick an existing person or type a new one, add item lines, due date/time, pickup vs delivery, optional price, dietary/fulfillment notes.
3. Change status from the order card or the order page: inquiry → confirmed → baking → ready → picked up or delivered (or cancelled).
4. See the work on **Today** (including tomorrow at a glance) and **Week**.

## Stack

- Next.js (App Router) + TypeScript
- SQLite via `better-sqlite3` (`data/bakery.db`)
- Server-rendered pages, no signup, no cloud account

Single shared app on a laptop or a kitchen iPad is the v1 model. There is no public registration.

## Out of scope (hooks only)

- **Recipes:** `/recipes` is a placeholder. ChatGPT recipe import comes later.
- Payments, inventory, accounting, and multi-user auth are not in v1.

## Sample data

On a brand-new database you should see people like Maya Chen, the Parker family, River Cafe, Elena Vasquez, Tom Nguyen, and Joshua Hamm, with orders already on today and tomorrow so the board is not empty.
