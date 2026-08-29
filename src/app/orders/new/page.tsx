import { OrderForm } from "@/components/OrderForm";
import { listCustomers } from "@/lib/db";

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>;
}) {
  const params = await searchParams;
  const customers = listCustomers();
  const customerId = Number(params.customer || 0) || undefined;
  return (
    <main>
      <p className="page-kicker">New order</p>
      <h1 className="page-title">What are we baking?</h1>
      <p className="lede">Takes about a minute. You can add a new customer right here.</p>
      <div className="panel">
        <OrderForm customers={customers} selectedCustomerId={customerId} />
      </div>
    </main>
  );
}
