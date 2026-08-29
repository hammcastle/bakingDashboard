import { CustomerForm } from "@/components/CustomerForm";

export default function NewCustomerPage() {
  return (
    <main>
      <p className="page-kicker">New customer</p>
      <h1 className="page-title">Who is this for?</h1>
      <div className="panel">
        <CustomerForm />
      </div>
    </main>
  );
}
