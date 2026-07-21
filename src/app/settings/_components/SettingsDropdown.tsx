"use client";

import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronDown } from "lucide-react";

interface SettingsDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; icon?: React.ReactNode }[];
  placeholder?: string;
  widthClass?: string;
}

export function SettingsDropdown({
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  widthClass = "w-full"
}: SettingsDropdownProps) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={`${widthClass} h-[38px] bg-background hover:bg-muted/50 border transition-all rounded-lg px-3 text-left outline-none shadow-sm flex items-center justify-between ${open ? 'border-primary ring-1 ring-primary/20' : 'border-border'}`}>
        <div className="flex-1 truncate pr-2 flex items-center gap-2">
          {selectedOption ? (
            <>
              {selectedOption.icon && <span className="shrink-0">{selectedOption.icon}</span>}
              <span className="text-sm font-medium text-foreground truncate">{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground/50 shrink-0" />
      </PopoverTrigger>
      <PopoverContent className={`${widthClass} p-0 shadow-md rounded-lg border border-border`} align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command>
          <CommandInput placeholder="Search..." className="text-xs h-9 border-none focus:ring-0" />
          <CommandList className="max-h-[200px] overflow-y-auto custom-scrollbar">
            <CommandEmpty className="py-3 text-xs text-center text-muted-foreground">No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className="text-sm py-2 px-2 cursor-pointer flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 truncate">
                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                    <span className="truncate">{option.label}</span>
                  </div>
                  {value === option.value && <Check className="w-4 h-4 text-primary shrink-0" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
