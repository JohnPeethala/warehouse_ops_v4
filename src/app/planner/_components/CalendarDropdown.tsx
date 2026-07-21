"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Filter } from "lucide-react";

interface CalendarDropdownProps {
  label?: string;
  icon?: any;
  value: string[];
  onChange: (val: string[]) => void;
  countsMap: Record<string, number>;
  activeDates: string[];
  compact?: boolean;
  allowAnyDate?: boolean;
  forceIso?: boolean;
  alignRight?: boolean;
}

export const CalendarDropdown = ({ 
  label, 
  icon: Icon, 
  value, 
  onChange, 
  countsMap, 
  activeDates, 
  compact = false, 
  allowAnyDate = false, 
  forceIso = false, 
  alignRight = false 
}: CalendarDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) window.addEventListener('mousedown', clickOutside);
    return () => window.removeEventListener('mousedown', clickOutside);
  }, [isOpen]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const days = Array.from({length: daysInMonth}, (_, i) => i + 1);
  const blanks = Array.from({length: firstDay}, (_, i) => i);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const handlePrev = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentMonth(new Date(year, month - 1, 1)); };
  const handleNext = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentMonth(new Date(year, month + 1, 1)); };

  const formatDateString = (d: number) => {
    const y = year;
    const m = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const isoString = `${y}-${m}-${dd}`;
    
    if (forceIso) return isoString;

    const match = activeDates.find((ad: string) => {
      try {
        const adStr = ad.length === 10 ? ad + 'T00:00:00' : ad;
        const adDate = new Date(adStr);
        return adDate.getFullYear() === year && adDate.getMonth() === month && adDate.getDate() === d;
      } catch(e) { return false; }
    });
    return match || isoString;
  };

  const toggleDate = (dateStr: string) => {
    if (value.includes(dateStr)) {
      onChange(value.filter((v: string) => v !== dateStr));
    } else {
      onChange([...value, dateStr]);
    }
  };

  const formatDateDisplay = (isoDate: string) => {
    try {
      if (!isoDate || isoDate === "Invalid Date") return isoDate;
      const d = new Date(isoDate + 'T00:00:00');
      if (isNaN(d.getTime())) return isoDate;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch(e) { return isoDate; }
  };

  const getDisplayText = () => {
    if (value.length === 0) return <><Filter size={10} className="opacity-60" /> All</>;
    if (value.length === 1) return formatDateDisplay(value[0]);
    return `${value.length} Selected`;
  };

  return (
    <div className="relative" ref={ref}>
      {compact ? (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between gap-1 text-[11px] font-semibold px-2 py-1.5 w-full rounded outline-none transition-colors ${value.length > 0 ? 'text-primary bg-primary/10 shadow-sm border border-primary/20' : 'text-muted-foreground hover:bg-muted/80 border border-transparent'}`}
          title={label}
        >
          <span className="truncate flex-1 text-left flex items-center gap-1">
            {getDisplayText()}
          </span>
          <ChevronDown size={12} className="opacity-50 shrink-0" />
        </button>
      ) : (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 bg-background text-sm font-medium border rounded-lg px-2.5 py-1.5 outline-none transition-colors w-[155px] justify-between ${value.length > 0 ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
        >
          <div className="flex items-center gap-1.5 overflow-hidden">
            {Icon && <Icon size={16} className={`shrink-0 ${value.length > 0 ? 'text-primary' : 'text-muted-foreground'}`} />}
            <span className="truncate text-left">{value.length === 0 ? 'Pick Date' : (value.length === 1 ? formatDateDisplay(value[0]) : `${value.length} Selected`)}</span>
          </div>
          <ChevronDown size={16} className="opacity-50 shrink-0 ml-0.5" />
        </button>
      )}

      {isOpen && (
        <div className={`absolute top-full mt-1.5 ${alignRight ? 'right-0' : 'left-0'} z-50 p-3 bg-card text-card-foreground border border-border rounded-xl shadow-xl animate-in fade-in zoom-in-95 w-[260px]`}>
          <div className="flex justify-between items-center mb-3 px-1">
            <button onClick={handlePrev} className="p-1 hover:bg-muted rounded-md transition-colors"><ChevronLeft size={16} /></button>
            <span className="text-sm font-bold tracking-tight">{monthNames[month]} {year}</span>
            <button onClick={handleNext} className="p-1 hover:bg-muted rounded-md transition-colors"><ChevronRight size={16} /></button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {blanks.map(b => <div key={`b${b}`}></div>)}
            {days.map(d => {
              const dateStr = formatDateString(d);
              const count = countsMap[dateStr] || 0;
              const isSelected = value.includes(dateStr);
              
              if (count === 0 && !allowAnyDate) {
                return (
                  <div key={d} className="relative aspect-square flex items-center justify-center text-sm text-muted-foreground/30">
                    {d}
                  </div>
                );
              }
              
              return (
                <button
                  key={d}
                  onClick={(e) => { e.preventDefault(); toggleDate(dateStr); }}
                  className={`relative aspect-square flex items-center justify-center text-sm rounded-md transition-all ${isSelected ? 'bg-primary text-primary-foreground font-bold shadow-md' : 'hover:bg-muted text-foreground font-medium'}`}
                >
                  {d}
                  {count > 0 && (
                    <div className={`absolute -bottom-1 -right-1 text-[9px] px-1 rounded-sm leading-tight ${isSelected ? 'bg-primary-foreground text-primary font-bold shadow-sm' : 'bg-muted-foreground text-card'}`}>
                      {count}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {value.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
              <span className="text-xs font-semibold text-primary">{value.length} Dates</span>
              <button 
                onClick={() => { onChange([]); setIsOpen(false); }}
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Clear Date
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
