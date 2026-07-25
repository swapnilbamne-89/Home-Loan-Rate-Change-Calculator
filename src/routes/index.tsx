import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { LoanProvider, useLoan } from "@/lib/loan/store";
import { LoanConfigPanel } from "@/components/loan/LoanConfigPanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatINR, formatMonths } from "@/lib/loan/format";
import { Sliders, LineChart, Coins, Scale, Wallet, CalendarDays } from "lucide-react";

const BalanceChart = lazy(() => import("@/components/loan/Charts").then(m => ({ default: m.BalanceChart })));
const YearlyBreakdown = lazy(() => import("@/components/loan/Charts").then(m => ({ default: m.YearlyBreakdown })));
const ScheduleTable = lazy(() => import("@/components/loan/ScheduleTable").then(m => ({ default: m.ScheduleTable })));
const UpfrontCostsCard = lazy(() => import("@/components/loan/UpfrontCostsCard").then(m => ({ default: m.UpfrontCostsCard })));
const PrepayVsInvestCard = lazy(() => import("@/components/loan/PrepayVsInvestCard").then(m => ({ default: m.PrepayVsInvestCard })));
const WhatIfCard = lazy(() => import("@/components/loan/WhatIfCard").then(m => ({ default: m.WhatIfCard })));

const TabFallback = () => (
  <div className="grid place-items-center py-16 text-xs text-muted-foreground">Loading…</div>
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home Loan EMI Planner — Rates, Step-up & Prepay" },
      { name: "description", content: "Model your home loan with multiple interest rate changes, annual EMI step-up, pause windows, and one-off prepayments. Schedule + charts." },
      { property: "og:title", content: "Home Loan EMI Planner" },
      { property: "og:description", content: "Advanced amortization with rate changes, step-up EMIs, and prepayments." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://home-loan-emi-planner.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://home-loan-emi-planner.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "LedgerLoan — Home Loan EMI Planner",
          description:
            "Free home loan calculator that models rate changes, annual EMI step-ups, pause windows, one-off prepayments, upfront fees, and prepay-vs-invest comparisons.",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Any",
          url: "https://home-loan-emi-planner.lovable.app/",
          offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
        }),
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <LoanProvider>
      <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-[0.55]"
          style={{
            background:
              "radial-gradient(80% 60% at 15% 0%, color-mix(in oklab, var(--emerald-deep) 22%, transparent) 0%, transparent 60%), radial-gradient(50% 40% at 100% 10%, color-mix(in oklab, var(--gold) 18%, transparent) 0%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <nav className="relative border-b border-foreground/10 px-4 py-5 md:px-10">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative grid size-11 place-items-center rounded-lg bg-primary font-display text-lg font-bold text-primary-foreground shadow-md">
                L
                <span aria-hidden className="absolute -bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-accent" />
              </div>
              <div>
                <div className="font-display text-lg font-bold tracking-tight">LedgerLoan</div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">Repayment Studio</div>
              </div>
            </div>
            <div className="hidden items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground md:flex">
              <span className="size-1.5 rounded-full bg-[color:var(--success)]" />
              Live · INR · Indian numbering
            </div>
          </div>
        </nav>

        <main className="relative mx-auto max-w-[1400px] px-4 pb-16 pt-8 md:px-10 md:pt-12">
          <header className="mb-8 max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--emerald-deep)]">
              <span className="size-1.5 rounded-full bg-accent" />
              Advanced amortization engine
            </div>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl">
              A precise studio for your <span className="italic text-accent">home loan</span> repayment.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
              Rate revisions, annual step-ups, pause windows, one-off prepayments, upfront costs, and prepay-vs-invest — every lever, one canvas.
            </p>
          </header>

          <BentoKpis />

          <Tabs defaultValue="configure" className="mt-8 w-full">
            <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
              <TabsList className="inline-flex h-auto w-max gap-1 rounded-full border border-foreground/10 bg-card/70 p-1 shadow-sm backdrop-blur md:w-auto">
                <TabTrigger value="configure" icon={<Sliders className="size-3.5" />}>Configure</TabTrigger>
                <TabTrigger value="overview" icon={<LineChart className="size-3.5" />}>Overview</TabTrigger>
                <TabTrigger value="costs" icon={<Coins className="size-3.5" />}>Costs &amp; APR</TabTrigger>
                <TabTrigger value="whatif" icon={<Scale className="size-3.5" />}>What-if</TabTrigger>
                <TabTrigger value="prepay" icon={<Wallet className="size-3.5" />}>Prepay vs Invest</TabTrigger>
                <TabTrigger value="schedule" icon={<CalendarDays className="size-3.5" />}>Schedule</TabTrigger>
              </TabsList>
            </div>

            <TabsContent value="configure" className="mt-8">
              <SectionRibbon eyebrow="01 · Inputs" title="Design your loan" hint="Every card feeds the amortization engine in real time." />
              <LoanConfigPanel columns />
            </TabsContent>

            <TabsContent value="overview" className="mt-8 space-y-6">
              <SectionRibbon eyebrow="02 · Trajectory" title="Balance over time" hint="See principal, interest, and closing balance across the tenure." />
              <BalanceChart />
            </TabsContent>

            <TabsContent value="costs" className="mt-8 space-y-6">
              <SectionRibbon eyebrow="03 · True cost" title="Upfront fees & effective APR" hint="Processing, stamp duty, MODT, insurance — folded into APR." />
              <UpfrontCostsCard />
            </TabsContent>

            <TabsContent value="whatif" className="mt-8 space-y-6">
              <SectionRibbon eyebrow="04 · Simulate" title="What-if scenarios" hint="Compare alternative rate, tenure, and prepay plans side by side." />
              <WhatIfCard />
            </TabsContent>

            <TabsContent value="prepay" className="mt-8 space-y-6">
              <SectionRibbon eyebrow="05 · Trade-off" title="Prepay vs Invest" hint="Should the surplus go to the loan or the market? Model both." />
              <PrepayVsInvestCard />
            </TabsContent>

            <TabsContent value="schedule" className="mt-8 space-y-6">
              <SectionRibbon eyebrow="06 · Ledger" title="Yearly & monthly schedule" hint="Full amortization, exportable to CSV." />
              <YearlyBreakdown />
              <ScheduleTable />
            </TabsContent>
          </Tabs>
        </main>

        <footer className="relative border-t border-foreground/10 py-8">
          <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-2 px-4 text-center md:px-10">
            <div className="h-px w-16 bg-accent/60" />
            <p className="text-xs text-muted-foreground">
              Calculations are indicative. Verify with your lender before decisions.
            </p>
          </div>
        </footer>
      </div>
    </LoanProvider>
  );
}

