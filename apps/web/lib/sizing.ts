export function formatProbability(value: number) {
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

export function formatPrice(value: number) {
  return value ? value.toFixed(2) : "n/a";
}

export function countdown(expiry: number, now = Date.now()) {
  const seconds = Math.max(0, Math.floor(expiry - now / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}` : `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export function shortAddress(value: string) {
  return value.length > 10 ? `${value.slice(0, 4)}…${value.slice(-4)}` : value;
}
