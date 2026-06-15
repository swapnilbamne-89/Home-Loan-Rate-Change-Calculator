import { useMemo, useState } from "react";
import { useLoan } from "@/lib/loan/store";
import { generateSchedule } from "@/lib/loan/calculator";
import type { LoanInputs } from "@/lib/loan/types";
import { formatINR, formatMonths } from "@/lib/loan/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, X, GitCompare } from "lucide-react";

interface ScenarioOverride {
  id: string;
  name: string;
  startRatePct?: number;
  tenureYears?: number;
  stepUpPct?: number;
  extraEmisPerYear?: number;
  prepayAmount?: number; // recurring lump-sum applied at month 12 yearly
  prepayEveryYears?: number;
}

const uid = () => Math.random().toString(36).slice(2, 9);

function applyOverride(base: LoanInputs, ov: ScenarioOverride): LoanInputs {
  const next: LoanInputs = {
    ...base,
    startRatePct: ov.startRatePct ?? base.startRatePct,
    tenureYears: ov.tenureYears ?? base.tenureYears,
    stepUp: {
      ...base.stepUp,
      annualIncrementPct: ov.stepUpPct ?? base.stepUp.annualIncrementPct,
      extraEmisPerYear: ov.extraEmisPerYear ?? base.stepUp.extraEmisPerYear,
    },
    prepayments: [...base.prepayments],
  };
  if (ov.prepayAmount && ov.prepayAmount > 0) {
    const every = Math.max(1, ov.prepayEveryYears ?? 1);
    const total = Math.round((ov.tenureYears ?? base.tenureYears));
    for (let y = 1; y <= total; y += every) {
      next.prepayments.push({ id: uid(), month: y * 12, amount: ov.prepayAmount });
    }
  }
  return next;
}

function Field({ label, value, onChange, step = 1, suffix }: { label: string; value: number | undefined; onChange: (v: number | undefined) => void; step?: number; suffix?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}{suffix ? ` (${suffix})` : ""}</Label>
      <Input
        type="number"
        step={step}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        className="h-8 text-sm"
      />
    </div>
  );
}

export function WhatIfCard() {
  const { inputs, schedule: baseSchedule } = useLoan();
  const [scenarios, setScenarios] = useState<ScenarioOverride[]>([
    { id: uid(), name: "Lower rate", startRatePct: Math.max(0, inputs.startRatePct - 0.5) },
    { id: uid(), name: "Aggressive step-up", stepUpPct: 10, extraEmisPerYear: 2 },
  ]);

  const computed = useMemo(() => {
    return scenarios.map((s) => {
      const merged = applyOverride(inputs, s);
      const sch = generateSchedule(merged);
      return { s, sch, merged };
    });
  }, [scenarios, inputs]);

  const baseInterest = baseSchedule.totalInterest;
  const baseMonths = baseSchedule.monthsToClose;
  const baseEmi = baseSchedule.rows[0]?.emi ?? 0;

  const update = (id: string, patch: Partial<ScenarioOverride>) =>
    setScenarios((arr) => arr.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const remove = (id: string) => setScenarios((arr) => arr.filter((s) => s.id !== id));
  const add = () => setScenarios((arr) => [...arr, { id: uid(), name: `Scenario ${arr.length + 1}` }]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCompare className="size-5 text-primary" /> What-if Scenario Comparison
        </CardTitle>
        <CardDescription>
          Compare alternative loans against your current plan. Leave a field blank to inherit from the baseline.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Baseline */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Baseline (current config)</div>
          <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Mini label="Rate" value={`${inputs.startRatePct}%`} />
            <Mini label="Tenure" value={`${inputs.tenureYears}y`} />
            <Mini label="Total Interest" value={formatINR(baseInterest, { compact: true })} />
            <Mini label="Closes in" value={formatMonths(baseMonths)} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {computed.map(({ s, sch }) => {
            const dInt = baseInterest - sch.totalInterest;
            const dM = baseMonths - sch.monthsToClose;
            const emi = sch.rows[0]?.emi ?? 0;
            return (
              <div key={s.id} className="relative rounded-lg border bg-card p-4 shadow-sm">
                <button
                  onClick={() => remove(s.id)}
                  className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Remove scenario"
                >
                  <X className="size-4" />
                </button>
                <Input
                  value={s.name}
                  onChange={(e) => update(s.id, { name: e.target.value })}
                  className="h-8 w-[80%] text-sm font-semibold"
                />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Field label="Rate" suffix="%" step={0.05} value={s.startRatePct} onChange={(v) => update(s.id, { startRatePct: v })} />
                  <Field label="Tenure" suffix="y" value={s.tenureYears} onChange={(v) => update(s.id, { tenureYears: v })} />
                  <Field label="Step-up" suffix="%/y" step={0.5} value={s.stepUpPct} onChange={(v) => update(s.id, { stepUpPct: v })} />
                  <Field label="Extra EMIs/yr" value={s.extraEmisPerYear} onChange={(v) => update(s.id, { extraEmisPerYear: v })} />
                  <Field label="Yearly prepay" suffix="₹" step={10000} value={s.prepayAmount} onChange={(v) => update(s.id, { prepayAmount: v })} />
                  <Field label="Every N years" value={s.prepayEveryYears} onChange={(v) => update(s.id, { prepayEveryYears: v })} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-3">
                  <Outcome label="Starting EMI" value={formatINR(emi)} delta={emi - baseEmi} invert />
                  <Outcome label="Closes in" value={formatMonths(sch.monthsToClose)} delta={-dM} deltaLabel={dM === 0 ? "same" : `${Math.abs(dM)}m ${dM > 0 ? "earlier" : "later"}`} />
                  <Outcome label="Total Interest" value={formatINR(sch.totalInterest, { compact: true })} delta={-dInt} invert />
                  <Outcome label="Interest Saved" value={formatINR(dInt, { compact: true })} delta={dInt} />
                </div>
              </div>
            );
          })}
        </div>

        <Button variant="outline" size="sm" onClick={add} className="gap-1">
          <Plus className="size-4" /> Add scenario
        </Button>
      </CardContent>
    </Card>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function Outcome({ label, value, delta, deltaLabel, invert }: { label: string; value: string; delta: number; deltaLabel?: string; invert?: boolean }) {
  const good = invert ? delta < 0 : delta > 0;
  const neutral = Math.abs(delta) < 0.5;
  const color = neutral ? "text-muted-foreground" : good ? "text-[color:var(--success)]" : "text-destructive";
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
      {!neutral && deltaLabel !== "same" && (
        <div className={`text-[11px] ${color}`}>{deltaLabel ?? (good ? "▼ better" : "▲ worse")}</div>
      )}
    </div>
  );
}
