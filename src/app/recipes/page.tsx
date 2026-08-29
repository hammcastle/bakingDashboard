import { ProductPlanForm } from "@/components/ProductPlanForm";
import { listProductPlans } from "@/lib/db";

export default function RecipesPage() {
  const plans = listProductPlans();
  return (
    <main>
      <p className="page-kicker">Recipes</p>
      <h1 className="page-title">Recipe box</h1>
      <div className="hook">
        <p>
          ChatGPT formula import comes later. These timings are enough to schedule the week: hours
          before pickup for starter, mix, form, proof, and bake. Saving a row rebuilds open orders.
        </p>
      </div>
      {plans.map((plan) => (
        <article key={plan.id} className="panel recipe-card">
          <h3>{plan.name}</h3>
          <ProductPlanForm plan={plan} />
        </article>
      ))}
    </main>
  );
}
