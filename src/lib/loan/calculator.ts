import type { LoanInputs, ScheduleResult, ScheduleRow } from "./types";

const SAFETY_CAP = 720;

export function computeEmi(principal: number, annualRatePct: number, months: number): number {
  if (months <= 0) return principal;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / months;
  const pow = Math.pow(1 + r, months);
  return (principal * r * pow) / (pow - 1);
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth() + months, 1);
  return d;
}

function inAnyWindow(month: number, windows: { startMonth: number; endMonth: number }[]) {
  return windows.some((w) => month >= w.startMonth && month <= w.endMonth);
}

export function generateSchedule(inputs: LoanInputs): ScheduleResult {
  const rows: ScheduleRow[] = [];
  const totalMonthsOriginal = Math.round(inputs.tenureYears * 12);
  const startDate = new Date(inputs.startDate);

  let balance = inputs.loanAmount;
  let currentRate = inputs.startRatePct;
  let remainingMonths = totalMonthsOriginal;
  let currentEmi = computeEmi(balance, currentRate, remainingMonths);

  const rateChangesSorted = [...inputs.rateChanges].sort((a, b) => a.effectiveMonth - b.effectiveMonth);
  const prepayByMonth = new Map<number, number>();
  for (const p of inputs.prepayments) {
    prepayByMonth.set(p.month, (prepayByMonth.get(p.month) ?? 0) + p.amount);
  }

  let totalInterest = 0;
  let totalPrincipal = 0;
  let totalExtra = 0;

  for (let m = 1; m <= SAFETY_CAP && balance > 0.5; m++) {
    const notes: string[] = [];
    // Apply rate change taking effect this month
    const rc = rateChangesSorted.find((r) => r.effectiveMonth === m);
    if (rc) {
      currentRate = rc.ratePct;
      if (rc.behavior === "keep-tenure") {
        const remaining = Math.max(1, totalMonthsOriginal - (m - 1));
        currentEmi = computeEmi(balance, currentRate, remaining);
      } else {
        // keep EMI: tenure auto-extends; nothing to do to EMI
      }
      notes.push(`Rate → ${currentRate}% (${rc.behavior === "keep-tenure" ? "EMI recalc" : "tenure adj"})`);
    }

    // Step-up & extra EMI: applied on configured month of each year (after first year)
    const yearIndex = Math.floor((m - 1) / 12); // 0 in year 1
    const monthOfYear = ((m - 1) % 12) + 1;
    const isStepUpMonth = monthOfYear === inputs.stepUp.applyMonth && yearIndex >= 1;
    if (isStepUpMonth) {
      const paused = inAnyWindow(m, inputs.pauseWindows);
      if (!paused && inputs.stepUp.annualIncrementPct > 0) {
        currentEmi = currentEmi * (1 + inputs.stepUp.annualIncrementPct / 100);
        notes.push(`Step-up +${inputs.stepUp.annualIncrementPct}%`);
      }
    }

    const monthlyRate = currentRate / 100 / 12;
    const interest = balance * monthlyRate;
    let emiThis = Math.min(currentEmi, balance + interest);
    let principal = emiThis - interest;

    // Recurring extra EMI bonus (frequency per year) — apply on step-up month only, not paused
    let extra = 0;
    if (isStepUpMonth && inputs.stepUp.extraEmisPerYear > 0) {
      extra = currentEmi * inputs.stepUp.extraEmisPerYear;
    }

    // One-off prepayment
    const prepay = prepayByMonth.get(m) ?? 0;

    let openingBalance = balance;
    let closing = balance - principal - extra - prepay;
    if (closing < 0) {
      const overpay = -closing;
      // refund the overpay from the largest discretionary bucket
      if (prepay >= overpay) {
        // adjust prepay
        closing = 0;
      } else if (extra >= overpay) {
        extra -= overpay;
        closing = 0;
      } else {
        principal -= overpay;
        emiThis = principal + interest;
        closing = 0;
      }
    }

    totalInterest += interest;
    totalPrincipal += principal + extra + prepay;
    totalExtra += extra + prepay;

    const date = addMonths(startDate, m - 1);
    rows.push({
      month: m,
      date,
      openingBalance,
      emi: emiThis,
      principal,
      interest,
      extra,
      prepayment: prepay,
      closingBalance: closing,
      appliedRatePct: currentRate,
      notes,
    });

    balance = closing;
    remainingMonths--;
  }

  return {
    rows,
    totalInterest,
    totalPrincipal,
    totalExtra,
    monthsToClose: rows.length,
    finalEmi: rows.length ? rows[rows.length - 1].emi : 0,
  };
}

export function generateOriginalSchedule(inputs: LoanInputs): ScheduleResult {
  const baseline: LoanInputs = {
    ...inputs,
    rateChanges: [],
    stepUp: { extraEmisPerYear: 0, annualIncrementPct: 0, applyMonth: 12 },
    pauseWindows: [],
    prepayments: [],
  };
  return generateSchedule(baseline);
}