function TabTrigger({ value, icon, children }: { value: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <TabsTrigger
      value={value}
      className="gap-1.5 rounded-full px-4 py-2 text-xs font-medium tracking-tight data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm md:text-sm"
    >
      {icon}
      {children}
    </TabsTrigger>
  );
}

function SectionRibbon({ eyebrow, title, hint }: { eyebrow: string; title: string; hint: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 border-b border-foreground/10 pb-4">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-accent">{eyebrow}</div>
        <h2 className="mt-1 font-display text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
      </div>
      <p className="hidden max-w-sm text-right text-xs text-muted-foreground md:block">{hint}</p>
    </div>
  );
}

function BentoKpis() {
  const { schedule, original, inputs } = useLoan();
  const interestSaved = original.totalInterest - schedule.totalInterest;
  const monthsSaved = original.monthsToClose - schedule.monthsToClose;
  const totalOutflow = schedule.totalPrincipal + schedule.totalInterest;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
      <div className="col-span-2 row-span-2 flex flex-col justify-between rounded-3xl bg-primary p-6 text-primary-foreground shadow-lg md:min-h-[240px] md:p-8">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">Interest you'd save</div>
          <p className="mt-3 font-display text-4xl font-bold leading-none tracking-tight md:text-6xl">
            {formatINR(Math.max(0, interestSaved), { compact: true })}
          </p>
          <p className="mt-3 text-xs text-primary-foreground/70 md:text-sm">
            vs {formatINR(original.totalInterest, { compact: true })} on the vanilla EMI plan
          </p>
        </div>
        <div className="mt-6 flex items-end justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary-foreground/60">Closing in</div>
            <p className="mt-1 font-display text-2xl font-bold tracking-tight text-accent md:text-3xl">
              {formatMonths(schedule.monthsToClose)}
            </p>
            {monthsSaved > 0 && (
              <p className="mt-1 text-[11px] text-primary-foreground/70">{monthsSaved} months earlier</p>
            )}
          </div>
          <div aria-hidden className="hidden font-display text-6xl italic text-accent/30 md:block">
            ₹
          </div>
        </div>
      </div>

      <MiniTile label="Starting EMI" value={formatINR(schedule.rows[0]?.emi ?? 0)} hint={`@ ${inputs.startRatePct}% p.a.`} />
      <MiniTile label="Final EMI" value={formatINR(schedule.finalEmi)} hint="After all step-ups" gold />
      <MiniTile label="Total outflow" value={formatINR(totalOutflow, { compact: true })} hint={`Principal ${formatINR(inputs.loanAmount, { compact: true })}`} />
      <MiniTile label="Total interest" value={formatINR(schedule.totalInterest, { compact: true })} hint={`${((schedule.totalInterest / Math.max(1, inputs.loanAmount)) * 100).toFixed(0)}% of principal`} />
    </div>
  );
}

function MiniTile({ label, value, hint, gold = false }: { label: string; value: string; hint?: string; gold?: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-card p-5 shadow-sm">
      {gold && (
        <span aria-hidden className="absolute right-4 top-4 size-2 rounded-full bg-accent shadow-[0_0_0_4px_color-mix(in_oklab,var(--gold)_20%,transparent)]" />
      )}
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={`mt-2 font-display text-xl font-bold tracking-tight md:text-2xl ${gold ? "text-accent" : "text-foreground"}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
