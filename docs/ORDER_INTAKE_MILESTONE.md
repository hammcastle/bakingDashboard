# Ovenboard order intake: local milestone and delivery plan

## Evidence and scope

Ovenboard is **hammcastle/bakingDashboard**, not a separate repository named ovenboard. Isolated clone baseline: `0e7f8447d82cc22825adb7f6bb94cb7d6d370663`. Its README, AGENTS.md, project requirements and architecture were read before edits. No .agents directory exists in the repository. Local Codex memory was consulted; no Ovenboard-specific entry was found. The .buzz skill inventory contains buzz-cli, which is not needed for this implementation.

The existing product is a Next.js 15 / React 19 kitchen board backed by built-in Node SQLite. Preserve Ovenboard/Cassandra branding, paper/cocoa/copper colors, large taps, existing + Order, people, recipes and day/week/month work planning. Existing status is fulfillment-oriented: inquiry, confirmed, baking, ready, picked_up, delivered, cancelled. There is no owner authentication, request API, payment ledger or alert outbox in Ovenboard. No existing Ovenboard deployment was verified; this workspace had no Ovenboard checkout or listener identified on port 3000 during inspection. This is not proof that no deployment exists elsewhere.

Read-only reference clone of **hammcastle/hammmade-order-site** at `2f4f3c09632374892b4fc5454c66904e3561ac74` was inspected, including api/migrations/0001_orders.sql, validation.mjs, store.mjs, outbox.mjs and docs/ORDER_REQUESTS_RELEASE.md. That source already implements catalog-priced pending requests, transactionally saved audit/outbox, versioned approval/payment, closed dates and signed Access owner identity. Its Resend adapter lacks the intended Reply-To; preserve the reviewed candidate fix before activation. No reference source was changed.

The separate runtime task's Ovenboard-integration-constraints.md was also read. Runtime-only draft PR #7 at `4fa55462696ef97d6d7c9d6f0f23c29fefb262ac` is reported by the parent as CI-green and unpublished to production; that is coordination evidence, not a local CI rerun. It does not activate the backend. Live mobile-order and API availability were checked read-only in a separate browser session. No request was submitted to the live site.

## Implemented locally

Fresh read-only browser evidence at 2026-10-03 approximately 03:38 UTC: the public mobile-order loads with its existing Friends & Family title; `/api/config` and `/admin` each return 404. This confirms backend/owner activation remains absent at that check.

`/orders` now links to `/requests`. When explicitly enabled on loopback, the inbox saves a built-in fictional request to the existing SQLite file. Stable `demo-` references and normalized content hashes reconcile retries; changed contents conflict. New request and received event commit together. Reopening SQLite retains them. Pending/declined requests create no customers, bake orders or work tasks.

An owner rehearsal approval checks the latest version and date closure inside BEGIN IMMEDIATE, then commits customer, confirmed order, derived work plan, review state and audit event together. Failures roll everything back. Decline creates no bake order. Preparing payment instructions requires approval and a note, stays unpaid and sends nothing. Recording paid requires explicit evidence; no link or browser return changes payment state. Fulfillment is read from the linked bake order. This is a workflow rehearsal, not a payment integration.

Full/reopen date controls are audited and prevent new local requests and pending approval. Saved retries still reconcile after closure. Existing commitments remain; reopening does not silently change them. There is no numeric capacity, refund workflow, edit/cancellation sync or automated notification delivery in this milestone. Alerts explicitly read disconnected. Date events are stored in SQLite; the screen currently shows per-request history only.

The gate requires `OVENBOARD_LOCAL_REQUESTS=1` and exact localhost/127.0.0.1 Host. Writes also require exact same HTTP Origin. This is **not production authentication** and does not secure the existing unprotected Ovenboard pages. Only built-in fixture-shaped snapshots are accepted. There is no public intake/import endpoint, live synchronization, secret installation, real customer migration or network notification code.

## Run and review

