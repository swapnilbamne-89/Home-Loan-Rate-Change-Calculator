import { createFileRoute } from "@tanstack/react-router";
import { LoanProvider } from "@/lib/loan/store";
import { LoanConfigPanel } from "@/components/loan/LoanConfigPanel";
import { KpiTiles } from "@/components/loan/KpiTiles";
import { BalanceChart, YearlyBreakdown } from "@/components/loan/Charts";
import { ScheduleTable } from "@/components/loan/ScheduleTable";
import { UpfrontCostsCard } from "@/components/loan/UpfrontCostsCard";
import { PrepayVsInvestCard } from "@/components/loan/PrepayVsInvestCard";
import { WhatIfCard } from "@/components/loan/WhatIfCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";


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

        <main className="mx-auto grid max-w-[1400px] grid-cols-12 gap-6 p-4 md:p-10">
          <aside className="hidden lg:col-span-4 lg:block xl:col-span-3">
            <div className="sticky top-6">
              <LoanConfigPanel />
            </div>
          </aside>

          <section className="col-span-12 space-y-6 lg:col-span-8 xl:col-span-9">
            <header>
              <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Home Loan Repayment</h1>
              <p className="mt-1 text-sm text-muted-foreground">Model rate changes, step-ups, pauses, and prepayments — instantly.</p>
            </header>

            <KpiTiles />

            <Tabs defaultValue="overview" className="w-full">
              <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
                <TabsList className="inline-flex h-auto w-max gap-1 bg-secondary/60 p-1 md:w-full">
                  <TabsTrigger value="overview" className="px-3 py-1.5 text-xs md:text-sm">Overview</TabsTrigger>
                  <TabsTrigger value="costs" className="px-3 py-1.5 text-xs md:text-sm">Costs &amp; APR</TabsTrigger>
                  <TabsTrigger value="whatif" className="px-3 py-1.5 text-xs md:text-sm">What-if</TabsTrigger>
                  <TabsTrigger value="prepay" className="px-3 py-1.5 text-xs md:text-sm">Prepay vs Invest</TabsTrigger>
                  <TabsTrigger value="schedule" className="px-3 py-1.5 text-xs md:text-sm">Schedule</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="mt-6 space-y-6">
                <BalanceChart />
              </TabsContent>
              <TabsContent value="costs" className="mt-6 space-y-6">
                <UpfrontCostsCard />
              </TabsContent>
              <TabsContent value="whatif" className="mt-6 space-y-6">
                <WhatIfCard />
              </TabsContent>
              <TabsContent value="prepay" className="mt-6 space-y-6">
                <PrepayVsInvestCard />
              </TabsContent>
              <TabsContent value="schedule" className="mt-6 space-y-6">
                <YearlyBreakdown />
                <ScheduleTable />
              </TabsContent>
            </Tabs>
          </section>
        </main>

        {/* Mobile edit-loan floating button + bottom sheet */}
        <div className="fixed bottom-4 right-4 z-40 lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="lg" className="rounded-full shadow-lg">
                <SlidersHorizontal className="mr-2 size-4" /> Edit loan
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Loan configuration</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <LoanConfigPanel />
              </div>
            </SheetContent>
          </Sheet>
        </div>


        <footer className="border-t py-6 text-center text-xs text-muted-foreground">
          Calculations are indicative. Verify with your lender before taking decisions.
        </footer>
      </div>
    </LoanProvider>
  );
}
