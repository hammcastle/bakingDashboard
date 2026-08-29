import type { DayItemTotal } from "@/lib/timeline";

export function DayItemSummary({ items }: { items: DayItemTotal[] }) {
  if (items.length === 0) return null;
  return (
    <div className="day-bake" aria-label="Items to bake">
      <p className="day-bake-kicker">To bake</p>
      <ul className="day-bake-list">
        {items.map((item) => (
          <li key={item.key}>
            <b>{item.quantity}×</b>
            {item.description}
          </li>
        ))}
      </ul>
    </div>
  );
}