Use an isolated fictional database and bind to loopback explicitly; existing npm scripts bind to all interfaces.

```powershell
npm ci
npm test
npm run build
$env:OVENBOARD_LOCAL_REQUESTS='1'
$env:BAKERY_SKIP_SEED='1'
$env:BAKERY_DB_PATH="$PWD\data\local-rehearsal.db"
node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3104
```

Open `http://127.0.0.1:3104/requests`. Add sample / retry twice: one reference and one received event. Approve: Open bake order shows the existing work plan and the weekly totals. Prepare instructions with a fictional note: it remains unpaid. Mark the requested date full: existing approved order stays. Use a separate fresh fictional database to rehearse pending/full/approval blocking. Do not run npm seed against user data.

This environment's ordinary npm wrapper failed under the sandbox because it selected an inaccessible roaming npm installation. Direct Node invocation of the installed npm/tsx/TypeScript/Next CLIs worked. Tests were run with `node node_modules/tsx/dist/cli.mjs --test src/lib/*.test.ts`; type check with `node node_modules/typescript/bin/tsc --noEmit`. Dependency install and font-fetching build used reviewed escalation. Node here is 25.9.0; Node 26 and minimum supported Node 22 were not tested here.

## Prioritized product and engineering plan

Final reviewed verification: **34/34 tests pass** (17 existing, 14 request behavior, 3 multi-process SQLite races), TypeScript noEmit exits 0, final optimized Next build exits 0, and git diff --check exits 0 (line-ending warnings only). A clean official-registry npm ci succeeds and npm audit reports zero vulnerabilities after the narrow PostCSS override. Phone browser demonstrated saved-reference retry, approve-to-bake-order, instructions-ready/unpaid and persistence after restarting the server. The repaired final build also demonstrated cancellation reconciliation hiding payment controls and recovery after restoring confirmed state. Request/day/week/month fit 390px; request screen also fit 760px. The only local browser console error was the inherited missing favicon (404). No physical-phone, live email, real payment, production identity or remote ingestion test ran.

Evidence under `output/`: test-results.txt, typecheck-results.txt, diff-check.txt, build-results.txt, audit-final.json, dependencies-final.json and genuine Playwright PNGs. The payment viewport and request-reconciliation screenshots are from the reviewed build with PostCSS repaired; pending/instructions/full-page bake-plan images retain the earlier milestone UI evidence. Full-page captures include the app's fixed bottom nav; viewport screenshots show controls without that capture overlap.

| Priority | Deliverable | Acceptance evidence |
| --- | --- | --- |
| P0 — demonstrated locally | Fictional durable inbox → explicit approval → existing bake plan, separate payment status and history | Persistence/retry, closure, stale decision and rollback tests; actual phone-width screenshots |
| P0 — architecture gate | Keep order-site D1 as authority for request reference, catalog snapshot, review/version, payment, closed dates and alert jobs; Ovenboard owns production task progress | Signed-off mapping and identity boundary; no dual-write decision authority |
| P1 — protected integration | Authenticate every owner page/action; approved same-origin reverse proxy/gateway or separately reviewed server adapter; preserve JWT/allowlist/Origin checks | Authorized staging demonstrates expired/wrong-audience/forged identity rejection, alternate origin/asset bypass rejection, least-privilege adapter access |
| P1 — automatic board handoff | Read authoritative pending inbox; review/payment/date mutations go to the existing API. Project approved orders into SQLite using unique source reference + source version | Lost response/replay creates exactly one bake order; approved snapshot options/contact/date/amount preserved; stale edits reject; reconciliation survives restart |
| P1 — operational alerts | Reuse existing outbox; exact From baking-orders@hammstead.com and Reply-To/owner recipient jmhamm2000@gmail.com; visible queued/accepted/failed and manual recovery | Approved fictional email test proves provider acceptance AND actual Gmail arrival; retry/outage/bounce rehearsal, owner fallback and monitoring |
| P1 — availability | Confirm business timezone America/Los_Angeles, five-day lead time, pickup/delivery policy, numeric daily/product capacity and owner overrides | Public availability and owner review agree; full/approval and capacity races tested; existing commitments shown before closing |
| P2 — dependable kitchen UX | Pending badge, review filters, upcoming workload, allergy/fulfillment notes, clear unpaid states and mobile quick actions | Cassandra/Joshua complete request-to-pickup rehearsal on a physical phone; day/week/month and offline/error states remain usable |
| P2 — recovery and lifecycle | Changes/cancellations/refunds, retention/deletion, backups/restore, immutable authority history and projection reconciliation | Restore/replay reproduces board without duplicate orders; deletion handles contact snapshots, audits, backups and minimum necessary retention |
| P3 — refinements after real operation | Business-approved recipe timing, volume/capacity insights and repeat-customer shortcuts | Improvements grounded in owner use; preserve existing kitchen scope rather than add inventory/accounting/AI features speculatively |

