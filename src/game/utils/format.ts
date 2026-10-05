export function formatMeters(value: number): string {
  return `${Math.max(0, Math.floor(value)).toLocaleString()} m`;
}

export function formatScore(value: number): string {
  return Math.max(0, Math.floor(value)).toLocaleString();
}

export function formatYears(value: number): string {
  return `${value.toFixed(1)} YEARS`;
}

export function formatMoney(value: number): string {
  return `$${Math.max(0, Math.floor(value)).toLocaleString()}`;
}
