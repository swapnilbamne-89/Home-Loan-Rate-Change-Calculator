import { useMemo, useState } from "react";
import { useLoan } from "@/lib/loan/store";
import { generateSchedule } from "@/lib/loan/calculator";
import { formatINR, formatMonths } from "@/lib/loan/format";
import { NumberInput } from "./NumberInput";

/**
 * Prepay vs Invest (SIP with annual step-up)
 * ------------------------------------------
 * The user commits a monthly SIP amount that grows by `stepUpPct` each loan
 * year. We compare two ways of deploying that same cashflow:
 *
 * Scenario A (Invest): contribute the SIP into a market instrument earning
 *   `returnPct`/yr for the original remaining tenure. LTCG-style tax on gains.
 *
 * Scenario B (Prepay): apply each month's SIP as a recurring prepayment on
 *   the loan. The loan closes earlier; from then on, the freed EMI PLUS the
 *   ongoing SIP are invested at the same return rate until the original
 *   close month, so both scenarios use identical out-of-pocket cashflows.
 */
export function PrepayVsInvestCard() {
  const { inputs, schedule } = useLoan();
  const [sip, setSip] = useState<number>(10000);
  const [stepUpPct, setStepUpPct] = useState<number>(10);
  const [startMonth, setStartMonth] = useState<number>(1);
  const [returnPct, setReturnPct] = useState<number>(12);
  const [taxPct, setTaxPct] = useState<number>(12.5);

  const result = useMemo(() => {
    const horizon = schedule.monthsToClose; // current-plan close
    const rMonthly = returnPct / 100 / 12;
    const start = Math.max(1, startMonth);

    // SIP amount at a given loan month (1-based), stepped up every 12 months
    const sipAt = (m: number, base: number) => {
      if (m < start) return 0;
      const yearsIn = Math.floor((m - start) / 12);
      return base * Math.pow(1 + stepUpPct / 100, yearsIn);
    };

    // ----- Scenario A: invest the SIP for the full horizon -----
    let fvA = 0;
    let totalContribA = 0;
    for (let m = 1; m <= horizon; m++) {
      const c = sipAt(m, sip);
      totalContribA += c;
      fvA = fvA * (1 + rMonthly) + c;
    }
    const gainA = Math.max(0, fvA - totalContribA);
    const netA = fvA - (gainA * taxPct) / 100;

    // ----- Scenario B: prepay SIP into loan, invest freed cashflows -----
    // Build recurring prepayments for the new schedule
    const recurringPrepayments = [] as { id: string; month: number; amount: number }[];
    for (let m = start; m <= horizon; m++) {
      const amt = sipAt(m, sip);
      if (amt > 0) recurringPrepayments.push({ id: `__pvi_${m}`, month: m, amount: amt });
    }
    const prepayInputs = {
      ...inputs,
      prepayments: [...inputs.prepayments, ...recurringPrepayments],
    };
    const newSched = generateSchedule(prepayInputs);
    const newClose = newSched.monthsToClose;
    const monthsSaved = Math.max(0, horizon - newClose);
    const freedEmi = newSched.finalEmi;

    // After the loan closes, both the freed EMI AND the (still-stepping) SIP
    // are invested for the remaining months until the original horizon.
    let fvB = 0;
    let totalContribB = 0;
    // Track SIP contributions made while the loan was alive (these "went into" the loan,
    // counted as outflow but no investment FV — savings show up as interest avoided).
    for (let m = start; m <= newClose; m++) totalContribB += sipAt(m, sip);

    for (let m = newClose + 1; m <= horizon; m++) {
      const c = sipAt(m, sip) + freedEmi;
      totalContribB += c;
      fvB = fvB * (1 + rMonthly) + c;
    }
    const gainB = Math.max(0, fvB - (totalContribB - (totalContribA - totalContribB > 0 ? 0 : 0)));
    // Simpler & correct: gains = FV - contributions invested in market only
    let investedB = 0;
    for (let m = newClose + 1; m <= horizon; m++) investedB += sipAt(m, sip) + freedEmi;
    const gainBClean = Math.max(0, fvB - investedB);
    const netB_market = fvB - (gainBClean * taxPct) / 100;

    const interestSaved = schedule.totalInterest - newSched.totalInterest;
    // Total economic value of prepay path = post-tax market value + interest saved
    const netB = netB_market + interestSaved;

    const winner = netB > netA ? "prepay" : "invest";
    const delta = Math.abs(netB - netA);

    // Break-even annual return where invest = prepay
    let breakEven = 0;
    for (let r = 1; r <= 40; r += 0.25) {
      const rm = r / 100 / 12;
      let fa = 0;
      for (let m = 1; m <= horizon; m++) fa = fa * (1 + rm) + sipAt(m, sip);
      const nA = fa - Math.max(0, fa - totalContribA) * (taxPct / 100);

      let fb = 0;
      let invB = 0;
      for (let m = newClose + 1; m <= horizon; m++) {
        const c = sipAt(m, sip) + freedEmi;
        invB += c;
        fb = fb * (1 + rm) + c;
      }
      const nB = fb - Math.max(0, fb - invB) * (taxPct / 100) + interestSaved;
      if (nA >= nB) {
        breakEven = r;
        break;
      }
    }

    return {
      horizon,
      monthsSaved,
      newClose,
      interestSaved,
      freedEmi,
      totalContribA,
      netA,
      netB,
      netB_market,
      winner,
      delta,
      breakEven,
    };
  }, [inputs, schedule, sip, stepUpPct, startMonth, returnPct, taxPct]);

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight">Prepay vs Invest (SIP)</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Commit a monthly SIP that steps up each year. Compare investing it in the market versus
            using it to prepay the loan. Both scenarios use the same out-of-pocket cashflow and are
            measured at the original close month ({formatMonths(result.horizon)}).
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Field label="Monthly SIP (₹)">
          <NumberInput value={sip} onChange={setSip} min={0} />
        </Field>
        <Field label="Annual step-up %">
          <NumberInput value={stepUpPct} onChange={setStepUpPct} decimal min={0} />
        </Field>
        <Field label="Start at month">
          <NumberInput value={startMonth} onChange={setStartMonth} min={1} />
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
          title="Invest the SIP"
          highlight={result.winner === "invest"}
          rows={[
            ["Total contributed", formatINR(result.totalContribA)],
            ["Growth horizon", formatMonths(result.horizon)],
            ["Net value (post-tax)", formatINR(result.netA)],
          ]}
        />
        <Scenario
          title="Prepay with the SIP"
          highlight={result.winner === "prepay"}
          rows={[
            ["Interest saved", formatINR(result.interestSaved)],
            [
              "Loan closes",
              `${formatMonths(result.newClose)} (${result.monthsSaved} mo earlier)`,
            ],
            ["Freed EMI after closure", formatINR(result.freedEmi)],
            ["Post-closure investments", formatINR(result.netB_market)],
            ["Total value (incl. interest saved)", formatINR(result.netB)],
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
          value={result.breakEven > 0 ? `${result.breakEven.toFixed(2)}% / yr` : "—"}
          hint="Above this return, investing wins"
        />
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        SIP grows by the step-up % every 12 months from start. Assumes monthly compounding, single
        LTCG-style tax on gains at the horizon, and that after loan closure the freed EMI plus the
        ongoing SIP are invested at the same return rate. Indicative only.
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
