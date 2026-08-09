"use client";

import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import { AlertCircle } from "lucide-react";
import { CustomSelect } from "@/components/shared/CustomSelect";

// Custom Recharts Tooltip renderer
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const s = payload.find((p: any) => p.dataKey === 'success' || p.dataKey === 'completionRate')?.value || 0;
    const p = payload.find((p: any) => p.dataKey === 'pending')?.value || 0;
    const n = payload.find((p: any) => p.dataKey === 'notDone')?.value || 0;
    
    return (
      <div className="bg-popover border border-border shadow-xl rounded-lg p-3 text-xs font-bold min-w-[120px]">
        <div className="flex items-center gap-1.5 text-muted-foreground mb-2 pb-2 border-b border-border">
          {label}
          {p > 0 && <AlertCircle size={12} className="text-rose-500" />}
        </div>
        <div className="flex flex-col gap-1.5">
          {payload[0].dataKey === 'completionRate' ? (
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">% Done:</span>
              <span className="text-emerald-500">{s}%</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Done:</span>
                <span className="text-emerald-500">{s}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Not Done:</span>
                <span className="text-rose-500">{n}</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export function HistoricalTrendChart({ historicalCompletion }: { historicalCompletion: any[] }) {
  const [trendDays, setTrendDays] = useState(7);
  
  // historicalCompletion contains up to 30 days. We slice the end based on trendDays.
  const chartData = historicalCompletion
    .slice(-trendDays)
    .filter((d: any) => d.total > 0)
    .map((d: any) => ({
      ...d,
      completionRate: d.total > 0 ? Math.round((d.success / d.total) * 100) : 0
    }));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm xl:col-span-2">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-bold">{trendDays}-Day Completion Trend</h2>
          </div>
          
          <div className="w-32">
            <CustomSelect
              value={trendDays.toString()}
              options={[
                { value: "7", label: "7 Days" },
                { value: "14", label: "14 Days" },
                { value: "30", label: "30 Days" }
              ]}
              onChange={(val) => {
                if (val) setTrendDays(Number(val));
              }}
              placeholder="Select cycle"
            />
          </div>
        </div>
        
        <div className="h-[260px] w-full mt-2">
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 35, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorNotDone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
              <XAxis dataKey="date" padding={{ left: 20, right: 20 }} axisLine={{ stroke: "currentColor", opacity: 0.5 }} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.7 }} dy={10} />
              <YAxis hide={true} axisLine={{ stroke: "currentColor", opacity: 0.5 }} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.7 }} />
              <RechartsTooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ stroke: 'currentColor', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.3 }} />
              <Area type="monotone" dataKey="success" name="Done" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSuccess)" label={{ fill: 'currentColor', fontSize: 13, fontWeight: 'bold', position: 'top', offset: 12 }} dot={{ r: 4, fill: 'currentColor', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#10b981', stroke: 'currentColor', strokeWidth: 2 }} />
              <Area type="monotone" dataKey="notDone" name="Not Done" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorNotDone)" label={{ fill: 'currentColor', fontSize: 13, fontWeight: 'bold', position: 'top', offset: 12 }} dot={{ r: 4, fill: 'currentColor', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#f43f5e', stroke: 'currentColor', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* The Data Matrix */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col xl:col-span-1 max-h-[400px]">
        <h2 className="text-base font-bold mb-4">{trendDays}-Day Data Matrix</h2>
        <div className="flex-1 overflow-auto custom-scrollbar -mx-2 px-2">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 sticky top-0 text-[10px] uppercase text-muted-foreground font-bold z-10 shadow-sm border-b border-border">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-2 py-2 text-center">Tasks</th>
                <th className="px-2 py-2 text-center">Vehicles</th>
                <th className="px-2 py-2 text-center">D/V</th>
                <th className="px-2 py-2 text-center">Breakdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {chartData.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 font-medium whitespace-nowrap flex items-center gap-1.5">
                    {row.date}
                    {row.pending > 0 && <AlertCircle size={14} className="text-rose-500" />}
                  </td>
                  <td className="px-2 py-2 text-center font-semibold">{row.total}</td>
                  <td className="px-2 py-2 text-center">{row.vehicles}</td>
                  <td className="px-2 py-2 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${row.tasksPerVehicle >= 7 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                      {row.tasksPerVehicle}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-center text-xs font-bold whitespace-nowrap uppercase">
                    <span className="text-emerald-500/90">{row.success}</span><span className="text-muted-foreground/30 mx-1">/</span>
                    <span className="text-rose-500/90">{row.notDone}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
