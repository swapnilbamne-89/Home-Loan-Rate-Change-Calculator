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
    const loanYear = Math.floor((m - 1) / 12) + 1; // 1 in year 1
    const monthOfYear = ((m - 1) % 12) + 1;
    const startYear = Math.max(1, inputs.stepUp.startYear ?? 2);
    const isStepUpMonth = monthOfYear === inputs.stepUp.applyMonth && loanYear >= startYear;
    if (isStepUpMonth) {
      const paused = inAnyWindow(m, inputs.pauseWindows);
      if (!paused) {
        if (inputs.stepUp.incrementMode === "amount" && inputs.stepUp.annualIncrementAmount > 0) {
          currentEmi = currentEmi + inputs.stepUp.annualIncrementAmount;
          notes.push(`Step-up +₹${inputs.stepUp.annualIncrementAmount.toLocaleString("en-IN")}`);
        } else if (inputs.stepUp.annualIncrementPct > 0) {
          currentEmi = currentEmi * (1 + inputs.stepUp.annualIncrementPct / 100);
          notes.push(`Step-up +${inputs.stepUp.annualIncrementPct}%`);
        }
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
    stepUp: { extraEmisPerYear: 0, incrementMode: "percent", annualIncrementPct: 0, annualIncrementAmount: 0, applyMonth: 12, startYear: 2 },
    pauseWindows: [],
    prepayments: [],
  };
  return generateSchedule(baseline);
}

// ============= Upfront cost breakdown =============

export interface UpfrontBreakdown {
  processingFeeBase: number;
  processingFeeGst: number;
  processingFeeTotal: number;
  stampDuty: number;
  registration: number;
  modt: number;
  insurance: number;
  legalValuation: number;
  other: number;
  total: number; // sum of everything above
  netDisbursed: number; // loan amount minus what's deducted from disbursement
  effectiveAprPct: number; // APR factoring in fees deducted from disbursement
}

export function computeUpfrontBreakdown(
  inputs: LoanInputs,
  schedule: ScheduleResult,
): UpfrontBreakdown {
  const u = inputs.upfront;
  const propertyBase = u.propertyValue > 0 ? u.propertyValue : inputs.loanAmount;

  const processingFeeBase =
    u.processingFeeMode === "percent"
      ? (inputs.loanAmount * u.processingFeePct) / 100
      : u.processingFeeAmount;
  const processingFeeGst = (processingFeeBase * u.processingFeeGstPct) / 100;
  const processingFeeTotal = processingFeeBase + processingFeeGst;

  const stampDuty = (propertyBase * u.stampDutyPct) / 100;
  const registration = (propertyBase * u.registrationPct) / 100;
  const modt = (inputs.loanAmount * u.modtPct) / 100;

  const total =
    processingFeeTotal +
    stampDuty +
    registration +
    modt +
    u.insurancePremium +
    u.legalValuationFee +
    u.otherCharges;

  const netDisbursed = u.processingFeeDeductedFromDisbursement
    ? inputs.loanAmount - processingFeeTotal
    : inputs.loanAmount;

  const effectiveAprPct = computeAprFromCashflows(netDisbursed, schedule);

  return {
    processingFeeBase,
    processingFeeGst,
    processingFeeTotal,
    stampDuty,
    registration,
    modt,
    insurance: u.insurancePremium,
    legalValuation: u.legalValuationFee,
    other: u.otherCharges,
    total,
    netDisbursed,
    effectiveAprPct,
  };
}

// Solve for monthly rate r such that NPV of EMI cashflows = netDisbursed,
// using bisection. Returns annual % (APR, nominal monthly-compounded).
function computeAprFromCashflows(netDisbursed: number, schedule: ScheduleResult): number {
  const flows = schedule.rows.map((r) => r.principal + r.interest + r.extra + r.prepayment);
  if (netDisbursed <= 0 || flows.length === 0) return 0;

  const npv = (r: number) => {
    let s = 0;
    for (let i = 0; i < flows.length; i++) s += flows[i] / Math.pow(1 + r, i + 1);
    return s - netDisbursed;
  };

  let lo = 0;
  let hi = 1; // 100% monthly — absurdly high upper bound
  // Expand hi if needed
  for (let i = 0; i < 30 && npv(hi) < 0; i++) hi *= 2;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const v = npv(mid);
    if (Math.abs(v) < 1) return mid * 12 * 100;
    if (v > 0) lo = mid;
    else hi = mid;
  }
  return ((lo + hi) / 2) * 12 * 100;
}

