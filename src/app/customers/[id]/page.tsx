import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerForm } from "@/components/CustomerForm";
import { OrderCard } from "@/components/OrderCard";
import { getCustomer, listOrders } from "@/lib/db";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = getCustomer(Number(id));
  if (!customer) notFound();
  const orders = listOrders({ customerId: customer.id }).slice().reverse();

  return (
    <main>
      <p className="page-kicker">Customer</p>
      <h1 className="page-title">{customer.name}</h1>
      <div className="panel">
        <p>
          {customer.phone ? <a href={`tel:${customer.phone}`}>{customer.phone}</a> : "No phone"}
          {" · "}
          {customer.email ? <a href={`mailto:${customer.email}`}>{customer.email}</a> : "No email"}
        </p>
        {customer.notes ? <p>{customer.notes}</p> : <p className="muted">No notes yet.</p>}
        <p>
          <Link className="text-link" href={`/orders/new?customer=${customer.id}`}>
            Start an order
          </Link>
        </p>
      </div>
      <h2 className="section-title">Order history</h2>
      {orders.length ? (
        orders.map((order) => <OrderCard key={order.id} order={order} showDate />)
      ) : (
        <p className="muted">No orders yet.</p>
      )}
      <h2 className="section-title">Edit</h2>
      <div className="panel">
        <CustomerForm customer={customer} />
      </div>
    </main>
  );
}
