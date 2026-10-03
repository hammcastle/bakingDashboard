// Explicitly a local rehearsal gate, not production authentication.
export function localRequestAccess(host: string | null, origin: string | null, mutation: boolean): boolean {
  if (process.env.OVENBOARD_LOCAL_REQUESTS !== "1" || !host || !/^(127\.0\.0\.1|localhost):[0-9]+$/.test(host)) return false;
  return !mutation || origin === `http://${host}`;
}
