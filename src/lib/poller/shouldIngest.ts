/**
 * Guards against writing duplicate snapshot rows when polling faster than
 * the source actually updates (or against going backwards if the source
 * ever glitches) — the dedup check the phase-1 plan calls for.
 */
export function shouldIngest(previousCurrDtm: Date | null, sourceCurrDtm: Date): boolean {
  if (previousCurrDtm === null) return true;
  return sourceCurrDtm.getTime() > previousCurrDtm.getTime();
}
