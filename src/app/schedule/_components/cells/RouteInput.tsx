"use client";

import React, { useState, useEffect } from "react";

export const RouteInput = ({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (val: string) => void;
}) => {
  const [focused, setFocused] = useState(false);
  const [localVal, setLocalVal] = useState(value || "");

  useEffect(() => {
    setLocalVal(value || "");
  }, [value]);
  
  const handleBlur = () => {
    setFocused(false);
    if (localVal !== (value || "")) {
      onChange(localVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Escape") {
      e.currentTarget.blur();
    }
  };
  
  return (
    <div className="relative w-10 h-8 mx-auto" title="Route Letter">
      <input 
        type="text"
        maxLength={2}
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
        onFocus={(e) => {
          setFocused(true);
          e.target.select();
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full h-full text-center outline-none rounded-sm px-1 py-1 text-xs font-bold transition-colors border
          ${focused ? "border-primary ring-1 ring-primary bg-background text-foreground" : 
            "bg-background border-border text-foreground hover:border-primary/50 uppercase shadow-sm"
          }
        `}
        placeholder="-"
      />
    </div>
  );
};
