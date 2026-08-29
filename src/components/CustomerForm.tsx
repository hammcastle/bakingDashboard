import { saveCustomerAction } from "@/lib/actions";
import type { Customer } from "@/lib/types";

export function CustomerForm({ customer }: { customer?: Customer }) {
  return (
    <form action={saveCustomerAction} className="form-grid">
      {customer ? <input type="hidden" name="id" value={customer.id} /> : null}
      <label>
        <span>Name</span>
        <input name="name" type="text" required defaultValue={customer?.name} placeholder="Name" />
      </label>
      <div className="grid-2">
        <label>
          <span>Phone</span>
          <input name="phone" type="tel" inputMode="tel" defaultValue={customer?.phone} placeholder="Phone" />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" defaultValue={customer?.email} placeholder="Email" />
        </label>
      </div>
      <label>
        <span>Notes</span>
        <textarea
          name="notes"
          defaultValue={customer?.notes}
          placeholder="Allergies, standing orders, how they like to be contacted…"
        />
      </label>
      <div className="sticky-save">
        <button className="btn btn-copper btn-wide" type="submit">
          {customer ? "Save customer" : "Add customer"}
        </button>
      </div>
    </form>
  );
}
