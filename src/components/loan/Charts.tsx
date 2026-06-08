import { useLoan } from "@/lib/loan/store";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar } from "recharts";
import { useMemo } from "react";
import { formatINR } from "@/lib/loan/format";

const EMERALD = "#064e3b";
const GOLD = "#c9a84c";
const EMERALD_MID = "#0d7a5f";

export function BalanceChart() {
  const { schedule, original } = useLoan();
  const data = useMemo(() => {
    const len = Math.max(schedule.rows.length, original.rows.length);
    const arr: { month: number; revised: number | null; standard: number | null }[] = [];
    for (let i = 0; i < len; i++) {
      arr.push({
        month: i + 1,
        revised: schedule.rows[i]?.closingBalance ?? null,
        standard: original.rows[i]?.closingBalance ?? null,
      });
    }
    return arr;
  }, [schedule, original]);

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold tracking-tight">Repayment Trajectory</h2>
        <div className="flex gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: EMERALD }} /> Standard</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: GOLD }} /> Accelerated</span>
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#0000000a" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#5a6b67" }} tickLine={false} axisLine={false} tickFormatter={(m) => `${Math.round(m / 12)}y`} interval={Math.max(1, Math.floor(data.length / 8))} />
            <YAxis tick={{ fontSize: 11, fill: "#5a6b67" }} tickLine={false} axisLine={false} tickFormatter={(v) => formatINR(v, { compact: true })} width={70} />
            <Tooltip
              contentStyle={{ background: "#fff", border: "1px solid #e6e0cf", borderRadius: 8, fontSize: 12 }}
              formatter={(v: number, n) => [formatINR(v), n === "revised" ? "Accelerated" : "Standard"]}
              labelFormatter={(m) => `Month ${m}`}
            />
            <Line type="monotone" dataKey="standard" stroke={EMERALD} strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="revised" stroke={GOLD} strokeWidth={2.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function YearlyBreakdown() {
  const { schedule } = useLoan();
  const data = useMemo(() => {
    const byYear = new Map<number, { year: number; principal: number; interest: number; extra: number }>();
    for (const r of schedule.rows) {
      const y = Math.ceil(r.month / 12);
      const cur = byYear.get(y) ?? { year: y, principal: 0, interest: 0, extra: 0 };
      cur.principal += r.principal;
      cur.interest += r.interest;
      cur.extra += r.extra + r.prepayment;
      byYear.set(y, cur);
    }
    return Array.from(byYear.values());
  }, [schedule]);

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="mb-6 font-display text-lg font-bold tracking-tight">Principal vs Interest by Year</h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#0000000a" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#5a6b67" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#5a6b67" }} tickLine={false} axisLine={false} tickFormatter={(v) => formatINR(v, { compact: true })} width={70} />
            <Tooltip
              contentStyle={{ background: "#fff", border: "1px solid #e6e0cf", borderRadius: 8, fontSize: 12 }}
              formatter={(v: number, n) => [formatINR(v), n]}
              labelFormatter={(y) => `Year ${y}`}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="principal" stackId="a" fill={EMERALD_MID} name="Principal" />
            <Bar dataKey="interest" stackId="a" fill={GOLD} name="Interest" />
            <Bar dataKey="extra" stackId="a" fill={EMERALD} name="Extra/Prepay" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
