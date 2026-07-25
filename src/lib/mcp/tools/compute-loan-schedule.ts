import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import {
  generateSchedule,
  generateOriginalSchedule,
  computeUpfrontBreakdown,
  computeEmi,
} from "@/lib/loan/calculator";
import type { LoanInputs } from "@/lib/loan/types";

const rateChangeSchema = z.object({
  effectiveMonth: z.number().int().min(1),
  ratePct: z.number(),
  behavior: z.enum(["keep-emi", "keep-tenure"]).default("keep-tenure"),
});

const pauseWindowSchema = z.object({
  startMonth: z.number().int().min(1),
  endMonth: z.number().int().min(1),
});

const prepaymentSchema = z.object({
  month: z.number().int().min(1),
  amount: z.number(),
});

const stepUpSchema = z
  .object({
    extraEmisPerYear: z.number().default(0),
    incrementMode: z.enum(["percent", "amount"]).default("percent"),
    annualIncrementPct: z.number().default(0),
    annualIncrementAmount: z.number().default(0),
    applyMonth: z.number().int().min(1).max(12).default(12),
    startYear: z.number().int().min(1).default(2),
  })
  .default({
    extraEmisPerYear: 0,
    incrementMode: "percent",
    annualIncrementPct: 0,
    annualIncrementAmount: 0,
    applyMonth: 12,
    startYear: 2,
  });

const upfrontSchema = z
  .object({
    processingFeeMode: z.enum(["percent", "amount"]).default("percent"),
    processingFeePct: z.number().default(0),
    processingFeeAmount: z.number().default(0),
    processingFeeGstPct: z.number().default(18),
    processingFeeDeductedFromDisbursement: z.boolean().default(true),
    propertyValue: z.number().default(0),
    stampDutyPct: z.number().default(0),
    registrationPct: z.number().default(0),
    modtPct: z.number().default(0),
    insurancePremium: z.number().default(0),
    legalValuationFee: z.number().default(0),
    otherCharges: z.number().default(0),
  })
  .default({
    processingFeeMode: "percent",
    processingFeePct: 0,
    processingFeeAmount: 0,
    processingFeeGstPct: 18,
    processingFeeDeductedFromDisbursement: true,
    propertyValue: 0,
    stampDutyPct: 0,
    registrationPct: 0,
    modtPct: 0,
    insurancePremium: 0,
    legalValuationFee: 0,
    otherCharges: 0,
  });

export default defineTool({
  name: "compute_loan_schedule",
  title: "Compute home loan repayment schedule",
  description:
    "Computes an Indian home loan amortization schedule with support for multiple mid-tenure rate changes, annual EMI step-ups (percent or fixed rupee amount), pause windows, one-off prepayments, and upfront costs (processing fee, GST, stamp duty, MODT, insurance) with an effective APR. Returns totals, month-count-to-close, starting/steady/final EMI, an upfront-cost breakdown, and a vanilla-baseline comparison. Amounts are in INR.",
  inputSchema: {
    loanAmount: z.number().describe("Principal in INR, e.g. 5000000"),
    startRatePct: z.number().describe("Starting annual interest rate, e.g. 8.5"),
    tenureYears: z.number().describe("Original tenure in years, e.g. 20"),
    startDate: z
      .string()
      .describe("Loan start date in YYYY-MM-DD, e.g. 2025-01-01")
      .default(new Date().toISOString().slice(0, 10)),
    rateChanges: z
      .array(rateChangeSchema)
      .default([])
      .describe("List of rate revisions taking effect at specific loan months"),
    stepUp: stepUpSchema.describe("Annual EMI step-up plan"),
    pauseWindows: z
      .array(pauseWindowSchema)
      .default([])
      .describe("Month ranges where step-up and recurring extra EMIs are paused"),
    prepayments: z
      .array(prepaymentSchema)
      .default([])
      .describe("One-off principal prepayments at specific loan months"),
    upfront: upfrontSchema.describe("Upfront fees and charges for effective APR"),
    includeSchedule: z
      .boolean()
      .default(false)
      .describe("If true, include the full monthly schedule (can be large)"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (input) => {
    const inputs: LoanInputs = {
      loanAmount: input.loanAmount,
      startRatePct: input.startRatePct,
      tenureYears: input.tenureYears,
      startDate: input.startDate,
      rateChanges: input.rateChanges.map((r, i) => ({ id: `r${i}`, ...r })),
      stepUp: input.stepUp,
      pauseWindows: input.pauseWindows.map((w, i) => ({ id: `p${i}`, ...w })),
      prepayments: input.prepayments.map((p, i) => ({ id: `pp${i}`, ...p })),
      upfront: input.upfront,
    };

    const schedule = generateSchedule(inputs);
    const baseline = generateOriginalSchedule(inputs);
    const upfront = computeUpfrontBreakdown(inputs, schedule);
    const vanillaEmi = computeEmi(inputs.loanAmount, inputs.startRatePct, inputs.tenureYears * 12);

    const summary = {
      vanillaEmi: round(vanillaEmi),
      startingEmi: round(schedule.rows[0]?.emi ?? 0),
      steadyEmi: round(schedule.steadyEmi),
      finalEmi: round(schedule.finalEmi),
      monthsToClose: schedule.monthsToClose,
      monthsSavedVsBaseline: baseline.monthsToClose - schedule.monthsToClose,
      totalPrincipal: round(schedule.totalPrincipal),
      totalInterest: round(schedule.totalInterest),
      totalExtraAndPrepay: round(schedule.totalExtra),
      totalOutflow: round(schedule.totalPrincipal + schedule.totalInterest),
      baselineTotalInterest: round(baseline.totalInterest),
      interestSavedVsBaseline: round(baseline.totalInterest - schedule.totalInterest),
      upfront: {
        processingFeeTotal: round(upfront.processingFeeTotal),
        stampDuty: round(upfront.stampDuty),
        registration: round(upfront.registration),
        modt: round(upfront.modt),
        insurance: round(upfront.insurance),
        legalValuation: round(upfront.legalValuation),
        other: round(upfront.other),
        totalUpfront: round(upfront.total),
        netDisbursed: round(upfront.netDisbursed),
        effectiveAprPct: Number(upfront.effectiveAprPct.toFixed(4)),
      },
    };

    const structuredContent: Record<string, unknown> = { summary };

    if (input.includeSchedule) {
      structuredContent.schedule = schedule.rows.map((r) => ({
        month: r.month,
        date: r.date.toISOString().slice(0, 10),
        openingBalance: round(r.openingBalance),
        emi: round(r.emi),
        principal: round(r.principal),
        interest: round(r.interest),
        extra: round(r.extra),
        prepayment: round(r.prepayment),
        closingBalance: round(r.closingBalance),
        appliedRatePct: r.appliedRatePct,
        notes: r.notes,
      }));
    }

    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent,
    };
  },
});

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
