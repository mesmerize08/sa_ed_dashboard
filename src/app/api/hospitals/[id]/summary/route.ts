import { NextResponse } from "next/server";
import { getDbClient } from "@/lib/db/client";
import {
  getCapacityBaseline,
  getHospitalById,
  getLatestSnapshot,
  getLatestTriageSnapshots,
  getTriageWotBaseline,
} from "@/lib/db/queries";
import { buildHospitalSummary } from "@/lib/domain/summary";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hospitalId = Number(id);
  if (!Number.isInteger(hospitalId)) {
    return NextResponse.json({ error: "Invalid hospital id" }, { status: 400 });
  }

  const db = getDbClient();
  const hospital = await getHospitalById(db, hospitalId);
  if (!hospital) {
    return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
  }

  const snapshot = await getLatestSnapshot(db, hospitalId);
  if (!snapshot) {
    return NextResponse.json({ error: "No data yet for this hospital" }, { status: 404 });
  }

  const capturedAt = new Date(snapshot.captured_at);
  const [occupancyBaseline, triageRows] = await Promise.all([
    getCapacityBaseline(db, hospitalId, capturedAt),
    getLatestTriageSnapshots(db, hospitalId, snapshot.captured_at),
  ]);

  const highAcuityCategories = triageRows.filter((r) => r.triage_category === 1 || r.triage_category === 2);
  const triageBaselines = await Promise.all(
    highAcuityCategories.map(async (r) => {
      const baseline = await getTriageWotBaseline(db, hospitalId, r.triage_category, capturedAt);
      return { category: r.triage_category, avgWot: baseline.avgWot, sampleSize: baseline.sampleSize };
    }),
  );

  const summary = buildHospitalSummary({
    hospital: { id: hospital.id, shortCode: hospital.short_code, fullName: hospital.full_name },
    snapshot: {
      capturedAt: snapshot.captured_at,
      waitingToBeSeen: snapshot.waiting_to_be_seen,
      comTreat: snapshot.com_treat,
      capacity: snapshot.capacity,
      avgWaitMinutes: snapshot.avg_wait_minutes,
    },
    occupancyBaseline: { avgOccupancyPercent: occupancyBaseline.avgOccupancyPercent, sampleSize: occupancyBaseline.sampleSize },
    triageRows: triageRows.map((r) => ({ category: r.triage_category, waitingOverThreshold: r.waiting_over_threshold })),
    triageBaselines,
  });

  return NextResponse.json(summary);
}
