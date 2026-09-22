"use client";

import Link from "next/link";
import { useFetch } from "@/lib/useFetch";
import { usePinnedHospitals } from "@/lib/usePinnedHospitals";
import type { HospitalListItem } from "@/types/hospital";

export default function HospitalPickerPage() {
  const { data } = useFetch<HospitalListItem[]>("/api/hospitals");
  const { pinnedIds, toggle } = usePinnedHospitals();

  const metro = data?.filter((h) => h.type === "metro") ?? [];
  const country = data?.filter((h) => h.type === "country") ?? [];

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/" className="text-sm text-slate-500 hover:underline dark:text-slate-400">
        ← Back
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Choose hospitals</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Pinned hospitals are saved on this device only.
      </p>

      <HospitalSection title="Metro" hospitals={metro} pinnedIds={pinnedIds} onToggle={toggle} />
      {country.length > 0 && (
        <HospitalSection title="Country" hospitals={country} pinnedIds={pinnedIds} onToggle={toggle} />
      )}
    </main>
  );
}

function HospitalSection({
  title,
  hospitals,
  pinnedIds,
  onToggle,
}: {
  title: string;
  hospitals: HospitalListItem[];
  pinnedIds: number[];
  onToggle: (id: number) => void;
}) {
  if (hospitals.length === 0) return null;
  return (
    <section className="mt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</h2>
      <ul className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
        {hospitals.map((h) => {
          const pinned = pinnedIds.includes(h.id);
          return (
            <li key={h.id} className="flex items-center justify-between px-4 py-3">
              <span>{h.fullName}</span>
              <button
                type="button"
                onClick={() => onToggle(h.id)}
                className={`rounded-full px-4 py-1 text-sm font-medium ${
                  pinned
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                {pinned ? "Pinned" : "Pin"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
