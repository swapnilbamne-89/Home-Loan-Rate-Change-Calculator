import { useMemo, useState } from "react";
import { useLoan } from "@/lib/loan/store";
import { generateSchedule } from "@/lib/loan/calculator";
import { formatINR, formatMonths } from "@/lib/loan/format";
import { NumberInput } from "./NumberInput";

/**
 * Prepay vs Invest
 * ----------------
 * Scenario A (Invest): keep current plan, invest the lump sum at expected
 *   return rate for the original remaining tenure. Apply LTCG tax on gains.
 * Scenario B (Prepay): apply the lump sum as a one-off prepayment at the
 *   chosen month. The loan closes earlier; the freed-up EMIs after closure
 *   are then invested at the same return rate until the original close month.
 *
 * We compare terminal wealth at the original close month so both scenarios
 * are measured on the same horizon.
 */
export function PrepayVsInvestCard() {
  const { inputs, schedule } = useLoan();
  const [lump, setLump] = useState<number>(500000);
  const [month, setMonth] = useState<number>(13);
  const [returnPct, setReturnPct] = useState<number>(12);
  const [taxPct, setTaxPct] = useState<number>(12.5);

  const result = useMemo(() => {
    const horizon = schedule.monthsToClose; // current-plan close
    const rMonthly = returnPct / 100 / 12;

    // Scenario A: invest lump sum for `horizon` months
    const grossA = lump * Math.pow(1 + rMonthly, horizon);
    const gainA = Math.max(0, grossA - lump);
    const netA = grossA - (gainA * taxPct) / 100;

    // Scenario B: add prepayment at chosen month, recompute schedule
    const prepayInputs = {
      ...inputs,
      prepayments: [
        ...inputs.prepayments,
        { id: "__pvi", month: Math.max(1, month), amount: lump },
      ],
    };
    const newSched = generateSchedule(prepayInputs);
    const monthsSaved = Math.max(0, horizon - newSched.monthsToClose);

    // Freed EMI each month after new close — use last EMI as proxy
    const freedEmi = newSched.finalEmi;
    // Invest each freed EMI from month (newClose+1) .. horizon
    let fvFreed = 0;
    for (let k = 1; k <= monthsSaved; k++) {
      fvFreed += freedEmi * Math.pow(1 + rMonthly, monthsSaved - k);
    }
    const gainB = Math.max(0, fvFreed - freedEmi * monthsSaved);
    const netB = fvFreed - (gainB * taxPct) / 100;

    const interestSaved = schedule.totalInterest - newSched.totalInterest;
    const winner = netB > netA ? "prepay" : "invest";
    const delta = Math.abs(netB - netA);
    // Break-even monthly return where prepay = invest (approx by solving netA == netB)
    // Quick numeric search
    let breakEven = 0;
    for (let r = 1; r <= 30; r += 0.1) {
      const rm = r / 100 / 12;
      const gA = lump * Math.pow(1 + rm, horizon);
      const nA = gA - Math.max(0, gA - lump) * (taxPct / 100);
      let fv = 0;
      for (let k = 1; k <= monthsSaved; k++) fv += freedEmi * Math.pow(1 + rm, monthsSaved - k);
      const nB = fv - Math.max(0, fv - freedEmi * monthsSaved) * (taxPct / 100);
      if (nA >= nB) {
        breakEven = r;
        break;
      }
    }

    return {
      horizon,
      monthsSaved,
      newClose: newSched.monthsToClose,
      interestSaved,
      freedEmi,
      netA,
      netB,
      winner,
      delta,
      breakEven,
    };
  }, [inputs, schedule, lump, month, returnPct, taxPct]);

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight">Prepay vs Invest</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Compare deploying a lump sum as a prepayment versus investing it at your expected
            return. Both scenarios measured at the original close month ({formatMonths(result.horizon)}).
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Field label="Lump sum (₹)">
          <NumberInput value={lump} onChange={setLump} min={0} />
        </Field>
        <Field label="Deploy at month">
          <NumberInput value={month} onChange={setMonth} min={1} />
        </Field>
        <Field label="Expected return %/yr">
          <NumberInput value={returnPct} onChange={setReturnPct} decimal min={0} />
        </Field>
        <Field label="Tax on gains %">
          <NumberInput value={taxPct} onChange={setTaxPct} decimal min={0} />
        </Field>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Scenario
          title="Invest the lump sum"
          highlight={result.winner === "invest"}
          rows={[
            ["Lump sum invested", formatINR(lump)],
            ["Growth horizon", formatMonths(result.horizon)],
            ["Net value (post-tax)", formatINR(result.netA)],
          ]}
        />
        <Scenario
          title="Prepay the loan"
          highlight={result.winner === "prepay"}
          rows={[
            ["Interest saved", formatINR(result.interestSaved)],
            [
              "Loan closes",
              `${formatMonths(result.newClose)} (${result.monthsSaved} mo earlier)`,
            ],
            ["Freed EMIs invested", formatINR(result.freedEmi * result.monthsSaved)],
            ["Net value (post-tax)", formatINR(result.netB)],
          ]}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 rounded-lg border bg-muted/30 p-4 md:grid-cols-3">
        <Stat
          label="Better choice"
          value={result.winner === "prepay" ? "Prepay" : "Invest"}
          accent
        />
        <Stat label="Advantage" value={formatINR(result.delta)} />
        <Stat
          label="Break-even return"
          value={result.breakEven > 0 ? `${result.breakEven.toFixed(1)}% / yr` : "—"}
          hint="Above this return, investing wins"
        />
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Assumes monthly compounding, single LTCG-style tax on gains at the horizon, and freed EMIs
        invested at the same return rate after loan closure. Indicative only.
      </p>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Scenario({
  title,
  rows,
  highlight,
}: {
  title: string;
  rows: [string, string][];
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight ? "border-accent bg-accent/5" : "bg-background"
      }`}
    >
      <h3 className="mb-2 font-display text-sm font-bold tracking-tight">{title}</h3>
      <dl className="space-y-1.5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-medium tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Stat({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-0.5 font-display text-lg font-bold tracking-tight ${accent ? "text-accent" : ""}`}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
