import { defineMcp } from "@lovable.dev/mcp-js";
import computeLoanSchedule from "./tools/compute-loan-schedule";

export default defineMcp({
  name: "ledgerloan-mcp",
  title: "LedgerLoan — Home Loan EMI Planner",
  version: "0.1.0",
  instructions:
    "Tools for modeling Indian home loan repayment. Use `compute_loan_schedule` to compute EMI, total interest, months-to-close, effective APR and (optionally) the full monthly amortization schedule, with support for mid-tenure rate changes, annual EMI step-ups, pause windows, one-off prepayments and upfront costs (processing fee, GST, stamp duty, MODT, insurance). All amounts are INR.",
  tools: [computeLoanSchedule],
});
