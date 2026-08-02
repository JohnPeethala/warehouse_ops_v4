"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Database } from "@/lib/supabase/database.types";

export const StatusDropdown = ({
  statusValue,
  subStatusValue,
  onChange,
  options
}: {
  statusValue: string;
  subStatusValue: string;
  onChange: (updates: { status: string; sub_status: string }) => void;
  options: Database['public']['Tables']['cfg_lookups']['Row'][];
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const effectiveStatus = statusValue || "Pending";
  const effectiveSubStatus = subStatusValue || "Pending";

  const getColorClasses = (color: string, mode: 'pill' | 'hover' | 'active' | 'dropdown_trigger' = 'dropdown_trigger') => {
    let baseColor = color || 'zinc';
    if (baseColor === 'green') baseColor = 'emerald';

    if (mode === 'dropdown_trigger') {
      switch (baseColor) {
        case 'emerald': return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:opacity-80";
        case 'red': return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:opacity-80";
        case 'amber': return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:opacity-80";
        case 'blue': return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:opacity-80";
        case 'purple': return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 hover:opacity-80";
        case 'orange': return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30 hover:opacity-80";
        case 'zinc': return "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/30 hover:opacity-80";
        default: return "bg-background text-foreground border-border hover:opacity-80";
      }
    }

    if (mode === 'hover') {
      switch (baseColor) {
        case 'emerald': return "hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400";
        case 'red': return "hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400";
        case 'amber': return "hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400";
        case 'blue': return "hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400";
        case 'purple': return "hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400";
        case 'orange': return "hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400";
        case 'zinc': return "hover:bg-zinc-500/10 hover:text-zinc-700 dark:hover:text-zinc-300";
        default: return "hover:bg-primary/10 hover:text-primary";
      }
    }

    // active and pill
    switch (baseColor) {
      case 'emerald': return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      case 'red': return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
      case 'amber': return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      case 'blue': return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case 'purple': return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
      case 'orange': return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
      case 'zinc': return "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300";
      default: return "bg-primary/10 text-primary";
    }
  };

  const lookup = options.find((l) => 
    l.status.toLowerCase() === effectiveStatus.toLowerCase() && 
    (!l.sub_status || l.sub_status.toLowerCase() === effectiveSubStatus.toLowerCase())
  );
  
  const subColor = lookup?.sub_status_color || 'zinc';
  const colorClasses = getColorClasses(subColor, 'dropdown_trigger');

  return (
    <Popover open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) setSearch("");
    }}>
      <PopoverTrigger 
        className={`border outline-none rounded-md px-2 h-8 w-full max-w-[140px] min-w-[120px] shadow-sm transition-all text-xs cursor-pointer flex justify-between items-center select-none font-medium ${colorClasses} ${open ? 'ring-2 ring-primary/20 border-primary' : ''}`}
      >
        <span className="truncate pr-1">
          {effectiveSubStatus}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform opacity-70 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </PopoverTrigger>
      
      <PopoverContent className="w-[200px] p-1 bg-background border-border/80 shadow-xl rounded-lg" align="start">
        <div className="px-2 py-1.5 border-b border-border/40 mb-1">
          <div className="flex items-center gap-1.5 px-1 bg-muted/50 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              autoFocus
              type="text" 
              placeholder="Search..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-xs py-1 text-foreground placeholder:text-muted-foreground/70"
            />
          </div>
        </div>
        <div className="max-h-[220px] overflow-y-auto pr-1 custom-scrollbar bg-background text-foreground">
          
          {(!options.some(o => o.status === "Pending") && "pending".includes(search.toLowerCase())) && (
            <div 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange({ status: "Pending", sub_status: "Pending" }); setOpen(false); }}
              className={`flex items-center justify-between px-2 py-1.5 text-xs rounded-md cursor-pointer mb-0.5 select-none font-medium transition-colors ${effectiveSubStatus === "Pending" ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'hover:bg-primary/10 hover:text-primary text-foreground'}`}
            >
              <span className="truncate mr-2">Pending</span>
              <span className="shrink-0 inline-block px-1.5 py-0.5 text-[9px] rounded-full uppercase tracking-wider font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">PENDING</span>
            </div>
          )}

          {options.filter(o => {
            if (!search) return true;
            const term = search.toLowerCase();
            return o.status.toLowerCase().includes(term) || (o.sub_status && o.sub_status.toLowerCase().includes(term));
          }).map(o => {
            const status = o.status;
            const sub = o.sub_status || o.status;
            const isActive = effectiveSubStatus === sub;
            
            const itemColor = o.sub_status_color || o.status_color || 'zinc';
            
            const hoverClass = getColorClasses(itemColor, 'hover');
            const activeClass = getColorClasses(itemColor, 'active');
            const pillClass = getColorClasses(o.status_color || 'zinc', 'pill');

            return (
              <div 
                key={o.id}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange({ status, sub_status: sub }); setOpen(false); }}
                className={`flex items-center justify-between px-2 py-1.5 text-xs rounded-md cursor-pointer mb-0.5 select-none font-medium transition-colors ${isActive ? activeClass : `text-foreground ${hoverClass}`}`}
              >
                <span className="truncate mr-2">{sub}</span>
                <span className={`shrink-0 inline-block px-1.5 py-0.5 text-[9px] rounded-full uppercase tracking-wider font-bold ${pillClass}`}>
                  {status}
                </span>
              </div>
            );
          })}
          
          {options.filter(o => {
            if (!search) return true;
            const term = search.toLowerCase();
            return o.status.toLowerCase().includes(term) || (o.sub_status && o.sub_status.toLowerCase().includes(term));
          }).length === 0 && (!"pending".includes(search.toLowerCase()) || options.some(o => o.status === "Pending")) && (
            <div className="py-4 text-center text-xs text-muted-foreground">No matches</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
