import Link from "next/link";

export function Header() {
  return (
    <header className="topbar">
      <Link href="/" className="brand">
        <span className="brand-mark" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 16c0-4.2 2.6-8 7-8s7 3.8 7 8H5Z"
              fill="currentColor"
              opacity="0.95"
            />
            <path d="M4 16.5h16v2.2c0 .7-.6 1.3-1.3 1.3H5.3C4.6 20 4 19.4 4 18.7v-2.2Z" fill="currentColor" />
            <circle cx="9" cy="13.2" r="1" fill="#f3e6d4" />
            <circle cx="12.2" cy="12.4" r="1" fill="#f3e6d4" />
            <circle cx="15.2" cy="13.3" r="1" fill="#f3e6d4" />
          </svg>
        </span>
        <span className="brand-text">
          <strong>Ovenboard</strong>
          <span>Cassandra&apos;s bakery</span>
        </span>
      </Link>
      <Link href="/orders/new" className="btn btn-copper btn-small">
        + Order
      </Link>
    </header>
  );
}
