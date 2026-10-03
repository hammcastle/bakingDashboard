import Link from "next/link";
import { headers } from "next/headers";
import { localRequestAccess } from "@/lib/request-access";
import { closedDates, listRequests, requestFulfillment, requestHistory, requestNeedsReconciliation, type RequestSnapshot } from "@/lib/requests";
import { addFixtureAction, requestDateAction, reviewRequestAction } from "@/lib/request-actions";
import { formatPrice } from "@/lib/labels";

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const h = await headers();
  if (!localRequestAccess(h.get("host"), null, false)) return <main><h1 className="page-title">Requests</h1><p>Local request rehearsal is disabled. Public intake and owner login have not been connected.</p></main>;
  const { error } = await searchParams;
  const requests = listRequests();
  const fullDates = closedDates();
  return <main>
    <p className="page-kicker">HammMade Baking Co. · Local rehearsal</p>
    <h1 className="page-title">Requests to review</h1>
    <p className="muted">{requests.filter(row => row.state === "pending").length} waiting · Approval puts an order on the bake plan.</p>
    <aside className="request-notice">Fictional requests only. No customer site connected, emails sent, or payments collected. This local gate is not owner login.</aside>
    {error && <p role="alert" className="request-notice">{error}</p>}
    <form action={addFixtureAction}><button className="btn btn-copper">Add sample request / retry</button></form>
    <section className="order-card request-capacity">
      <h2>Date availability</h2>
      <p className="muted">Full dates block new requests and approvals. Existing orders stay on the board. Numeric capacity is not configured.</p>
      <form action={requestDateAction} className="request-controls">
        <label>Date<input name="date" type="date" required /></label>
        <button className="btn" name="full" value="1">Mark full</button>
        <button className="btn" name="full" value="0">Reopen date</button>
      </form>
      <p>{fullDates.length ? `Full: ${fullDates.join(", ")}` : "No dates marked full"}</p>
    </section>
    {!requests.length && <p className="empty">No requests yet. Add a sample to rehearse review.</p>}
    {requests.map(row => {
      const snapshot = JSON.parse(row.payload) as RequestSnapshot;
      const needsReconciliation = requestNeedsReconciliation(row);
      return <article className="order-card request-card" key={row.reference}>
        <div className="row-between"><h2>{snapshot.customer.name}</h2><span className="chip">{row.state}</span></div>
        <p className="meta">{row.reference} · {snapshot.due_at.replace("T", " at ")} · {snapshot.fulfillment}</p>
        <p className="items-line">{snapshot.items.map(item => `${item.quantity} × ${item.description}`).join(" · ")}</p>
        <p>{formatPrice(snapshot.total_cents)} requested · <strong>{row.payment === "paid" ? "Payment recorded" : row.payment === "instructions_ready" ? "Instructions ready · unpaid" : "Payment not requested"}</strong></p>
        <p className="muted">Alerts: disconnected · Fulfillment: {requestFulfillment(row)}</p>
        {row.order_id && <Link className="text-link" href={`/orders/${row.order_id}`}>Open bake order</Link>}
        <form action={reviewRequestAction} className="request-controls">
          <input name="reference" type="hidden" value={row.reference} /><input name="version" type="hidden" value={row.version} />
          {row.state === "pending" ? <><button className="btn btn-copper" name="action" value="approve">Approve & plan bake</button><button className="btn" name="action" value="decline">Decline</button></> : row.state === "approved" && row.payment !== "paid" && !needsReconciliation ? <>
            <label className="request-note">Handoff or payment evidence<input name="note" maxLength={500} required placeholder="Record a manual handoff or verified payment" /></label>
            {row.payment === "not_requested" && <button className="btn" name="action" value="instructions">Prepare instructions</button>}
            <button className="btn" name="action" value="paid">Record verified payment</button>
          </> : null}
        </form>
        {needsReconciliation && <p role="status" className="request-notice">The bake order changed or was cancelled. Reconcile it before recording payment.</p>}
        <details><summary>Review history · version {row.version}</summary><ol>{requestHistory(row.reference).map((event, index) => <li key={index}>{event.kind} · {event.actor} · {event.created_at}{event.note ? ` · ${event.note}` : ""}</li>)}</ol></details>
      </article>;
    })}
  </main>;
}
