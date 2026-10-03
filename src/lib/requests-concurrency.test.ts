import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { closeDb, getDb } from "./db";
import { closedDates, ingestFixture, listRequests, requestHistory, type RequestSnapshot } from "./requests";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ovenboard-races-"));
process.env.BAKERY_DB_PATH = path.join(dir, "races.db");
process.env.BAKERY_SKIP_SEED = "1";
const snapshot = (reference: string): RequestSnapshot => ({ reference, customer: { name: "Fixture Race Customer", email: "race@example.com" }, due_at: "2099-12-12T10:00", fulfillment: "pickup", items: [{ description: "Bread", quantity: 1 }], total_cents: 900 });
after(() => { closeDb(); fs.rmSync(dir, { recursive: true, force: true }); });

function worker(operation: string, reference: string): Promise<{ ok: boolean; error?: string }> {
  // Separate processes and connections exercise actual SQLite write contention.
  const script = `import { ingestFixture, reviewRequest, setRequestDate } from './src/lib/requests.ts';
    import { closeDb } from './src/lib/db.ts';
    const { operation, snapshot } = JSON.parse(process.argv[1]);
    try {
      if (operation === 'ingest') ingestFixture(snapshot);
      else if (operation === 'close') setRequestDate(snapshot.due_at.slice(0,10), true, 'race owner');
      else reviewRequest(snapshot.reference, 1, operation, 'race owner');
      console.log(JSON.stringify({ok:true}));
    } catch(error) { console.log(JSON.stringify({ok:false,error:error.message})); }
    finally { closeDb(); }`;
  return new Promise((resolve, reject) => {
    execFile(process.execPath, ["--import", "tsx", "--input-type=module", "-e", script, JSON.stringify({ operation, snapshot: snapshot(reference) })], { cwd: process.cwd(), env: process.env, timeout: 15000 }, (error, stdout) => {
      if (error) reject(error);
      else { try { resolve(JSON.parse(stdout.trim())); } catch(cause) { reject(cause); } }
    });
  });
}

test("six competing ingestion processes save exactly one request and one received event", async () => {
  listRequests(); closeDb();
  const results = await Promise.all(Array.from({ length: 6 }, () => worker("ingest", "demo-concurrent-ingest")));
  assert.ok(results.every(result => result.ok), JSON.stringify(results));
  assert.equal(listRequests().filter(row => row.reference === "demo-concurrent-ingest").length, 1);
  assert.equal(requestHistory("demo-concurrent-ingest").length, 1);
  assert.equal((getDb().prepare("SELECT COUNT(*) n FROM orders").get() as { n: number }).n, 0);
});

test("competing approve and decline commits one decision without duplicate orders", async () => {
  ingestFixture(snapshot("demo-concurrent-review")); closeDb();
  const results = await Promise.all([worker("approve", "demo-concurrent-review"), worker("decline", "demo-concurrent-review")]);
  assert.equal(results.filter(result => result.ok).length, 1, JSON.stringify(results));
  assert.match(results.find(result => !result.ok)?.error || "", /changed/);
  const row = listRequests().find(row => row.reference === "demo-concurrent-review")!;
  assert.equal(row.version, 2);
  assert.equal(requestHistory(row.reference).length, 2);
  assert.equal((getDb().prepare("SELECT COUNT(*) n FROM orders").get() as { n: number }).n, row.state === "approved" ? 1 : 0);
});

test("date closure competing with approval preserves only the serialized commitment", async () => {
  ingestFixture(snapshot("demo-concurrent-full")); closeDb();
  const results = await Promise.all([worker("approve", "demo-concurrent-full"), worker("close", "demo-concurrent-full")]);
  assert.equal(results[1].ok, true, JSON.stringify(results));
  assert.ok(closedDates().includes("2099-12-12"));
  const row = listRequests().find(row => row.reference === "demo-concurrent-full")!;
  assert.equal(row.state, results[0].ok ? "approved" : "pending");
  if (!results[0].ok) assert.match(results[0].error || "", /full/);
  assert.equal(requestHistory(row.reference).length, results[0].ok ? 2 : 1);
});
