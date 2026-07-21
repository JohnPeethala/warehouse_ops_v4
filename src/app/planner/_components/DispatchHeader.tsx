"use client";

import { Printer } from "lucide-react";
import { CalendarDropdown } from "./CalendarDropdown";
import { useRoutePlanner } from "./RoutePlannerContext";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface DispatchHeaderProps {
  isScrolled: boolean;
  unassignedCount: number;
  totalTickets: number;
}

export function DispatchHeader({ isScrolled, unassignedCount, totalTickets }: DispatchHeaderProps) {
  const context = useRoutePlanner();
  const [countsMap, setCountsMap] = useState<Record<string, number>>({});
  const supabase = createClient();

  useEffect(() => {
    async function fetchCounts() {
      const { data } = await supabase.from('ops_dispatch_log').select('scheduled_date');
      if (data) {
        const map: Record<string, number> = {};
        data.forEach((d: any) => {
          if (d.scheduled_date) {
            map[d.scheduled_date] = (map[d.scheduled_date] || 0) + 1;
          }
        });
        setCountsMap(map);
      }
    }
    fetchCounts();
  }, [supabase]);

  return (
    <div className={`relative px-3 py-2 flex items-center justify-between shrink-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-card shadow-md border-b-transparent' 
        : 'bg-card/95 backdrop-blur-md border-b border-border'
    }`}>
      <div className="flex items-center gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Dispatch Console</h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted border border-border">
              <span className={`w-1 h-1 rounded-full ${unassignedCount > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.1em]">
                <span className={unassignedCount > 0 ? "text-amber-500" : "text-emerald-500"}>{unassignedCount}</span>
                <span className="text-muted-foreground mx-0.5">/</span>
                <span className="text-foreground">{totalTickets}</span>
                <span className="ml-1 text-muted-foreground">Not Assigned</span>
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center">
        <button 
          onClick={() => window.print()}
          className="mr-2 p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Print Manifest"
        >
          <Printer size={14} strokeWidth={2.5} />
        </button>
        <div className="scale-90 origin-right">
          <CalendarDropdown 
            value={context?.date ? [context.date] : []}
            onChange={(vals: string[]) => {
              if (vals.length > 0 && context?.setDate) {
                context.setDate(vals[vals.length - 1]);
              }
            }}
            countsMap={countsMap}
            activeDates={Object.keys(countsMap)}
            allowAnyDate={true}
            forceIso={true}
            compact={true}
            alignRight={true}
          />
        </div>
      </div>
    </div>
  );
}
