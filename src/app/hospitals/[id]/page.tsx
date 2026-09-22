"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useFetch } from "@/lib/useFetch";
import { StatusBadge } from "@/components/StatusBadge";
import { TrendChart } from "@/components/TrendChart";
import type { HospitalSummary, TrendPoint, TrendRange } from "@/types/hospital";

export default function HospitalDetailPage() {
  const params = useParams<{ id: string }>();
  const hospitalId = params.id;
  const [range, setRange] = useState<TrendRange>("1d");

  const { data: summary } = useFetch<HospitalSummary>(`/api/hospitals/${hospitalId}/summary`);
  const { data: trend } = useFetch<TrendPoint[]>(`/api/hospitals/${hospitalId}/trend?range=${range}`);

  const occupancyPoints = (trend ?? []).map((p) => ({ x: new Date(p.capturedAt).getTime(), y: p.occupancyPercent }));
  const waitPoints = (trend ?? []).map((p) => ({ x: new Date(p.capturedAt).getTime(), y: p.avgWaitMinutes }));

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/" className="text-sm text-slate-500 hover:underline dark:text-slate-400">
        ← Back
      </Link>

      {summary && (
        <>
          <h1 className="mt-2 text-2xl font-bold">{summary.fullName}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge level={summary.capacityLevel} label={summary.capacityLabel} />
            <span className="text-sm text-slate-500 dark:text-slate-400">{summary.busierQuieter.label}</span>
          </div>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Typical wait for less-urgent cases: <strong>{summary.nonUrgentWaitLabel}</strong>
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Anyone with a serious or life-threatening condition is seen immediately, regardless of this figure.
          </p>
          {summary.triageBreachLabel && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {summary.triageBreachLabel}
            </p>
          )}
        </>
      )}

      <div className="mt-8 flex gap-2">
        {(["1d", "1w"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`rounded-full px-4 py-1 text-sm font-medium ${
              range === r
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            }`}
          >
            {r === "1d" ? "Today" : "1 week"}
          </button>
        ))}
      </div>

      <section className="mt-4">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Capacity evolution</h2>
        <div className="mt-2">
          <TrendChart points={occupancyPoints} formatY={(y) => `${Math.round(y)}%`} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Wait time evolution (less-urgent cases)
        </h2>
        <div className="mt-2">
          <TrendChart points={waitPoints} formatY={(y) => `${Math.round(y)} min`} color="#d97706" />
        </div>
      </section>
    </main>
  );
}
