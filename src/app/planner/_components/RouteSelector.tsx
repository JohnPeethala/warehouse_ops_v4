"use client";

import { useState, useEffect } from "react";
import { Truck } from "lucide-react";
import { useRoutePlanner } from "./RoutePlannerContext";

interface RouteSelectorProps {
  value: string;
  onSelect: (v: string) => void;
  iconOnly?: boolean;
}

export function RouteSelector({ value, onSelect, iconOnly = false }: RouteSelectorProps) {
  const [inputValue, setInputValue] = useState(value || "");
  const context = useRoutePlanner();

  const selectedColor = value ? context.getRouteColor(value) : null;
  const SelectedIcon = Truck;

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const handleCommit = () => {
    const trimmed = inputValue.trim().toUpperCase();
    if (trimmed !== value) {
      if (trimmed && context?.addRoute) {
        context.addRoute(trimmed); 
      }
      onSelect(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  return (
    <div className={`flex items-center gap-2 border border-border bg-background transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary ${
      iconOnly 
        ? 'w-14 rounded-md overflow-hidden' 
        : 'w-full rounded-lg px-2 overflow-hidden'
    }`}>
      {!iconOnly && (
        <SelectedIcon 
          size={14} 
          className={`shrink-0 ${selectedColor ? selectedColor.textColor : 'text-muted-foreground'}`} 
          strokeWidth={2}
        />
      )}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value.toUpperCase())}
        onBlur={handleCommit}
        onKeyDown={handleKeyDown}
        placeholder="RTE"
        className={`bg-transparent outline-none font-bold uppercase tracking-widest text-foreground placeholder:text-muted-foreground/50 ${
          iconOnly ? 'w-full text-center text-xs py-1.5 px-1' : 'w-full text-xs py-1.5'
        }`}
      />
    </div>
  );
}
