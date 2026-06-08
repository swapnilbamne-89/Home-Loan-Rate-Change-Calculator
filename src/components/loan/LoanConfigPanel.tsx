import { useLoan } from "@/lib/loan/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </div>
  );
}

function num(v: string) {
  const n = Number(v.replace(/[^0-9.\-]/g, ""));
  return isFinite(n) ? n : 0;
}

export function LoanConfigPanel() {
  const { inputs, dispatch } = useLoan();
  return (
    <div className="space-y-6">
      {/* Basics */}
      <Card title="Loan Basics">
        <div className="space-y-4">
          <Field label="Principal Amount (₹)">
            <Input
              inputMode="numeric"
              value={inputs.loanAmount.toString()}
              onChange={(e) => dispatch({ type: "patch", patch: { loanAmount: num(e.target.value) } })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Rate (% p.a.)">
              <Input
                inputMode="decimal"
                value={inputs.startRatePct.toString()}
                onChange={(e) => dispatch({ type: "patch", patch: { startRatePct: num(e.target.value) } })}
              />
            </Field>
            <Field label="Tenure (yrs)">
              <Input
                inputMode="decimal"
                value={inputs.tenureYears.toString()}
                onChange={(e) => dispatch({ type: "patch", patch: { tenureYears: num(e.target.value) } })}
              />
            </Field>
          </div>
          <Field label="Start Date">
            <Input
              type="date"
              value={inputs.startDate}
              onChange={(e) => dispatch({ type: "patch", patch: { startDate: e.target.value } })}
            />
          </Field>
        </div>
      </Card>

      {/* Rate Changes */}
      <Card
        title="Rate Schedule"
        action={
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[11px] font-semibold uppercase tracking-wider text-accent hover:text-accent"
            onClick={() => dispatch({ type: "addRate" })}
          >
            <Plus className="mr-1 size-3" /> Add
          </Button>
        }
      >
        {inputs.rateChanges.length === 0 ? (
          <p className="text-xs text-muted-foreground">No rate changes yet. Add one to model an RBI/bank revision.</p>
        ) : (
          <div className="space-y-3">
            {inputs.rateChanges.map((r) => (
              <div key={r.id} className="rounded-lg border bg-secondary/40 p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Field label="From month">
                    <Input
                      inputMode="numeric"
                      value={r.effectiveMonth.toString()}
                      onChange={(e) =>
                        dispatch({ type: "updateRate", id: r.id, patch: { effectiveMonth: Math.max(2, num(e.target.value)) } })
                      }
                    />
                  </Field>
                  <Field label="New rate %">
                    <Input
                      inputMode="decimal"
                      value={r.ratePct.toString()}
                      onChange={(e) => dispatch({ type: "updateRate", id: r.id, patch: { ratePct: num(e.target.value) } })}
                    />
                  </Field>
                </div>
                <div className="flex items-end gap-2">
                  <Field label="Behavior" className="flex-1">
                    <Select
                      value={r.behavior}
                      onValueChange={(v) => dispatch({ type: "updateRate", id: r.id, patch: { behavior: v as any } })}
                    >
                      <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="keep-emi">Keep EMI, adjust tenure</SelectItem>
                        <SelectItem value="keep-tenure">Keep tenure, recalc EMI</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => dispatch({ type: "removeRate", id: r.id })}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Step-up */}
      <Card title="Step-up Plan">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Extra EMIs / yr">
              <Input
                inputMode="decimal"
                value={inputs.stepUp.extraEmisPerYear.toString()}
                onChange={(e) => dispatch({ type: "patchStepUp", patch: { extraEmisPerYear: num(e.target.value) } })}
              />
            </Field>
            <Field label="Annual ↑ %">
              <Input
                inputMode="decimal"
                value={inputs.stepUp.annualIncrementPct.toString()}
                onChange={(e) => dispatch({ type: "patchStepUp", patch: { annualIncrementPct: num(e.target.value) } })}
              />
            </Field>
          </div>
          <Field label="Apply in month">
            <Select
              value={inputs.stepUp.applyMonth.toString()}
              onValueChange={(v) => dispatch({ type: "patchStepUp", patch: { applyMonth: Number(v) } })}
            >
              <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i} value={(i + 1).toString()}>{m} (month {i + 1} of loan year)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Card>

      {/* Pause Windows */}
      <Card
        title="Step-up Pause Windows"
        action={
          <Button size="sm" variant="ghost" className="h-7 text-[11px] font-semibold uppercase tracking-wider text-accent hover:text-accent" onClick={() => dispatch({ type: "addPause" })}>
            <Plus className="mr-1 size-3" /> Add
          </Button>
        }
      >
        {inputs.pauseWindows.length === 0 ? (
          <p className="text-xs text-muted-foreground">Add a window to pause the annual EMI step-up & extra EMIs.</p>
        ) : (
          <div className="space-y-2">
            {inputs.pauseWindows.map((p) => (
              <div key={p.id} className="flex items-end gap-2 rounded-lg border bg-secondary/40 p-3">
                <Field label="From month" className="flex-1">
                  <Input
                    inputMode="numeric"
                    value={p.startMonth.toString()}
                    onChange={(e) => dispatch({ type: "updatePause", id: p.id, patch: { startMonth: num(e.target.value) } })}
                  />
                </Field>
                <Field label="To month" className="flex-1">
                  <Input
                    inputMode="numeric"
                    value={p.endMonth.toString()}
                    onChange={(e) => dispatch({ type: "updatePause", id: p.id, patch: { endMonth: num(e.target.value) } })}
                  />
                </Field>
                <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => dispatch({ type: "removePause", id: p.id })}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Prepayments */}
      <Card
        title="One-off Prepayments"
        action={
          <Button size="sm" variant="ghost" className="h-7 text-[11px] font-semibold uppercase tracking-wider text-accent hover:text-accent" onClick={() => dispatch({ type: "addPrepay" })}>
            <Plus className="mr-1 size-3" /> Add
          </Button>
        }
      >
        {inputs.prepayments.length === 0 ? (
          <p className="text-xs text-muted-foreground">Lump-sum amounts paid in specific months.</p>
        ) : (
          <div className="space-y-2">
            {inputs.prepayments.map((p) => (
              <div key={p.id} className="flex items-end gap-2 rounded-lg border bg-secondary/40 p-3">
                <Field label="Month" className="w-24">
                  <Input
                    inputMode="numeric"
                    value={p.month.toString()}
                    onChange={(e) => dispatch({ type: "updatePrepay", id: p.id, patch: { month: num(e.target.value) } })}
                  />
                </Field>
                <Field label="Amount (₹)" className="flex-1">
                  <Input
                    inputMode="numeric"
                    value={p.amount.toString()}
                    onChange={(e) => dispatch({ type: "updatePrepay", id: p.id, patch: { amount: num(e.target.value) } })}
                  />
                </Field>
                <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => dispatch({ type: "removePrepay", id: p.id })}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <header className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold tracking-tight text-foreground">{title}</h3>
        {action}
      </header>
      {children}
    </section>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export { SectionLabel };
