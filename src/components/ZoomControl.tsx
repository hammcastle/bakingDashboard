import Link from "next/link";
import { scheduleHref, type Zoom } from "@/lib/timeline";

const OPTIONS: { id: Zoom; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

export function ZoomControl({ zoom, from }: { zoom: Zoom; from: string }) {
  return (
    <div className="zoom-seg" role="tablist" aria-label="Timeline zoom">
      {OPTIONS.map((option) => (
        <Link
          key={option.id}
          href={scheduleHref(option.id, from)}
          className={zoom === option.id ? "active" : undefined}
          role="tab"
          aria-selected={zoom === option.id}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}
