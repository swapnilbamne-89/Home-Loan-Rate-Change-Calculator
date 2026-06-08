import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import type { LoanInputs, PauseWindow, Prepayment, RateChange } from "./types";
import { generateOriginalSchedule, generateSchedule } from "./calculator";

const defaultInputs: LoanInputs = {
  loanAmount: 5000000,
  startRatePct: 8.5,
  tenureYears: 20,
  startDate: new Date().toISOString().slice(0, 10),
  rateChanges: [],
  stepUp: { extraEmisPerYear: 1, annualIncrementPct: 5, applyMonth: 3 },
  pauseWindows: [],
  prepayments: [],
};

type Action =
  | { type: "patch"; patch: Partial<LoanInputs> }
  | { type: "patchStepUp"; patch: Partial<LoanInputs["stepUp"]> }
  | { type: "addRate" }
  | { type: "updateRate"; id: string; patch: Partial<RateChange> }
  | { type: "removeRate"; id: string }
  | { type: "addPause" }
  | { type: "updatePause"; id: string; patch: Partial<PauseWindow> }
  | { type: "removePause"; id: string }
  | { type: "addPrepay" }
  | { type: "updatePrepay"; id: string; patch: Partial<Prepayment> }
  | { type: "removePrepay"; id: string };

const uid = () => Math.random().toString(36).slice(2, 9);

function reducer(state: LoanInputs, action: Action): LoanInputs {
  switch (action.type) {
    case "patch":
      return { ...state, ...action.patch };
    case "patchStepUp":
      return { ...state, stepUp: { ...state.stepUp, ...action.patch } };
    case "addRate":
      return {
        ...state,
        rateChanges: [
          ...state.rateChanges,
          { id: uid(), effectiveMonth: 13, ratePct: state.startRatePct + 0.25, behavior: "keep-emi" },
        ],
      };
    case "updateRate":
      return {
        ...state,
        rateChanges: state.rateChanges.map((r) => (r.id === action.id ? { ...r, ...action.patch } : r)),
      };
    case "removeRate":
      return { ...state, rateChanges: state.rateChanges.filter((r) => r.id !== action.id) };
    case "addPause":
      return {
        ...state,
        pauseWindows: [...state.pauseWindows, { id: uid(), startMonth: 13, endMonth: 24 }],
      };
    case "updatePause":
      return {
        ...state,
        pauseWindows: state.pauseWindows.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)),
      };
    case "removePause":
      return { ...state, pauseWindows: state.pauseWindows.filter((p) => p.id !== action.id) };
    case "addPrepay":
      return {
        ...state,
        prepayments: [...state.prepayments, { id: uid(), month: 12, amount: 100000 }],
      };
    case "updatePrepay":
      return {
        ...state,
        prepayments: state.prepayments.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)),
      };
    case "removePrepay":
      return { ...state, prepayments: state.prepayments.filter((p) => p.id !== action.id) };
    default:
      return state;
  }
}

interface Ctx {
  inputs: LoanInputs;
  dispatch: React.Dispatch<Action>;
  schedule: ReturnType<typeof generateSchedule>;
  original: ReturnType<typeof generateSchedule>;
}

const LoanCtx = createContext<Ctx | null>(null);

export function LoanProvider({ children }: { children: ReactNode }) {
  const [inputs, dispatch] = useReducer(reducer, defaultInputs);
  const value = useMemo<Ctx>(() => {
    const schedule = generateSchedule(inputs);
    const original = generateOriginalSchedule(inputs);
    return { inputs, dispatch, schedule, original };
  }, [inputs]);
  return <LoanCtx.Provider value={value}>{children}</LoanCtx.Provider>;
}

export function useLoan() {
  const ctx = useContext(LoanCtx);
  if (!ctx) throw new Error("useLoan must be used inside LoanProvider");
  return ctx;
}
