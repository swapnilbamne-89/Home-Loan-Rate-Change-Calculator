# Home Loan Repayment Calculator

An advanced **Home Loan Repayment Calculator** built for Indian borrowers. Model your loan against real-world scenarios — RBI/bank rate revisions, annual EMI step-ups, cash-flow pause windows, and one-off prepayments — and instantly see how much interest you save and how many months you knock off your tenure.

Currency: **INR** · Numbering: **Lakh / Crore**

---

## Features

- **Loan Basics** — Principal, starting interest rate (decimals supported, e.g. `8.5%`), tenure in years, and start date.
- **Rate Schedule** — Add any number of rate changes effective from a chosen loan month. Per change, pick the behavior:
  - *Keep EMI, adjust tenure* — EMI stays flat, tenure extends/shrinks.
  - *Keep tenure, recalc EMI* — EMI is re-amortized over the remaining tenure.
- **Step-up Plan** — Increase your EMI every year automatically:
  - **Percentage mode** (e.g. +10% annually), or
  - **Fixed amount mode** (e.g. +₹5,000 every year).
  - Configure the **apply month** (e.g. every April for salary hikes) and the **start year**.
  - Set **Extra EMIs per year** to throw a bonus payment at the principal.
- **Step-up Pause Windows** — Define month ranges (e.g. months 25–36) during which the annual step-up and the bonus extra-EMI are paused. Useful for tight cash periods. Add multiple windows.
- **One-off Prepayments** — Lump-sum amounts paid in specific months.
- **KPI Tiles** — Interest saved vs. baseline, months to close, final EMI.
- **Charts** — Balance trajectory (Standard vs. Accelerated) and yearly Principal / Interest / Extra breakdown.
- **Schedule Table** — Month-by-month amortization with notes for every rate change and step-up. Export to **CSV**.

---

## How to use

1. **Enter Loan Basics** in the left panel: principal, rate (decimals allowed), tenure, and start date.
2. **Add Rate Changes** as you receive RBI/bank revisions:
   - Click **Add** in *Rate Schedule*.
   - Set the loan month it takes effect, the new rate, and the behavior.
3. **Configure the Step-up Plan**:
   - Choose **Percentage** or **Fixed amount**.
   - Enter the increment, the calendar month it applies (e.g. April for appraisal cycles), and the loan year it starts from.
   - Optionally add **Extra EMIs / year** for an annual bonus payment.
4. **Add Pause Windows** for any period you expect cash crunch — the annual step-up and the bonus EMI are skipped within those months. Regular EMIs continue.
5. **Add One-off Prepayments** for known lump sums (bonus, tax refund, maturity proceeds).
6. **Review the dashboard**:
   - KPI tiles show interest saved, months closed early, and your final EMI.
   - The balance chart compares the original schedule to your accelerated plan.
   - The yearly bar chart breaks down principal vs. interest vs. extras.
   - The full month-wise schedule is at the bottom — click **Export CSV** to download.

All calculations update **live** as you edit.

---

## Example scenarios

- **RBI hike of 50 bps in month 13, keep EMI flat** → Add a rate change at month 13, behavior *Keep EMI, adjust tenure*. Watch tenure extend.
- **Annual salary hike of 8% → step-up EMI every April** → Set Step-up to Percentage 8%, apply month *Apr*, start year 2.
- **Maternity break for 12 months** → Add a Pause Window from month 25 to 36. Step-ups resume automatically afterward.
- **Annual bonus of ₹2L every March** → Add a One-off Prepayment for month 3, then 15, 27, …

---

## Tech stack

- **TanStack Start v1** (React 19, Vite 7) with file-based routing
- **Tailwind CSS v4** with OKLCH theme tokens (Emerald Prestige palette)
- **Recharts** for visualizations
- **Space Grotesk** (display) + **DM Sans** (body) typography
- Pure client-side amortization engine in `src/lib/loan/calculator.ts` — no backend required

---

## Project structure

```
src/
├── routes/
│   ├── __root.tsx           Root layout
│   └── index.tsx            Dashboard page
├── components/loan/
│   ├── LoanConfigPanel.tsx  Left sidebar inputs
│   ├── KpiTiles.tsx         Summary tiles
│   ├── Charts.tsx           Balance + yearly breakdown
│   ├── ScheduleTable.tsx    Month-wise table + CSV export
│   └── NumberInput.tsx      Decimal-safe number input
└── lib/loan/
    ├── calculator.ts        Amortization engine
    ├── store.tsx            React context + reducer
    ├── types.ts             Domain types
    └── format.ts            INR / Lakh-Crore formatting
```

---

## Running locally

```bash
bun install
bun run dev
```

Open the URL printed in the terminal.

Use this calculator demo link:https://home-loan-emi-planner.lovable.app/
---

## Disclaimer

Calculations are indicative. Always confirm the final numbers with your lender before making prepayment or refinancing decisions.
