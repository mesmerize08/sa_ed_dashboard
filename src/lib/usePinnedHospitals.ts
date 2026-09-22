"use client";

import { useCallback, useEffect, useState } from "react";
import { getPinnedHospitalIds, togglePinnedHospitalId } from "./pinned";

export function usePinnedHospitals() {
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);

  useEffect(() => {
    // Deliberate effect-then-setState: localStorage doesn't exist during SSR,
    // so we render the empty/default state on the server and on the client's
    // first render (matching, no hydration mismatch), then sync in the real
    // pinned ids once mounted in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPinnedIds(getPinnedHospitalIds());
  }, []);

  const toggle = useCallback((id: number) => {
    setPinnedIds(togglePinnedHospitalId(id));
  }, []);

  return { pinnedIds, toggle };
}
