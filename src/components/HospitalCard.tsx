"use client";

import Link from "next/link";
import { useFetch } from "@/lib/useFetch";
import { StatusBadge } from "./StatusBadge";
import type { HospitalSummary } from "@/types/hospital";

export function HospitalCard({ hospitalId, onUnpin }: { hospitalId: number; onUnpin: (id: number) => void }) {
  const { data, error, loading } = useFetch<HospitalSummary>(`/api/hospitals/${hospitalId}/summary`);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">Couldn&apos;t load this hospital right now.</p>}
      {data && (
        <>
          <div className="flex items-start justify-between gap-2">
            <Link href={`/hospitals/${data.id}`} className="text-lg font-semibold hover:underline">
              {data.fullName}
            </Link>
            <button
              type="button"
              onClick={() => onUnpin(hospitalId)}
              className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label={`Unpin ${data.fullName}`}
            >
              ✕
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge level={data.capacityLevel} label={data.capacityLabel} />
            <span className="text-sm text-slate-500 dark:text-slate-400">{data.busierQuieter.label}</span>
          </div>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Typical wait for less-urgent cases: <strong>{data.nonUrgentWaitLabel}</strong>
          </p>
          {data.triageBreachLabel && (
            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {data.triageBreachLabel}
            </p>
          )}
          <p className="mt-3 text-xs text-slate-400">
            Anyone with a serious or life-threatening condition is seen immediately, regardless of this figure.
          </p>
        </>
      )}
    </div>
  );
}
