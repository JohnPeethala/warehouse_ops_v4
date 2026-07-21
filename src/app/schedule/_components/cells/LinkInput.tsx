"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { MapPin, Plus, AlertCircle } from "lucide-react";

export const isValidUrl = (urlStr: string) => {
  try {
    new URL(urlStr);
    return true;
  } catch {
    return false;
  }
};

export const LinkInput = ({ 
  value, 
  onChange,
}: { 
  value: string; 
  onChange: (val: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localVal, setLocalVal] = useState(value || "");

  useEffect(() => {
    setLocalVal(value || "");
  }, [value]);
  
  const handleBlur = () => {
    setIsEditing(false);
    if (localVal !== (value || "")) {
      onChange(localVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Escape") {
      e.currentTarget.blur();
    }
  };

  const handleSingleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isValidUrl(localVal)) {
      navigator.clipboard.writeText(localVal);
      toast.success("Copied Map Link!");
    } else {
      setIsEditing(true);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <div className="relative w-12 h-8 mx-auto" title="Paste a link">
        <input 
          autoFocus
          value={localVal}
          onChange={(e) => setLocalVal(e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full text-center outline-none rounded-sm px-1 py-1 text-[10px] font-mono transition-colors border border-primary ring-1 ring-primary bg-background text-foreground shadow-sm"
        />
      </div>
    );
  }

  const valid = localVal.trim() !== "" && isValidUrl(localVal);
  const invalid = localVal.trim() !== "" && !valid;

  return (
    <div 
      className="flex items-center justify-center w-12 h-8 mx-auto rounded-md cursor-pointer transition-colors hover:bg-muted"
      onClick={handleSingleClick}
      onDoubleClick={handleDoubleClick}
      title={valid ? "Single click: Copy | Double click: Edit" : "Click to add Map Link"}
    >
      {valid ? (
        <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 transition-colors drop-shadow-sm" fill="currentColor" fillOpacity={0.2} />
      ) : invalid ? (
        <AlertCircle className="w-5 h-5 text-red-500" />
      ) : (
        <Plus className="w-4 h-4 text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
      )}
    </div>
  );
};
