import { createFileRoute } from "@tanstack/react-router";
import { LoanProvider } from "@/lib/loan/store";
import { LoanConfigPanel } from "@/components/loan/LoanConfigPanel";
import { KpiTiles } from "@/components/loan/KpiTiles";
import { BalanceChart, YearlyBreakdown } from "@/components/loan/Charts";
import { ScheduleTable } from "@/components/loan/ScheduleTable";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home Loan Repayment Calculator — Rate changes, step-up & prepayments" },
      { name: "description", content: "Model your home loan with multiple interest rate changes, annual EMI step-up, pause windows, and one-off prepayments. Schedule + charts." },
      { property: "og:title", content: "Home Loan Repayment Calculator" },
      { property: "og:description", content: "Advanced amortization with rate changes, step-up EMIs, and prepayments." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <LoanProvider>
      <div className="min-h-screen bg-background text-foreground">
        <nav className="border-b bg-card px-6 py-4 md:px-10">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-md bg-primary font-display text-base font-bold text-primary-foreground">L</div>
              <div>
                <div className="font-display text-base font-bold tracking-tight">LedgerLoan</div>
                <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Repayment Studio</div>
              </div>
            </div>
            <div className="hidden text-xs text-muted-foreground md:block">
              INR · Indian numbering · Updated live
            </div>
          </div>
        </nav>

        <main className="mx-auto grid max-w-[1400px] grid-cols-12 gap-6 p-6 md:p-10">
          <aside className="col-span-12 lg:col-span-4 xl:col-span-3">
            <LoanConfigPanel />
          </aside>

          <section className="col-span-12 space-y-6 lg:col-span-8 xl:col-span-9">
            <header>
              <h1 className="font-display text-3xl font-bold tracking-tight">Home Loan Repayment</h1>
              <p className="mt-1 text-sm text-muted-foreground">Model rate changes, annual EMI step-ups, pause windows, and one-off prepayments — see the impact instantly.</p>
            </header>
            <KpiTiles />
            <BalanceChart />
            <YearlyBreakdown />
            <ScheduleTable />
          </section>
        </main>

        <footer className="border-t py-6 text-center text-xs text-muted-foreground">
          Calculations are indicative. Verify with your lender before taking decisions.
        </footer>
      </div>
    </LoanProvider>
  );
}
