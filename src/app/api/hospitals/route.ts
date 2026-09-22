import { NextResponse } from "next/server";
import { getDbClient } from "@/lib/db/client";
import { getAllHospitals } from "@/lib/db/queries";
import type { HospitalListItem } from "@/types/hospital";

export async function GET() {
  const db = getDbClient();
  const hospitals = await getAllHospitals(db);
  const items: HospitalListItem[] = hospitals.map((h) => ({
    id: h.id,
    shortCode: h.short_code,
    fullName: h.full_name,
    type: h.type,
  }));
  return NextResponse.json(items);
}
