import Link from "next/link";
import { listCustomers, listOrders } from "@/lib/db";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const customers = listCustomers(params.q || "");

  return (
    <main>
      <div className="row-between">
        <div>
          <p className="page-kicker">Customers</p>
          <h1 className="page-title">People</h1>
        </div>
        <Link href="/customers/new" className="btn btn-copper btn-small">
          + Person
        </Link>
      </div>
      <form className="search" action="/customers">
        <label>
          <span>Search</span>
          <input name="q" type="search" defaultValue={params.q || ""} placeholder="Name, phone, or email" />
        </label>
        <button className="btn btn-ghost btn-small" type="submit" style={{ marginTop: 8 }}>
          Search
        </button>
      </form>
      {customers.length === 0 ? (
        <p className="empty">No one matches. Add a customer to start an order.</p>
      ) : (
        customers.map((customer) => {
          const history = listOrders({ customerId: customer.id });
          const latest = history[history.length - 1];
          return (
            <Link key={customer.id} href={`/customers/${customer.id}`} className="customer-card card">
              <div className="row-between">
                <h3 style={{ margin: 0 }}>{customer.name}</h3>
                <span className="muted">{history.length} order{history.length === 1 ? "" : "s"}</span>
              </div>
              <p className="meta">
                {customer.phone || customer.email || "No contact yet"}
              </p>
              {customer.notes ? <p className="muted">{customer.notes}</p> : null}
              {latest ? (
                <p className="muted">Last due {latest.due_at.slice(0, 10)}</p>
              ) : null}
            </Link>
          );
        })
      )}
    </main>
  );
}
