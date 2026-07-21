import React, { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Check, ChevronDown, CheckSquare, Square } from "lucide-react";

type Props = {
  options: { label: string; count: number }[];
  selectedValues: Set<string>;
  onFilterChange: (newSelected: Set<string>) => void;
  title: string;
  onOpenChange?: (isOpen: boolean) => void;
};

export function ExcelColumnFilter({ options, selectedValues, onFilterChange, title, onOpenChange }: Props) {
  const [open, setOpenState] = useState(false);

  const setOpen = (newOpen: boolean) => {
    setOpenState(newOpen);
    onOpenChange?.(newOpen);
  };
  
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const lowerQ = search.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(lowerQ));
  }, [options, search]);

  const toggleOption = (label: string) => {
    const newSet = new Set(selectedValues);
    if (newSet.has(label)) {
      newSet.delete(label);
    } else {
      newSet.add(label);
    }
    onFilterChange(newSet);
  };

  const isActive = selectedValues.size > 0;
  const isAllSelected = selectedValues.size === options.length && options.length > 0;
  
  let displayContent: React.ReactNode = "All";
  if (isActive) {
    if (isAllSelected) {
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
      <PopoverContent className="w-56 p-0 flex flex-col shadow-xl" align="start">
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={`Search ${title}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 text-xs bg-muted/50 border-none rounded focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-border bg-muted/20">
          <button
            onClick={() => onFilterChange(new Set(filteredOptions.map(o => o.label)))}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Select All
          </button>
          <button
            onClick={() => onFilterChange(new Set())}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Square className="w-3.5 h-3.5" />
            Deselect All
          </button>
        </div>
        
        <div className="max-h-[250px] overflow-y-auto custom-scrollbar p-1 text-sm">
          
          {filteredOptions.length === 0 ? (
            <div className="px-2 py-4 text-center text-muted-foreground text-xs">No matches</div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = selectedValues.has(opt.label);
              return (
                <button
                  key={opt.label}
                  onClick={() => toggleOption(opt.label)}
                  className="w-full flex items-center px-2 py-1.5 hover:bg-muted rounded text-left group"
                >
                  <div className={`w-4 h-4 mr-2 border rounded flex items-center justify-center ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background group-hover:border-primary/50'}`}>
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                  <span className="flex-1 text-xs truncate text-left" title={opt.label}>{opt.label || "(Blank)"}</span>
                  <span className="text-[10px] text-muted-foreground bg-muted-foreground/10 px-1.5 rounded-full ml-2">
                    {opt.count}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
