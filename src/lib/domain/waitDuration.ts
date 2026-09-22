/**
 * Formats a minutes value (e.g. SA Health's AVG_WAIT) as a plain duration
 * string. Callers are responsible for labelling this as the non-urgent-only
 * figure it is — this function only handles number -> duration text.
 */
export function formatWaitDuration(minutes: number): string {
  const totalMinutes = Math.round(minutes);
  if (totalMinutes < 60) return `${totalMinutes} min`;

  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
