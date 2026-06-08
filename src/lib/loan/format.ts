export function formatINR(n: number, opts: { compact?: boolean } = {}): string {
  if (!isFinite(n)) return "—";
  if (opts.compact) {
    const abs = Math.abs(n);
    if (abs >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
    if (abs >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
    if (abs >= 1e3) return `₹${(n / 1e3).toFixed(1)} K`;
  }
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function formatMonths(m: number): string {
  const y = Math.floor(m / 12);
  const mo = m % 12;
  if (y === 0) return `${mo}m`;
  if (mo === 0) return `${y}y`;
  return `${y}y ${mo}m`;
}

export function formatMonthDate(d: Date): string {
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}
