export function formatRaceResultsGap(
  value: number | null,
  isLeader?: boolean,
): string {
  if (value === null || value === undefined) return isLeader ? "--.---" : "";
  if (isNaN(value)) return "--.---";
  if (isLeader || (isLeader === undefined && value === 0)) return "--.---";
  if (value === 0) return "0.000";
  const sign = value > 0 ? "+" : "";
  return sign + value.toFixed(3);
}
