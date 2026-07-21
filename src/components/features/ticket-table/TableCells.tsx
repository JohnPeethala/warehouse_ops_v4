"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, AlertTriangle, Star, ChevronUp, ChevronDown } from "lucide-react";
import { updateAnnotation } from "@/app/actions/annotations";
import type { SortConfig } from "./types";

export function InteractiveTagInput({ ticketId, stagedTicketId, initialValue, onUpdate }: { ticketId: string, stagedTicketId: string, initialValue: string, onUpdate: (val: string) => void }) {
  const [value, setValue] = useState(initialValue || "");
  const [isFocused, setIsFocused] = useState(false);

  React.useEffect(() => {
    setValue(initialValue || "");
  }, [initialValue]);

  const handleBlur = async () => {
    setIsFocused(false);
    if (value !== (initialValue || "")) {
      if (onUpdate) {
        onUpdate(value.toLowerCase());
      } else {
        await updateAnnotation(ticketId, stagedTicketId, "priority_tag", value.toLowerCase());
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.currentTarget.blur();
    }
  };

  const safeVal = value.trim().toLowerCase();
  const isSuccess = safeVal === "s" || safeVal === "success" || safeVal === "done" || safeVal === "d";
  const isError = safeVal === "e" || safeVal === "error" || safeVal === "i" || safeVal === "issue" || safeVal === "f";
  const isVip = safeVal === "v" || safeVal === "vip" || safeVal === "star";
  
  return (
    <div className="relative w-10 h-8 mx-auto" title="Type 's' for Success, 'e' for Issue, 'v' for VIP, or a Trip Number">
      <input 
        value={value}
        onChange={(e) => setValue(e.target.value.toLowerCase())}
        onFocus={(e) => {
          setIsFocused(true);
          e.target.select();
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full h-full text-center outline-none rounded-md px-1 py-1 text-xs font-bold shadow-sm transition-colors border
          ${isFocused ? "border-primary outline outline-1 outline-primary bg-background text-foreground" : 
            isSuccess ? "bg-green-100 border-green-200 text-transparent dark:bg-green-900/30 dark:border-green-800" :
            isError ? "bg-red-100 border-red-200 text-transparent dark:bg-red-900/30 dark:border-red-800" :
            isVip ? "bg-violet-100 border-violet-200 text-transparent dark:bg-violet-900/30 dark:border-violet-800" :
            value ? "bg-primary/10 border-primary/20 text-primary uppercase" :
            "bg-muted/30 border-transparent text-muted-foreground/50 hover:bg-muted/50"
          }
        `}
        placeholder=""
      />
      {!isFocused && isSuccess && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Check size={18} strokeWidth={3} className="text-green-600 dark:text-green-500" />
        </div>
      )}
      {!isFocused && isError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <AlertTriangle size={16} className="text-red-600 dark:text-red-500" />
        </div>
      )}
      {!isFocused && isVip && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Star size={16} className="text-violet-600 dark:text-violet-500 fill-violet-600 dark:fill-violet-500" />
        </div>
      )}
    </div>
  );
}

export function AutoResizeTextarea({ ticketId, stagedTicketId, initialValue, onUpdate }: { ticketId: string, stagedTicketId: string, initialValue: string, onUpdate?: (val: string) => void }) {
  const [value, setValue] = useState(initialValue || "");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isFocused) {
      setValue(initialValue || "");
    }
  }, [initialValue]); // Deliberately omit isFocused so we don't revert on blur

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  useEffect(() => {
    adjustHeight();
  }, []);

  const handleBlur = async () => {
    if (value !== (initialValue || "")) {
      if (onUpdate) {
        onUpdate(value);
      } else {
        await updateAnnotation(ticketId, stagedTicketId, "notes", value);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // If they press a regular character key at the very end of the text, 
    // and it doesn't already have a recent stamp, add one.
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const val = value.trimEnd();
      // Look for a stamp format at the end of the current text
      const hasRecentStamp = val.match(/\[.*? - .*?\] - $/);
      
      if (!hasRecentStamp && (val === "" || val.includes("\n") || value.endsWith("\n"))) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const stamp = `\n[Admin - ${dateStr} ${timeStr}] - `;
        
        const el = e.currentTarget;
        if (el.selectionStart === value.length) {
          e.preventDefault();
          const char = e.key;
          const prefix = value ? (value.endsWith("\n") ? stamp.trimStart() : stamp) : stamp.trimStart();
          const newValue = value + prefix + char;
          setValue(newValue);
          
          setTimeout(() => {
            if (textareaRef.current) {
              const newPos = newValue.length;
              textareaRef.current.setSelectionRange(newPos, newPos);
            }
          }, 0);
        }
      }
    }

    if (e.ctrlKey && e.key === ';') {
      e.preventDefault();
      
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const stamp = `[Admin - ${dateStr} ${timeStr}] - `;
      
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      
      const newValue = value.substring(0, start) + stamp + value.substring(end);
      setValue(newValue);
      
      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = start + stamp.length;
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={(e) => {
        setIsFocused(false);
        handleBlur();
      }}
      placeholder="Add note..."
      className={`text-xs transition-all rounded-md px-2.5 py-1.5 placeholder:text-muted-foreground/50 focus:outline-none resize-none overflow-hidden w-full block min-h-[32px] border ${isFocused ? 'border-primary ring-1 ring-primary/20 shadow-sm text-foreground bg-background' : 'bg-background hover:bg-muted/30 border-border hover:border-border/80 text-foreground shadow-sm'}`}
      rows={1}
    />
  );
}

export const SortableHeader = ({ label, sortKey, sortConfig, onSort, icon }: { label: string, sortKey: string, sortConfig: SortConfig, onSort: (key: string) => void, icon?: React.ReactNode }) => {
  const isActive = sortConfig?.key === sortKey;
  
  return (
    <div 
      className="flex items-center justify-between w-full gap-2 cursor-pointer hover:text-primary transition-colors group select-none"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {icon ? icon : <span>{label}</span>}
      </div>
      <div className="flex flex-col -space-y-1 opacity-50 group-hover:opacity-100 transition-opacity">
        <ChevronUp 
          className={`w-3.5 h-3.5 transition-colors ${isActive && sortConfig.direction === 'asc' ? 'text-primary' : 'text-muted-foreground/30 group-hover:text-muted-foreground/50'}`} 
          strokeWidth={3} 
        />
        <ChevronDown 
          className={`w-3.5 h-3.5 transition-colors ${isActive && sortConfig.direction === 'desc' ? 'text-primary' : 'text-muted-foreground/30 group-hover:text-muted-foreground/50'}`} 
          strokeWidth={3} 
        />
      </div>
    </div>
  );
};
