"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main>
      <p className="page-kicker">Something went wrong</p>
      <h1 className="page-title">Could not save that</h1>
      <p className="lede">{error.message || "Please try again."}</p>
      <button className="btn" type="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
