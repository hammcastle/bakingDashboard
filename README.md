# Ovenboard

Operations dashboard for **Cassandra's bakery**, used by Joshua Hamm to help her run it.

It tracks customers, orders, and the bake calendar. The week is scheduled as **work** (feed starter, mix, form, proof, bake), not only pickups. It is meant to be used on a phone in a kitchen: large tap targets, a one-tap status advance, and a **+ Order** button on every screen.

## Run locally

Needs Node **22.13+** (Node 26 is fine). There is no native addon to compile.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

First load creates `data/bakery.db` (SQLite) and fills it with sample customers and orders for today, tomorrow, and a few weeks out so the timeline has a real book to zoom.

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
4. See **Today** as the work board, and **Week** as one upcoming timeline. Day / Week / Month changes density: work steps up close, order chips at week, dots and counts at month. Production steps are still counted backward from pickup.

A first-time sourdough order with Thursday 9:00 pickup gets a plan without a recipe: feed starter Tuesday 8:00 PM, form Wednesday 2:00 PM, bake Thursday 7:00 AM. Cookies skip starter. Change the hour offsets on **Recipes** if a formula needs a longer rise. ChatGPT recipe import is still a later hook.

## Stack

- Next.js (App Router) + TypeScript
- SQLite via Node's built-in `node:sqlite` (`data/bakery.db`) — no `better-sqlite3`, no compile step
- Server-rendered pages, no signup, no cloud account

This is the path that works on Joshua's Omarchy box with Node 26.7.0. `npm install` does not need build tools or a downgrade to Node 22.

Single shared app on a laptop or a kitchen iPad is the v1 model. There is no public registration.

## Out of scope (hooks only)

- **Recipes:** `/recipes` holds product timing defaults (hours before pickup). ChatGPT formula import comes later.
- Payments, inventory, accounting, and multi-user auth are not in v1.

## Sample data

On a brand-new database you should see people like Maya Chen, the Parker family, River Cafe, Elena Vasquez, Tom Nguyen, Joshua Hamm, Harbor School, Kim Alvarez, and Benito's Deli. Today and tomorrow are filled so the board is not empty, and standing wholesale / Saturday loaves run a few weeks out so zooming the timeline actually matters.
