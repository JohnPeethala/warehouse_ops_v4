"use client";

import React, { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import type { SubCategorySplit } from "@/app/actions/dashboard";
import { LayoutList, PieChart as PieChartIcon, BarChart2, BarChartHorizontal } from "lucide-react";

type ViewType = 'pie' | 'vbar' | 'hbar' | 'list';

const ChartCustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 text-sm flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload?.color || 'var(--primary)' }} />
        <span className="font-semibold text-foreground">{payload[0].payload?.name || payload[0].name}:</span>
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
  const [view, setView] = useState<ViewType>('pie');
  
  const legendData = subCategorySplit.map(s => ({ value: s.name, color: s.color, payload: { value: s.value } }));
  const totalSubCategories = subCategorySplit.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm h-[550px] flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-base font-bold">Ticket Composition</h2>
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md border border-border">
          <button 
            onClick={() => setView('pie')} 
            className={`p-1.5 rounded transition-colors ${view === 'pie' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`} 
            title="Pie Chart"
          >
            <PieChartIcon size={14} />
          </button>
          <button 
            onClick={() => setView('vbar')} 
            className={`p-1.5 rounded transition-colors ${view === 'vbar' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`} 
            title="Column Chart"
          >
            <BarChart2 size={14} />
          </button>
          <button 
            onClick={() => setView('hbar')} 
            className={`p-1.5 rounded transition-colors ${view === 'hbar' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`} 
            title="Bar Chart"
          >
            <BarChartHorizontal size={14} />
          </button>
          <button 
            onClick={() => setView('list')} 
            className={`p-1.5 rounded transition-colors ${view === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`} 
            title="List View"
          >
            <LayoutList size={14} />
          </button>
        </div>
      </div>
      <div className="w-full flex-1 flex flex-col min-h-0">
        
        {view === 'pie' && (
          <>
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
                  <RechartsTooltip content={<ChartCustomTooltip />} cursor={{ fill: 'transparent' }} />
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
          </>
        )}

        {view === 'vbar' && (
          <div className="w-full h-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subCategorySplit} margin={{ top: 10, right: 10, left: -20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                <RechartsTooltip content={<ChartCustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.2 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {subCategorySplit.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {view === 'hbar' && (
          <div className="w-full h-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={subCategorySplit} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.5} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={80} />
                <RechartsTooltip content={<ChartCustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.2 }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {subCategorySplit.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {view === 'list' && (
          <div className="flex flex-col gap-4 w-full h-full overflow-y-auto custom-scrollbar pr-2 pt-2 pb-4">
            {subCategorySplit.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground mt-10">No active tickets found.</p>
            ) : (
              subCategorySplit.map((entry, index) => {
                const percentage = totalSubCategories > 0 ? (entry.value / totalSubCategories) * 100 : 0;
                return (
                  <div key={`list-${index}`} className="flex flex-col gap-2 p-3 bg-muted/20 border border-border rounded-lg">
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span className="text-foreground flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: entry.color }} />
                        {entry.name}
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-foreground">{entry.value}</span>
                        <span className="text-xs font-normal text-muted-foreground w-12 text-right">{percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-muted/50 rounded-full overflow-hidden shadow-inner border border-border/50">
                      <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${percentage}%`, backgroundColor: entry.color }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>
    </div>
  );
}
