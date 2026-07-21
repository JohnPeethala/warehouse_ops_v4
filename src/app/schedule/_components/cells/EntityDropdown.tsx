"use client";

import React, { useState } from "react";
import { ChevronDown, X, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export const EntityDropdown = ({
  value,
  onChange,
  options,
  placeholder,
  onCreateNew,
  createNewText = "Create New...",
  widthClass = "w-full max-w-[200px] min-w-[140px]",
  dropdownWidthClass = "w-[220px]"
}: {
  value: string;
  onChange: (val: string) => void;
  options: { id: string, label: string, badge?: string }[];
  placeholder: string;
  onCreateNew?: (search: string) => void;
  createNewText?: string;
  widthClass?: string;
  dropdownWidthClass?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedOption = options.find(o => o.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={`group relative flex items-center justify-between ${widthClass} h-8 bg-background hover:bg-muted/50 border transition-all rounded-sm px-2 text-left outline-none shadow-sm ${open ? 'border-primary ring-1 ring-primary/20' : 'border-border'}`}>
        <div className="flex-1 truncate py-0.5 pr-2 flex items-center justify-between gap-1.5">
          {selectedOption ? (
            <>
              <span className="text-foreground truncate text-xs font-medium">{selectedOption.label}</span>
              {selectedOption.badge && (
                <span className="text-[10px] text-muted-foreground bg-foreground/5 px-1.5 py-0.5 rounded shrink-0 font-mono">
                  {selectedOption.badge}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-muted-foreground font-medium">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {value && (
            <div 
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-muted-foreground/20 rounded-full transition-opacity cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
            >
              <X className="w-3.5 h-3.5 text-red-500 hover:text-red-600 dark:text-red-400" />
            </div>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
        </div>
      </PopoverTrigger>
      <PopoverContent className={`${dropdownWidthClass} p-0 shadow-md rounded-md border border-border`} align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search..." 
            value={search}
            onValueChange={setSearch}
            className="text-xs h-8 border-none focus:ring-0" 
          />
          <CommandList className="max-h-[200px] overflow-y-auto custom-scrollbar">
            <CommandEmpty className="py-4 text-xs text-center text-muted-foreground">No results found.</CommandEmpty>
            <CommandGroup>
              {options
                .filter(o => !search || o.label.toLowerCase().includes(search.toLowerCase()))
                .map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                  className="text-xs py-1.5 px-2 cursor-pointer flex items-center justify-between gap-2"
                >
                  <div className="flex items-center justify-between flex-1 truncate gap-2">
                    <span className="truncate">{option.label}</span>
                    {option.badge && (
                      <span className="text-[10px] text-muted-foreground bg-foreground/5 px-1.5 py-0.5 rounded shrink-0 font-mono">
                        {option.badge}
                      </span>
                    )}
                  </div>
                  {value === option.id && <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-500 shrink-0" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {onCreateNew && (
            <div className="p-1 border-t border-border">
              <div 
                className="text-xs py-1.5 px-2 cursor-pointer text-primary hover:bg-muted font-medium rounded-sm flex items-center justify-between"
                onClick={() => {
                  onCreateNew(search);
                  setOpen(false);
                }}
              >
                {createNewText}
              </div>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};
