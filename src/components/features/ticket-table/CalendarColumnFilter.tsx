import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, ChevronLeft, ChevronRight, CheckSquare, Square, History } from "lucide-react";

type Props = {
  title: string;
  options: { label: string; count: number }[];
  selectedValues: Set<string>;
  onFilterChange: (values: Set<string>) => void;
  onOpenChange?: (isOpen: boolean) => void;
};

export function CalendarColumnFilter({ title, options, selectedValues, onFilterChange, onOpenChange }: Props) {
  const [open, setOpenState] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const setOpen = (newOpen: boolean) => {
    setOpenState(newOpen);
    onOpenChange?.(newOpen);
  };

  const isAllSelected = selectedValues.size === options.length || options.length === 0;

  // Convert options array to a counts map based on ISO dates
  const countsMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    options.forEach(opt => {
      map[opt.label] = opt.count;
    });
    return map;
  }, [options]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const days = Array.from({length: daysInMonth}, (_, i) => i + 1);
  const blanks = Array.from({length: firstDay}, (_, i) => i);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const handlePrev = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentMonth(new Date(year, month - 1, 1)); };
  const handleNext = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentMonth(new Date(year, month + 1, 1)); };

  const toggleDate = (dateStr: string) => {
    const newSet = new Set(selectedValues);
    if (newSet.has(dateStr)) {
      newSet.delete(dateStr);
    } else {
      newSet.add(dateStr);
    }
    onFilterChange(newSet);
  };

  const formatDateDisplay = (iso: string) => {
    if (iso === "Unknown") return "Unknown";
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    } catch {
      return iso;
    }
  };

  const isActive = selectedValues.size > 0;
  const allSelected = selectedValues.size === options.length && options.length > 0;

  let displayContent: React.ReactNode = "All";
  if (isActive) {
    if (allSelected) {
      displayContent = "All Selected";
    } else {
      displayContent = (
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
          <span>Active</span>
        </div>
      );
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={`absolute inset-0 w-full h-full flex items-center justify-between px-2 py-1 text-[11px] font-medium transition-colors focus:outline-none ${isActive ? 'bg-transparent text-foreground font-bold' : 'bg-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground'}`}
        title={`Filter ${title}`}
      >
        <div className="truncate flex-1 text-left flex items-center">{displayContent}</div>
        <ChevronDown className="w-3 h-3 shrink-0 opacity-50 ml-1" />
      </PopoverTrigger>
      
      <PopoverContent className="w-[260px] p-0 shadow-xl flex flex-col" align="start">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/20 mb-2">
          <button
            onClick={() => onFilterChange(new Set(options.map(o => o.label)))}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Select All
          </button>
          <button
            onClick={() => onFilterChange(new Set())}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Square className="w-3.5 h-3.5" />
            Deselect All
          </button>
        </div>

        <div className="flex justify-between items-center mb-3 px-4">
          <button onClick={handlePrev} className="p-1 hover:bg-muted rounded-md transition-colors"><ChevronLeft size={16} /></button>
          <span className="text-sm font-bold tracking-tight">{monthNames[month]} {year}</span>
          <button onClick={handleNext} className="p-1 hover:bg-muted rounded-md transition-colors"><ChevronRight size={16} /></button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground mb-2 px-3">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
        </div>
        
        <div className="grid grid-cols-7 gap-1 px-3">
          {blanks.map(b => <div key={`b${b}`}></div>)}
          {days.map(d => {
            const y = year;
            const m = String(month + 1).padStart(2, '0');
            const dd = String(d).padStart(2, '0');
            const dateStr = `${y}-${m}-${dd}`;
            
            const count = countsMap[dateStr] || 0;
            const isSelected = selectedValues.has(dateStr);
            
            if (count === 0) {
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

        <div className="mt-2 pt-2 border-t border-border flex flex-col gap-1 p-2">
          <button
            onClick={(e) => { 
              e.preventDefault(); 
              const today = new Date();
              const tzOffset = today.getTimezoneOffset() * 60000; 
              const localISOTime = (new Date(today.getTime() - tzOffset)).toISOString().slice(0, -1);
              const todayStr = localISOTime.split('T')[0];
              const backdatedDates = options.map(o => o.label).filter(label => label !== 'Unknown' && label.split('T')[0].split(' ')[0] < todayStr);
              onFilterChange(new Set(backdatedDates));
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs rounded transition-colors bg-primary/10 hover:bg-primary/20 text-primary font-semibold"
          >
            <History className="w-3.5 h-3.5" />
            Select Backdated
          </button>
          {countsMap["Unknown"] !== undefined && (
            <button
              onClick={(e) => { e.preventDefault(); toggleDate("Unknown"); }}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded transition-colors ${selectedValues.has("Unknown") ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted text-foreground'}`}
            >
              <span>Unknown Date</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${selectedValues.has("Unknown") ? 'bg-primary/20 text-primary font-bold' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                {countsMap["Unknown"]}
              </span>
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
