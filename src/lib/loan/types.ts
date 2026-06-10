export type RateChangeBehavior = "keep-emi" | "keep-tenure";

export interface RateChange {
  id: string;
  effectiveMonth: number; // 1-based month index into the loan
  ratePct: number; // annual %
  behavior: RateChangeBehavior;
}

export interface PauseWindow {
  id: string;
  startMonth: number;
  endMonth: number;
}

export interface Prepayment {
  id: string;
  month: number;
  amount: number;
}

export type IncrementMode = "percent" | "amount";

export interface StepUpPlan {
  extraEmisPerYear: number; // e.g. 1 = one bonus EMI per year
  incrementMode: IncrementMode; // 'percent' = % increase, 'amount' = flat ₹ added to EMI
  annualIncrementPct: number; // used when incrementMode = 'percent'
  annualIncrementAmount: number; // used when incrementMode = 'amount' (₹ added to EMI each step-up)
  applyMonth: number; // 1..12 (calendar month-of-loan-year when bonus & step-up apply)
  startYear: number; // loan year from which step-up begins (e.g. 2 = starting year 2)
}

export interface UpfrontCosts {
  // Processing fee — typically % of loan, often deducted from disbursement
  processingFeeMode: "percent" | "amount";
  processingFeePct: number; // e.g. 0.5
  processingFeeAmount: number; // flat ₹ alternative
  processingFeeGstPct: number; // default 18
  processingFeeDeductedFromDisbursement: boolean; // affects effective APR
  // Stamp duty on property — % of property value (or loan if value not given)
  propertyValue: number; // ₹; if 0, falls back to loan amount for stamp duty/MODT base
  stampDutyPct: number; // e.g. 5
  registrationPct: number; // e.g. 1
  // MODT — Memorandum of Deposit of Title Deeds — usually 0.1–0.5% of loan
  modtPct: number;
  // One-time charges
  insurancePremium: number; // ₹ lump sum
  legalValuationFee: number; // ₹
  otherCharges: number; // ₹
}

export interface LoanInputs {
  loanAmount: number;
  startRatePct: number;
  tenureYears: number;
  startDate: string; // YYYY-MM-DD
  rateChanges: RateChange[];
  stepUp: StepUpPlan;
  pauseWindows: PauseWindow[];
  prepayments: Prepayment[];
  upfront: UpfrontCosts;
}


export interface ScheduleRow {
  month: number;
  date: Date;
  openingBalance: number;
  emi: number;
  principal: number;
  interest: number;
  extra: number; // recurring extra EMI bonus
  prepayment: number; // one-off
  closingBalance: number;
  appliedRatePct: number;
  notes: string[];
}

export interface ScheduleResult {
  rows: ScheduleRow[];
  totalInterest: number;
  totalPrincipal: number;
  totalExtra: number;
  monthsToClose: number;
  finalEmi: number;
}
