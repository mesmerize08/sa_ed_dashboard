const STORAGE_KEY = "sa-ed-dashboard:pinned-hospitals";

/** Per-device favourites, deliberately not synced anywhere — see the plan's "no login" decision. */
export function getPinnedHospitalIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n): n is number => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function setPinnedHospitalIds(ids: number[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // localStorage can throw in private browsing / storage-full states.
    // Pinning is a convenience, not critical data, so we degrade silently.
  }
}

export function togglePinnedHospitalId(id: number): number[] {
  const current = getPinnedHospitalIds();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  setPinnedHospitalIds(next);
  return next;
}
