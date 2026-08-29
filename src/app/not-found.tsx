import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <p className="page-kicker">Missing</p>
      <h1 className="page-title">We could not find that</h1>
      <p className="lede">It may have been removed, or the link is old.</p>
      <Link className="btn" href="/">
        Back to today
      </Link>
    </main>
  );
}
