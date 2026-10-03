"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { localRequestAccess } from "./request-access";
import { ingestFixture, reviewRequest, setRequestDate } from "./requests";
import { addDaysKey, todayKey } from "./dates";

async function guard() {
  const h = await headers();
  if (!localRequestAccess(h.get("host"), h.get("origin"), true)) throw new Error("Local request rehearsal is disabled");
}
async function execute(fn: () => void) {
  await guard();
  let error = "";
  try { fn(); } catch (cause) { error = cause instanceof Error ? cause.message : "Could not save. Refresh and retry"; }
  revalidatePath("/", "layout");
  redirect(error ? `/requests?error=${encodeURIComponent(error)}` : "/requests");
}
export async function addFixtureAction() {
  await execute(() => { ingestFixture({
    reference: `demo-bread-${todayKey()}`,
    customer: { name: "Fixture Bread Customer", email: "bakery.fixture@example.com" },
    due_at: `${addDaysKey(todayKey(), 7)}T10:00`, fulfillment: "pickup",
    items: [{ description: "Sourdough loaf", quantity: 2 }], total_cents: 1800,
  }); });
}
export async function reviewRequestAction(form: FormData) {
  await execute(() => { reviewRequest(String(form.get("reference")), Number(form.get("version")), String(form.get("action")) as "approve", "local demo owner", String(form.get("note") || "")); });
}
export async function requestDateAction(form: FormData) {
  await execute(() => {
    const full = form.get("full");
    if (full !== "0" && full !== "1") throw new Error("Choose full or reopen");
    setRequestDate(String(form.get("date")), full === "1", "local demo owner");
  });
}
