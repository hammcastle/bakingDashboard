export default function RecipesPage() {
  return (
    <main>
      <p className="page-kicker">Recipes</p>
      <h1 className="page-title">Recipe box</h1>
      <div className="hook">
        <p>
          This is a placeholder for v1. Joshua will connect ChatGPT recipe imports later. Ovenboard
          does not block on that — orders and the schedule work without a recipe library.
        </p>
      </div>
      <article className="panel recipe-card">
        <h3>Sourdough loaf</h3>
        <p className="muted">Hook: paste or import a formula here. Not wired up yet.</p>
      </article>
      <article className="panel recipe-card">
        <h3>Chocolate birthday cake</h3>
        <p className="muted">Hook: scale a recipe to an order quantity later.</p>
      </article>
      <article className="panel recipe-card">
        <h3>Nut-free cookies</h3>
        <p className="muted">Hook: flag dietary recipes against order notes later.</p>
      </article>
    </main>
  );
}
