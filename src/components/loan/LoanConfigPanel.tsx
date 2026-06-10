import { useLoan } from "@/lib/loan/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Trash2, Info } from "lucide-react";
import { NumberInput } from "./NumberInput";

function InfoHint({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="What is this?"
          className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Info className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-72 text-xs leading-relaxed">
        {text}
      </PopoverContent>
    </Popover>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </div>
  );
}

export function LoanConfigPanel() {
  const { inputs, dispatch } = useLoan();
  return (
    <div className="space-y-6">
      {/* Basics */}
      <Card title="Loan Basics" info="The core inputs for your home loan: principal borrowed (₹), starting annual interest rate, total tenure in years, and the disbursement / first-EMI date. All other sections build on these values.">
        <div className="space-y-4">
          <Field label="Principal Amount (₹)">
            <NumberInput
              value={inputs.loanAmount}
              onChange={(n) => dispatch({ type: "patch", patch: { loanAmount: n } })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Rate (% p.a.)">
              <NumberInput
                decimal
                value={inputs.startRatePct}
                onChange={(n) => dispatch({ type: "patch", patch: { startRatePct: n } })}
              />
            </Field>
            <Field label="Tenure (yrs)">
              <NumberInput
                decimal
                value={inputs.tenureYears}
                onChange={(n) => dispatch({ type: "patch", patch: { tenureYears: n } })}
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
        info="Model future interest rate revisions (RBI / bank repricing). For each change set the month it takes effect and the new rate, then choose: 'Keep EMI' (tenure adjusts) or 'Keep tenure' (EMI is recalculated)."

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
                    <NumberInput
                      value={r.effectiveMonth}
                      min={2}
                      onChange={(n) => dispatch({ type: "updateRate", id: r.id, patch: { effectiveMonth: n } })}
                    />
                  </Field>
                  <Field label="New rate %">
                    <NumberInput
                      decimal
                      value={r.ratePct}
                      onChange={(n) => dispatch({ type: "updateRate", id: r.id, patch: { ratePct: n } })}
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
      <Card title="Step-up Plan" info="Automatically raise your EMI every year (e.g. after salary hikes) — either by a percentage or a fixed ₹ amount. Choose the apply-month and the year it kicks in. You can also add extra EMIs per year as a recurring bonus prepayment.">
        <div className="space-y-4">
          <Field label="Annual increment type">
            <Select
              value={inputs.stepUp.incrementMode}
              onValueChange={(v) => dispatch({ type: "patchStepUp", patch: { incrementMode: v as any } })}
            >
              <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Percentage (%)</SelectItem>
                <SelectItem value="amount">Fixed amount (₹)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Extra EMIs / yr">
              <NumberInput
                decimal
                value={inputs.stepUp.extraEmisPerYear}
                onChange={(n) => dispatch({ type: "patchStepUp", patch: { extraEmisPerYear: n } })}
              />
            </Field>
            {inputs.stepUp.incrementMode === "percent" ? (
              <Field label="Annual ↑ %">
                <NumberInput
                  decimal
                  value={inputs.stepUp.annualIncrementPct}
                  onChange={(n) => dispatch({ type: "patchStepUp", patch: { annualIncrementPct: n } })}
                />
              </Field>
            ) : (
              <Field label="Annual ↑ (₹)">
                <NumberInput
                  value={inputs.stepUp.annualIncrementAmount}
                  onChange={(n) => dispatch({ type: "patchStepUp", patch: { annualIncrementAmount: n } })}
                />
              </Field>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Apply in month">
              <Select
                value={inputs.stepUp.applyMonth.toString()}
                onValueChange={(v) => dispatch({ type: "patchStepUp", patch: { applyMonth: Number(v) } })}
              >
                <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={(i + 1).toString()}>{m} (month {i + 1})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Start from year">
              <NumberInput
                min={1}
                value={inputs.stepUp.startYear}
                onChange={(n) => dispatch({ type: "patchStepUp", patch: { startYear: Math.max(1, n) } })}
              />
            </Field>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {inputs.stepUp.incrementMode === "amount"
              ? `EMI will rise by ₹${inputs.stepUp.annualIncrementAmount.toLocaleString("en-IN")} every ${MONTHS[inputs.stepUp.applyMonth - 1]} from year ${inputs.stepUp.startYear}.`
              : `EMI will rise by ${inputs.stepUp.annualIncrementPct}% every ${MONTHS[inputs.stepUp.applyMonth - 1]} from year ${inputs.stepUp.startYear}.`}
          </p>
        </div>
      </Card>

      {/* Pause Windows */}
      <Card
        title="Step-up Pause Windows"
        info="Temporarily halt the annual EMI step-up and recurring extra EMIs during tight-cash periods (job switch, maternity, big expense). Define a From → To month range; normal EMI and interest continue, step-ups resume after the window ends."

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
                  <NumberInput
                    value={p.startMonth}
                    onChange={(n) => dispatch({ type: "updatePause", id: p.id, patch: { startMonth: n } })}
                  />
                </Field>
                <Field label="To month" className="flex-1">
                  <NumberInput
                    value={p.endMonth}
                    onChange={(n) => dispatch({ type: "updatePause", id: p.id, patch: { endMonth: n } })}
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
                  <NumberInput
                    value={p.month}
                    onChange={(n) => dispatch({ type: "updatePrepay", id: p.id, patch: { month: n } })}
                  />
                </Field>
                <Field label="Amount (₹)" className="flex-1">
                  <NumberInput
                    value={p.amount}
                    onChange={(n) => dispatch({ type: "updatePrepay", id: p.id, patch: { amount: n } })}
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

function Card({ title, children, action, info }: { title: string; children: React.ReactNode; action?: React.ReactNode; info?: string }) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h3 className="font-display text-base font-semibold tracking-tight text-foreground">{title}</h3>
          {info && <InfoHint text={info} />}
        </div>
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
