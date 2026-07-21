import React from "react";
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip as RechartsTooltip, LabelList } from "recharts";
import { CalendarDays } from "lucide-react";
import type { SubCategorySplit } from "@/app/actions/dashboard";

const safeDateParse = (dateString: string) => {
  if (!dateString) return new Date();
  const parts = dateString.split("T")[0].split("-");
  if (parts.length === 3) {
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }
  return new Date(dateString);
};

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Filter out the 'total' line payload so it doesn't duplicate in the tooltip
    const validPayload = payload.filter((entry: any) => entry.value > 0 && entry.dataKey !== 'total');
    const totalCount = validPayload.reduce((acc: number, curr: any) => acc + curr.value, 0);

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 text-sm min-w-[150px]">
        <p className="font-bold border-b border-border pb-1 mb-2">
          {safeDateParse(label).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
        </p>
        {validPayload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between text-xs py-0.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="text-muted-foreground">{entry.name}</span>
            </div>
            <span className="font-bold text-foreground">{entry.value}</span>
          </div>
        ))}
        {validPayload.length > 0 && (
          <div className="mt-2 pt-1 border-t border-border flex items-center justify-between text-xs">
            <span className="font-bold text-muted-foreground">Total</span>
            <span className="font-black text-foreground">{totalCount}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const HorizontalCustomLegend = ({ payload }: any) => {
  // Filter out the 'total' line from the legend
  const validPayload = payload.filter((entry: any) => entry.dataKey !== 'total');
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 pt-2 max-h-16 overflow-y-auto custom-scrollbar">
      {validPayload.map((entry: any, index: number) => (
        <div key={`item-${index}`} className="flex items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }} />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

interface TrendChartProps {
  futureSchedule: any[];
  subCategorySplit: SubCategorySplit[];
}

export function TrendChart({ futureSchedule, subCategorySplit }: TrendChartProps) {
  // Pre-calculate totals for the label
  const enrichedSchedule = futureSchedule.map(item => {
    const total = subCategorySplit.reduce((sum, cat) => sum + (item[cat.name] || 0), 0);
    return { ...item, total };
  });

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm lg:col-span-2 flex flex-col h-[550px]">
      <h2 className="text-base font-bold mb-6 flex items-center gap-2">
        <CalendarDays className="text-primary" size={20} />
        Future Scheduled Workload
      </h2>
      <div className="flex-1 w-full min-h-0 h-[450px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={enrichedSchedule} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
            <XAxis dataKey="date" tickFormatter={(val) => safeDateParse(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} axisLine={{ stroke: "currentColor", opacity: 0.5 }} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.7 }} dy={10} />
            <YAxis axisLine={{ stroke: "currentColor", opacity: 0.5 }} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.7 }} />
            <RechartsTooltip cursor={{ fill: 'currentColor', opacity: 0.05 }} content={<CustomChartTooltip />} />
            <Legend content={<HorizontalCustomLegend />} />
            {subCategorySplit.map((cat) => (
              <Bar key={cat.name} dataKey={cat.name} stackId="1" fill={cat.color} radius={[6, 6, 6, 6]} stroke="hsl(var(--card))" strokeWidth={1} maxBarSize={64} />
            ))}
            <Line type="monotone" dataKey="total" stroke="none" isAnimationActive={false} activeDot={false} dot={false}>
              <LabelList 
                dataKey="total" 
                position="top" 
                fill="currentColor" 
                fontSize={12} 
                fontWeight="900" 
                offset={10}
                formatter={(val: number) => val > 0 ? val : ''}
              />
            </Line>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
