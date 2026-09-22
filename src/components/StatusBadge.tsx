import type { CapacityLevel } from "@/lib/domain/capacityStatus";

const COLORS: Record<CapacityLevel, string> = {
  green: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  amber: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  red: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
  white: "bg-slate-200 text-slate-900 border-slate-400 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-500",
};

export function StatusBadge({ level, label }: { level: CapacityLevel; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${COLORS[level]}`}
    >
      {label}
    </span>
  );
}