Map authority `pending/approved/declined` separately from payment `not_requested/instructions_ready/paid/refunded` and Ovenboard fulfillment `confirmed/baking/ready/picked_up/delivered/cancelled`. Request submission is never a confirmed fulfillment commitment. For public orders, approval is authoritative API state, not Ovenboard's existing one-tap inquiry advance. Local fixture tables and demo owner actions must not be connected to real traffic. Replace the rehearsal repository calls with the reviewed authority adapter; do not promote the fixture database as a second live order authority.

The future SQLite projection should store immutable authority reference, applied source version and an approved reconciliation checkpoint, and should never deduplicate customers by name. The existing pending-first API browsing cursor is not a change-feed checkpoint. Retain server-priced line details (flavor/options/inclusions), agreed due time and timezone, contact preference, and notes rather than flattening real orders into the current minimal fixture snapshot. Existing Ovenboard order edits need an explicit policy for source-managed fields, and completion/cancellation must synchronize through one authorized lifecycle path. Draft/approved/payment/fulfillment remain independent. See [ADAPTER_CRITICAL_REVIEW.md](ADAPTER_CRITICAL_REVIEW.md) for gaps, repairs and concrete adapter acceptance tests.

## Exact approval gates and remaining blockers

Joshua authorized publishing this milestone as a draft PR in hammcastle/bakingDashboard. Merge, deployment, production exposure and integration remain unapproved. Latest remote main was fetched and still matches the inspected baseline. Before publication, no Actions workflows, active repository webhooks, GitHub deployments or Pages site were found in Ovenboard. The new validation-only workflow runs tests/types/build/audit on pull requests and manual invocation with read-only permissions; it has no deployment step. The separate order-site runtime PR remains independent, and its main deployment workflow is not changed.

Before production: identify actual Ovenboard host/reverse proxy/domain and identity owner; approve protected owner exposure and server integration. Separately approve Cloudflare D1 provisioning/migrations, Access policies, rate limiting/quotas, scheduled outbox and server secret installation. The privately created Resend key is not installed here and was never requested or read. Separately approve test recipient, sender and fictional notification content before any email/SMS. Real customer transfer and retention policy need separate authorization. Launch requires staged end-to-end evidence and explicit enable/deployment approval with rollback and monitoring owner.

The inherited PostCSS advisories were repaired locally with only `overrides.next.postcss = 8.5.23`; Next stays 15.5.24 and React/React DOM stay 19.2.8. Clean install and registry audit now report zero known vulnerabilities; no major framework upgrade was necessary. One initial clean-install attempt failed because the running preview held the Windows SWC binary; stopping that process resolved the lock and the clean install/checks were rerun successfully. Production auth, cross-origin integration, staging D1, alerts, actual inbox delivery, capacity policy, physical phone, Node 26/22 compatibility, backup restore and privacy retention remain unverified. This milestone is not production ready. The required Library helper stopped before upload with prepare_uploads unavailable; no Library IDs were returned and that path was not bypassed.
