"use client";

import { format } from "date-fns";
import { useState, useEffect } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createClient } from "@/lib/supabase/client";

const safeDateParse = (dateString: string) => {
  if (!dateString) return new Date();
  const parts = dateString.split("T")[0].split("-");
  if (parts.length === 3) {
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }
  return new Date(dateString);
};

interface CountDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  className?: string;
}

export function CountDatePicker({ value, onChange, className = "" }: CountDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(safeDateParse(value));
  
  const [ticketCounts, setTicketCounts] = useState<Record<string, number>>({});
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);

  useEffect(() => {
    async function fetchCounts() {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = format(new Date(year, month, 1), 'yyyy-MM-dd');
      const endDate = format(new Date(year, month + 1, 0), 'yyyy-MM-dd');
      
      setIsLoadingCounts(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('ops_dispatch_log')
        .select('scheduled_date')
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate);
        
      if (!error && data) {
        const counts: Record<string, number> = {};
        data.forEach(row => {
          if (row.scheduled_date) {
            counts[row.scheduled_date] = (counts[row.scheduled_date] || 0) + 1;
          }
        });
        setTicketCounts(counts);
      }
      setIsLoadingCounts(false);
    }
    
    if (open) {
      fetchCounts();
    }
  }, [currentMonth, open]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const days = Array.from({length: daysInMonth}, (_, i) => i + 1);
  const blanks = Array.from({length: firstDay}, (_, i) => i);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handlePrev = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentMonth(new Date(year, month - 1, 1)); };
  const handleNext = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentMonth(new Date(year, month + 1, 1)); };

  const selectDate = (dateStr: string) => {
    onChange(dateStr);
    setOpen(false);
  };

  const displayDate = value ? format(safeDateParse(value), "MMM d, yyyy") : "Select a date";

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen && value) setCurrentMonth(safeDateParse(value));
    }}>
      <PopoverTrigger className={`flex items-center w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors hover:bg-accent/50 ${className}`}>
        <CalendarIcon className="w-4 h-4 text-muted-foreground mr-2" />
        <span className={value ? "text-foreground" : "text-muted-foreground"}>{displayDate}</span>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0 shadow-xl flex flex-col mt-1" align="start">
        <div className="flex justify-between items-center mb-2 px-4 pt-3">
          <button onClick={handlePrev} className="p-1 hover:bg-muted rounded-md transition-colors"><ChevronLeft size={16} /></button>
          <span className="text-sm font-bold tracking-tight">
            {monthNames[month]} {year}
          </span>
          <button onClick={handleNext} className="p-1 hover:bg-muted rounded-md transition-colors"><ChevronRight size={16} /></button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground mb-2 px-3">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
        </div>
        
        <div className="grid grid-cols-7 gap-1 px-3 pb-3 relative">
          {isLoadingCounts && (
            <div className="absolute inset-0 bg-background/50 z-10 rounded-b-md" />
          )}
          {blanks.map(b => <div key={`b${b}`}></div>)}
          {days.map(d => {
            const y = year;
            const m = String(month + 1).padStart(2, '0');
            const dd = String(d).padStart(2, '0');
            const dateStr = `${y}-${m}-${dd}`;
            
            const isSelected = value === dateStr;
            
            return (
              <button
                key={d}
                onClick={(e) => { e.preventDefault(); selectDate(dateStr); }}
                className={`relative aspect-square flex flex-col items-center justify-center text-sm rounded-md transition-all ${
                  isSelected 
                    ? 'bg-primary text-primary-foreground font-bold shadow-md' 
                    : 'hover:bg-muted text-foreground font-medium'
                }`}
              >
                <span>{d}</span>
                {ticketCounts[dateStr] > 0 && (
                  <div className={`absolute -bottom-1 -right-1 text-[9px] px-1 rounded-sm leading-tight ${isSelected ? 'bg-primary-foreground text-primary font-bold shadow-sm' : 'bg-muted-foreground text-card font-bold'}`}>
                    {ticketCounts[dateStr]}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
