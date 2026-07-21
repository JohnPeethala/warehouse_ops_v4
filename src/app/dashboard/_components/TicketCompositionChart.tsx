import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import type { SubCategorySplit } from "@/app/actions/dashboard";

const PieCustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 text-sm flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload.color }} />
        <span className="font-semibold text-foreground">{payload[0].name}:</span>
        <span className="font-bold">{payload[0].value}</span>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: any) => {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-h-[160px] overflow-y-auto custom-scrollbar">
      {payload.map((entry: any, index: number) => (
        <div key={`item-${index}`} className="flex items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <div className="w-2.5 h-2.5 rounded-sm mr-2 shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="truncate flex-1" title={entry.value}>{entry.value}</span>
          <span className="ml-1 text-foreground shrink-0">{entry.payload.value}</span>
        </div>
      ))}
    </div>
  );
};

export function TicketCompositionChart({ subCategorySplit }: { subCategorySplit: SubCategorySplit[] }) {
  const legendData = subCategorySplit.map(s => ({ value: s.name, color: s.color, payload: { value: s.value } }));
  const totalSubCategories = subCategorySplit.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm h-[550px] flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-base font-bold">Ticket Composition</h2>
      </div>
      <div className="w-full flex-1 flex flex-col min-h-0">
        <div className="w-full flex-1 relative min-h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={subCategorySplit}
                cx="50%"
                cy="50%"
                innerRadius={100}
                outerRadius={140}
                paddingAngle={5}
                cornerRadius={6}
                dataKey="value"
                nameKey="name"
                stroke="none"
                activeShape={false}
              >
                {subCategorySplit.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip content={<PieCustomTooltip />} cursor={{ fill: 'transparent' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
            <span className="text-3xl font-black text-foreground">{totalSubCategories}</span>
            <span className="text-xs text-muted-foreground font-bold uppercase mt-1">Tickets</span>
          </div>
        </div>
        <div className="w-full mt-6 shrink-0">
          {subCategorySplit.length > 0 ? (
            <CustomLegend payload={legendData} />
          ) : (
            <p className="text-center text-sm text-muted-foreground">No active tickets found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
