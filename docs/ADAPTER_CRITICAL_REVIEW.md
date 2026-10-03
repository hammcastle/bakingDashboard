# D1 → Ovenboard critical integration review

This is a code-grounded engineering review, not independent security approval or deployed-system verification. No production adapter exists yet. Reference order-site source remains unchanged at `2f4f3c09632374892b4fc5454c66904e3561ac74`; runtime-only PR #7 is a separate task. Local rehearsal code is fictional-data-only.

## Local gaps found and repaired

- SQLite had no busy timeout. Concurrent processes could fail immediately under a writer lock instead of reconciling a saved reference. `busy_timeout=5000` now bounds contention before WAL startup and BEGIN IMMEDIATE. Multi-process tests cover six same-reference writers, competing approve/decline and closure/approval. This does not provide distributed locking or cross-database atomicity.
- Snapshot validation used regex coercion and invalid-date toISOString exceptions. Runtime string checks, bounded email length and finite calendar validation now reject coercible arrays/null/impossible dates. FULL/reopen requires an actual boolean; the server action requires an explicit 0/1 selection.
- An approved request could record payment after its linked bake order was cancelled or modified. Both instructions and paid now reject when the linked order is missing, cancelled/inquiry, or disagrees on date, fulfillment, amount, customer identity/contact or items. UI shows Needs reconciliation and hides payment controls. Existing paid evidence is retained; this does not imply a refund. Source-managed editing/cancellation synchronization is still a production milestone.
- Retry behavior after approval, reordered payload fields/normalized item whitespace, received-audit insert failure, invalid versions and unknown transitions now have explicit tests. Received-audit failure rolls back intake and leaves a subsequent retry usable. Approval-audit failure already rolls back customer/order/work writes.
- Direct request lookup now uses the indexed reference rather than scanning the entire inbox for every retry/review. The visible inbox is still unpaginated and intended only for the small local fixture rehearsal.

## Required production contract

| Finding | Consequence | Required implementation and acceptance test |
| --- | --- | --- |
| The owner-list API is pending-first `(priority, created_at, id)` pagination, not a change feed | Persisting its cursor as a sync watermark can miss state changes, payments and reordered pending rows | Add an authorized monotonic revision/change feed including lifecycle tombstones, or run full bounded reconciliations of known references. Test changes while paging and recovery after cursor loss. Never describe the existing cursor as exactly-once ingestion. |
| Detail and summary are separate reads | A request can change between list and detail, and older responses may arrive later | Apply full detail only when its authoritative version is newer. Per-reference unique source ID, applied version and projection digest prevent duplicate/regressive updates. Equal version/different snapshot is a conflict requiring reconciliation. |
| D1 approval and SQLite bake projection cannot share a transaction | A crash can leave an approved request without a bake order | Keep D1 approval authoritative. Transactionally upsert source mapping, bake order/items/work and local applied checkpoint. Retry the same reference after loss; show approved / bake-plan sync pending until projected. Test both crash windows and replay. |
| Current D1 schema has requested_date, not an agreed readiness/pickup time | Ovenboard needs a local due timestamp to back-schedule work | Add reviewed owner-agreed time/timezone metadata with audit/version, or an explicitly owned production appointment relation. Never silently choose 10:00 from the fixture. Confirm business America/Los_Angeles and pickup/delivery meaning. Test timezone/DST and lead-time boundaries. |
| Current authority exposes approve/decline/payment/full but no fulfillment/cancellation lifecycle API | Direct Ovenboard cancellation/edit can leave authority approved, pricing/contact/date stale, or paid commitments ambiguous | Add one authoritative audited lifecycle/field-ownership contract. Pending→approved/declined, payment and fulfillment remain separate. Treat cancel/refund independently; no automatic refund or paid inference. Protect source-managed fields on the bake-order editor. |
| Cloudflare owner JWT verifier requires signed user identity with email/sub/audience/issuer | A generic service token or plain email header is not automatically compatible | Prefer protected same-origin owner pages/API under an approved gateway, or design a separately reviewed scoped adapter identity endpoint. Authenticate every page/action and verify owner identity at each mutation; do not relax Origin/JWT checks to connect cross-origin clients. Test wrong/missing/expired/audience tokens, alternate hosts and forged headers. |
| Public intake owns catalog validation, amounts and idempotency | Reconstructing public requests from free-text Ovenboard lines can lose options, totals or replay semantics | Preserve full server-priced catalog snapshot, options/inclusions/flavor/contact preference, source ID/version and original retry contract. Fixture normalization is not a real catalog validator. No ingestion using browser-submitted authority IDs. |
| FULL dates and numerical capacity must be authoritative | A stale locally reopened date or concurrent approval can oversell | Send date/review mutations only to authority; show source freshness. Check capacity within the authority's serialized approval transaction. Closing preserves existing commitments and lists affected orders. Test close/approve and competing-capacity races on actual D1. |
| Alerts already have a leased outbox and provider idempotency | A second Ovenboard notifier could duplicate messages; provider acceptance is not delivery | Reuse authority jobs, recipient and stable provider keys; expose queue/accepted/failed distinctly. Add audit for manual retry/reconciliation. Verify exact From/Reply-To, actual Gmail arrival, bounce/outage recovery and retention after separately approved tests. |
| Contact copies exist in both stores/backups | Deleting one row does not satisfy retention obligations | Define minimal necessary projection fields, retention/deletion of snapshots/audit/backup references, protected access, encrypted transport and backup restore. Never include customer contact in alerts, public receipt enumeration, logs or screenshots. |

## Dependency repair

The inherited lockfile installed Next 15.5.24 and PostCSS 8.4.31. Four PostCSS advisories covered two high file/source-map disclosure findings and two moderate XSS/incomplete-fix findings; npm aggregated them as PostCSS high plus Next moderate via PostCSS. The highest required patched version among those advisories is 8.5.23.

Added only `overrides.next.postcss = 8.5.23`; lockfile changes one package's version/official-registry integrity and its declared transitive ranges. Existing transitive package versions and Next/React versions stay unchanged. Official registry tarball: `https://registry.npmjs.org/postcss/-/postcss-8.5.23.tgz`. Integrity: `sha512-g50586zr4bZmwFiTlflMu8E0bDTb5I5gertgwAKmsdUlTQIhZtunzUlD1WSzwcVWPoAVpsrA6vlfCD7oXvRwgg==`.

Post-change npm audit reports zero known vulnerabilities. This is dependency evidence, not proof of production security or complete threat coverage. No major Next upgrade was necessary for these advisories. Revisit the override when a compatible maintained Next release embeds the patched dependency; do not remove it merely to silence override metadata.

Official advisories:

- https://github.com/advisories/GHSA-qx2v-qp2m-jg93 (moderate, patched 8.5.10)
- https://github.com/advisories/GHSA-6g55-p6wh-862q (high, patched 8.5.12)
- https://github.com/advisories/GHSA-r28c-9q8g-f849 (high, patched 8.5.18)
- https://github.com/advisories/GHSA-fxqj-rqcc-2cmp (moderate, patched 8.5.23)

## Remaining choices and gates

Essential owner choices before production: who may administer (Cassandra/Joshua identities), agreed readiness/pickup/delivery time and service policy, daily/product capacity and override rules, payment verification/cancellation/refund rules. Engineering should then specify the protected gateway/adapter and lifecycle contract for review rather than ask the owner to choose low-level database mechanics.

Deployment/exposure, resource/migration/access-policy creation, credentials, notifications and real customer migration remain separate approval gates. The Library helper upload remains blocked and must not be bypassed. Keep the local ZIP/screenshots for supported delivery later. No production changes were made by this review.
