"use client";

import React from "react";
import { XCircle } from "lucide-react";

type Props = {
  activeFilters: { key: string, val: string, label: string }[];
  removeFilter: (key: string, val: string) => void;
  clearAllFilters: () => void;
  onFilterClick?: (key: string, val: string) => void;
};

export function ActiveFiltersBar({ activeFilters, removeFilter, clearAllFilters, onFilterClick }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-3 min-h-[32px] px-1">
      <div className="flex items-center flex-wrap gap-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-1">Active Filters:</span>
        {activeFilters.length === 0 ? (
          <span className="text-[11px] font-medium text-muted-foreground/50 italic">None</span>
        ) : (
          <>
            {activeFilters.map(af => {
              const colorClass = ({
                check: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700",
                prio: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/60",
                schedule: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60",
                date: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60",
                tags: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/60",
                ops: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60",
                contactName: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-900/80",
              } as Record<string, string>)[af.key] || "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60";

              return (
                <div key={af.key + af.val} className={`flex items-center gap-1.5 border rounded-full px-2.5 py-0.5 text-[11px] font-semibold shadow-sm transition-all ${colorClass.split(' hover:')[0]}`}>
                  <span 
                    onClick={() => onFilterClick && onFilterClick(af.key, af.val)}
                    className={onFilterClick ? "cursor-pointer hover:underline" : ""}
                  >
                    {af.label}
                  </span>
                  <button 
                    onClick={() => removeFilter(af.key, af.val)}
                    className={`rounded-full p-0.5 transition-colors ${colorClass.split(' ').find(c => c.startsWith('hover:')) || ''} ${colorClass.split(' ').find(c => c.startsWith('dark:hover:')) || ''}`}
                  >
                    <XCircle size={12} className="opacity-70" />
                  </button>
                </div>
              );
            })}
            <button 
              onClick={clearAllFilters}
              className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 ml-2"
            >
              Clear All
            </button>
          </>
        )}
      </div>
    </div>
  );
}
