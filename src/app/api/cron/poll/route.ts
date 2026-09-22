import { NextResponse } from "next/server";
import { getDbClient } from "@/lib/db/client";
import { createLiveStore, liveSource } from "@/lib/poller/adapters";
import { runIngest } from "@/lib/poller/ingest";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron target (see vercel.json). Vercel signs cron requests with a
 * bearer token matching CRON_SECRET when that env var is set — we verify it
 * so this endpoint can't be triggered by anyone who finds the URL.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const db = getDbClient();
  const result = await runIngest(liveSource, createLiveStore(db));

  // Always 200: a poll failure is logged to poll_log for later inspection,
  // not something that should make Vercel Cron treat the job as failed and
  // retry aggressively against an endpoint that may just be flaky.
  return NextResponse.json(result);
}
