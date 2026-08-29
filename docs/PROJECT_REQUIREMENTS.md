# Ovenboard — project requirements

This is the product contract. Match the code in this repo. Do not invent a second product, a backlog process, or stakeholders who are not here.

## What it is

**Ovenboard** is a single-bakery operations dashboard for **Cassandra's bakery**. Joshua Hamm uses it to help her run the shop.

It is one shared app on a laptop or a kitchen iPad. There is no public registration, no multi-tenant SaaS, and no cloud account.

The app tracks:

- **People (customers)** — name, phone, email, notes (allergies, standing prefs, drop instructions)
- **Orders** — who, due date/time, pickup vs delivery, status, optional price, notes, and free-text item lines
- **Production timeline** — work steps (feed starter, mix, form, proof, bake) scheduled backward from pickup
- **Schedule zoom** — one upcoming book at three densities: **day / week / month**

The week is scheduled as **work**, not only pickups. A Thursday 9:00 sourdough pickup already has a plan: starter Tuesday evening, form Wednesday afternoon, bake Thursday morning.

## Who it is for

- **Cassandra** — baker, using it on a phone in the kitchen
- **Joshua** — helps her run the bakery; the person who files product asks

Kitchen-first and phone-usable: large tap targets, a one-tap status advance, **+ Order** on every screen, short copy, no spreadsheet layouts.

## v1 in scope (what exists)

- Customers: list, search, add, edit
- Orders: create (existing person or type a new one), edit, item lines, due stamp, fulfillment, optional price, notes
- Status path: inquiry → confirmed → baking → ready → picked up **or** delivered (or cancelled)
- Today board (`/`): work steps due today, then baking / ready / other pickups, plus a tomorrow peek
- Upcoming timeline (`/schedule`): query `zoom` + `from`
  - **Day:** work steps, then pickup/delivery cards
  - **Week:** per-day **To bake** totals (same item name across people) **and** per-person order chips
  - **Month:** four weeks of marks (dots + order counts)
- Recipes (`/recipes`): hour offsets before pickup per product family. Saving a row rebuilds work tasks.
- Sample seed so today, tomorrow, and a few weeks out are not empty
- Local SQLite file, no signup

## v1 out of scope (do not build unless asked)

- Payments, inventory, accounting, invoicing, tax
- Multi-user auth, roles, login, or a public website
- ChatGPT / AI recipe import (the Recipes page is a hook only)
- Full formula cards, baker's percentages, or a recipe database
- ERP, wholesale portal, customer self-serve, SMS, email blasts
- Native mobile apps
- Turning week view into a spreadsheet
- Extra persisted tables for week summaries — totals come from order line items already on the order

## Hard constraints

- **Node 26 must keep working.** Engines say `>=22.13`. Joshua's box is Node **26.7.0** (Omarchy).
- **SQLite via Node's built-in `node:sqlite` only.** No `better-sqlite3`, no native addon, no compile step. `npm install` must not need build tools or a downgrade to Node 22.
- Dates and times are **local to the machine running the app**, stored as `YYYY-MM-DDTHH:mm`.
- Server-rendered Next.js App Router. `layout.tsx` is `force-dynamic`.
- One database file: `data/bakery.db` (override with `BAKERY_DB_PATH`).

## Product voice

Short, practical, kitchen English. Prefer “To bake” / “Quiet day” over dashboard jargon. If a baker cannot read it at arm’s length on a phone, it is wrong.
