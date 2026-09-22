"use client";

import Link from "next/link";
import { usePinnedHospitals } from "@/lib/usePinnedHospitals";
import { HospitalCard } from "@/components/HospitalCard";

export default function HomePage() {
  const { pinnedIds, toggle } = usePinnedHospitals();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Your hospitals</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        A clearer look at how busy South Australian public hospital Emergency Departments are right now.
      </p>

      {pinnedIds.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
          <p className="text-slate-600 dark:text-slate-300">You haven&apos;t pinned any hospitals yet.</p>
          <Link
            href="/hospitals"
            className="mt-4 inline-block rounded-full bg-slate-900 px-5 py-2 text-white dark:bg-slate-100 dark:text-slate-900"
          >
            Choose hospitals
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {pinnedIds.map((id) => (
            <HospitalCard key={id} hospitalId={id} onUnpin={toggle} />
          ))}
          <Link href="/hospitals" className="inline-block text-sm text-slate-500 hover:underline dark:text-slate-400">
            Manage pinned hospitals
          </Link>
        </div>
      )}
    </main>
  );
}
