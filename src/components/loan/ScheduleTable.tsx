import { useLoan } from "@/lib/loan/store";
import { formatINR, formatMonthDate } from "@/lib/loan/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

function toCsv(rows: ReturnType<typeof useLoan>["schedule"]["rows"]): string {
  const head = ["Month", "Date", "Opening", "EMI", "Principal", "Interest", "Extra", "Prepayment", "Closing", "Rate %", "Notes"].join(",");
  const body = rows
    .map((r) =>
      [
        r.month,
        formatMonthDate(r.date),
        r.openingBalance.toFixed(2),
        r.emi.toFixed(2),
        r.principal.toFixed(2),
        r.interest.toFixed(2),
        r.extra.toFixed(2),
        r.prepayment.toFixed(2),
        r.closingBalance.toFixed(2),
        r.appliedRatePct,
        `"${r.notes.join("; ")}"`,
      ].join(",")
    )
    .join("\n");
  return head + "\n" + body;
}

export function ScheduleTable() {
  const { schedule } = useLoan();

  const download = () => {
    const blob = new Blob([toCsv(schedule.rows)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "loan-schedule.csv";
    a.click();
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight">Amortization Schedule</h2>
          <p className="text-xs text-muted-foreground">{schedule.rows.length} months · monthly breakdown</p>
        </div>
        <Button size="sm" variant="outline" onClick={download} className="gap-2">
          <Download className="size-3.5" /> Export CSV
        </Button>
      </div>
      <div className="max-h-[520px] overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-secondary/80 backdrop-blur">
            <tr className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">EMI</th>
              <th className="px-4 py-3 text-right">Principal</th>
              <th className="px-4 py-3 text-right">Interest</th>
              <th className="px-4 py-3 text-right">Extra</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3">Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {schedule.rows.map((r) => {
              const highlight = r.extra > 0 || r.prepayment > 0 || r.notes.length > 0;
              return (
                <tr key={r.month} className={highlight ? "bg-accent/5" : "hover:bg-secondary/40"}>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.month}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatMonthDate(r.date)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatINR(r.emi)}</td>
                  <td className="px-4 py-3 text-right">{formatINR(r.principal)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{formatINR(r.interest)}</td>
                  <td className="px-4 py-3 text-right">
                    {r.extra + r.prepayment > 0 ? (
                      <span className="font-medium text-[color:var(--success)]">+{formatINR(r.extra + r.prepayment)}</span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatINR(r.closingBalance)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{r.appliedRatePct}%</span>
                      {r.notes.length > 0 && (
                        <Badge variant="outline" className="border-accent/40 bg-accent/10 px-1.5 py-0 text-[10px] font-medium text-accent-foreground">
                          {r.notes[0]}
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
