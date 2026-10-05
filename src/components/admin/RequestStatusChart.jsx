import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const STATUS_META = [
  { key: "open", label: "Open", color: "hsl(var(--primary))" },
  { key: "in_progress", label: "In Progress", color: "hsl(33 42% 78%)" },
  { key: "scheduled", label: "Scheduled", color: "hsl(var(--muted-foreground))" },
  { key: "completed", label: "Completed", color: "hsl(33 42% 40%)" },
  { key: "cancelled", label: "Cancelled", color: "hsl(var(--border))" },
];

export default function RequestStatusChart({ rows }) {
  const data = STATUS_META
    .map((m) => ({ ...m, count: rows.find((r) => r.status === m.key)?.count || 0 }))
    .filter((d) => d.count > 0);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No service requests yet.</p>;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-4">
      <div className="w-full max-w-[220px] h-[200px] shrink-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value, name) => [`${value} request${value === 1 ? "" : "s"}`, name]}
            />
            <Pie data={data} dataKey="count" nameKey="label" innerRadius={60} outerRadius={90} paddingAngle={3} stroke="none">
              {data.map((d) => <Cell key={d.key} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-display text-3xl text-foreground">{total}</span>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Requests</span>
        </div>
      </div>
      <ul className="w-full space-y-2.5">
        {data.map((d) => (
          <li key={d.key} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2.5 text-foreground/90">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              {d.label}
            </span>
            <span className="text-muted-foreground">{Math.round((d.count / total) * 100)}% · {d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}