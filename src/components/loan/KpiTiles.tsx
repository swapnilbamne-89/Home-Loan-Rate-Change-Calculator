import { useLoan } from "@/lib/loan/store";
import { formatINR, formatMonths } from "@/lib/loan/format";

function Tile({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: "gold" | "success" }) {
  const color = accent === "gold" ? "text-accent" : accent === "success" ? "text-[color:var(--success)]" : "text-foreground";
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold tracking-tight ${color}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function KpiTiles() {
  const { schedule, original, inputs } = useLoan();
  const interestSaved = original.totalInterest - schedule.totalInterest;
  const monthsSaved = original.monthsToClose - schedule.monthsToClose;
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
      <Tile label="Interest Saved" value={formatINR(interestSaved, { compact: true })} hint={`vs ${formatINR(original.totalInterest, { compact: true })} original`} accent="success" />
      <Tile label="Months to Close" value={formatMonths(schedule.monthsToClose)} hint={monthsSaved > 0 ? `${monthsSaved} months earlier` : "Same as original"} />
      <Tile label="Starting EMI" value={formatINR(schedule.rows[0]?.emi ?? 0)} />
      <Tile label="Final EMI" value={formatINR(schedule.finalEmi)} hint={`Principal ₹${inputs.loanAmount.toLocaleString("en-IN")}`} accent="gold" />
    </div>
  );
}
