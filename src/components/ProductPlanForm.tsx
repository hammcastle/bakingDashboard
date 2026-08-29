import { saveProductPlanAction } from "@/lib/actions";
import type { ProductPlan } from "@/lib/types";

function hoursValue(value: number | null): string {
  return value == null ? "" : String(value);
}

export function ProductPlanForm({ plan }: { plan: ProductPlan }) {
  return (
    <form action={saveProductPlanAction} className="form-grid">
      <input type="hidden" name="id" value={plan.id} />
      <p className="muted">
        Hours before pickup. Leave blank to skip a step. Matches: {plan.match_words || "default for anything else"}
        {plan.is_default ? " · default plan" : ""}.
      </p>
      <div className="hours-grid">
        <label>
          <span>Starter</span>
          <input name="starter_hours" type="number" min="0" step="0.25" defaultValue={hoursValue(plan.starter_hours)} />
        </label>
        <label>
          <span>Mix</span>
          <input name="mix_hours" type="number" min="0" step="0.25" defaultValue={hoursValue(plan.mix_hours)} />
        </label>
        <label>
          <span>Form</span>
          <input name="form_hours" type="number" min="0" step="0.25" defaultValue={hoursValue(plan.form_hours)} />
        </label>
        <label>
          <span>Proof</span>
          <input name="proof_hours" type="number" min="0" step="0.25" defaultValue={hoursValue(plan.proof_hours)} />
        </label>
        <label>
          <span>Bake</span>
          <input name="bake_hours" type="number" min="0" step="0.25" defaultValue={hoursValue(plan.bake_hours)} />
        </label>
      </div>
      <button className="btn btn-ghost btn-small" type="submit">
        Save timings
      </button>
    </form>
  );
}
