import { useLoan } from "@/lib/loan/store";
import { computeUpfrontBreakdown } from "@/lib/loan/calculator";
import { formatINR } from "@/lib/loan/format";

function Row({ label, value, sub, strong }: { label: string; value: string; sub?: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border/60 py-2 last:border-b-0">
      <div>
        <div className={`text-sm ${strong ? "font-semibold text-foreground" : "text-foreground/90"}`}>{label}</div>
        {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
      </div>
      <div className={`font-display tabular-nums ${strong ? "text-base font-bold text-accent" : "text-sm text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}

export function UpfrontCostsCard() {
  const { inputs, schedule } = useLoan();
  const b = computeUpfrontBreakdown(inputs, schedule);
  const totalOutflow = b.total + schedule.totalPrincipal + schedule.totalInterest - inputs.loanAmount;
  // totalPrincipal already includes loanAmount-equivalent payback; net interest+fees = true cost premium
  const trueCostPremium = b.total + schedule.totalInterest;

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            True Cost of Borrowing
          </p>
          <h2 className="font-display text-lg font-semibold tracking-tight">Upfront Costs & Effective APR</h2>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Effective APR
          </p>
          <p className="font-display text-2xl font-bold text-accent">
            {b.effectiveAprPct > 0 ? `${b.effectiveAprPct.toFixed(2)}%` : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground">vs nominal {inputs.startRatePct}%</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
        <div>
          <Row
            label="Processing fee"
            value={formatINR(b.processingFeeTotal)}
            sub={`Base ${formatINR(b.processingFeeBase)} + GST ${formatINR(b.processingFeeGst)}`}
          />
          <Row label="Stamp duty" value={formatINR(b.stampDuty)} sub={`${inputs.upfront.stampDutyPct}% on property base`} />
          <Row label="Registration" value={formatINR(b.registration)} sub={`${inputs.upfront.registrationPct}% on property base`} />
          <Row label="MODT" value={formatINR(b.modt)} sub={`${inputs.upfront.modtPct}% of loan`} />
        </div>
        <div>
          <Row label="Insurance premium" value={formatINR(b.insurance)} />
          <Row label="Legal / valuation" value={formatINR(b.legalValuation)} />
          <Row label="Other charges" value={formatINR(b.other)} />
          <Row label="Total upfront" value={formatINR(b.total, { compact: true })} strong />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 rounded-lg bg-secondary/40 p-4 md:grid-cols-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Net disbursed</p>
          <p className="mt-1 font-display text-lg font-bold">{formatINR(b.netDisbursed, { compact: true })}</p>
          <p className="text-[11px] text-muted-foreground">
            {inputs.upfront.processingFeeDeductedFromDisbursement ? "After fee deduction" : "Same as loan amount"}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Premium over principal</p>
          <p className="mt-1 font-display text-lg font-bold">{formatINR(trueCostPremium, { compact: true })}</p>
          <p className="text-[11px] text-muted-foreground">Interest + all fees</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Total outflow</p>
          <p className="mt-1 font-display text-lg font-bold">
            {formatINR(inputs.loanAmount + trueCostPremium, { compact: true })}
          </p>
          <p className="text-[11px] text-muted-foreground">Principal + interest + fees</p>
        </div>
      </div>
    </section>
  );
}
