import { NextResponse } from "next/server";
import { getDbClient } from "@/lib/db/client";
import { getSnapshotsSince } from "@/lib/db/queries";
import { occupancyPercent } from "@/lib/domain/capacityStatus";
import type { TrendPoint, TrendRange } from "@/types/hospital";

const RANGE_TO_MS: Record<TrendRange, number> = {
  "1d": 24 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hospitalId = Number(id);
  if (!Number.isInteger(hospitalId)) {
    return NextResponse.json({ error: "Invalid hospital id" }, { status: 400 });
  }

  const url = new URL(request.url);
  const rangeParam = url.searchParams.get("range");
  const range: TrendRange = rangeParam === "1w" ? "1w" : "1d";

  const db = getDbClient();
  const since = new Date(Date.now() - RANGE_TO_MS[range]);
  const rows = await getSnapshotsSince(db, hospitalId, since);

  const points: TrendPoint[] = rows.map((r) => ({
    capturedAt: r.captured_at,
    occupancyPercent: occupancyPercent(r.waiting_to_be_seen + r.com_treat, r.capacity),
    avgWaitMinutes: r.avg_wait_minutes,
  }));

  return NextResponse.json(points);
}
