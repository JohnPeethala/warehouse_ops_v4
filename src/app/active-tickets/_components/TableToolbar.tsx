"use client";

import React, { RefObject } from "react";
import { createPortal } from "react-dom";
import { Search, XCircle, History, AlertTriangle, Star, Check, Send, Eraser, Loader2 } from "lucide-react";
import { PushToScheduleModal } from "./PushToScheduleModal";
import { bulkClearPriorityTags } from "@/app/actions/annotations";
import { toast } from "sonner";

type Props = {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  filterOptions: any;
  colFilters: any;
  setColFilters: (val: any) => void;
  latestBatchId: string | null | undefined;
  latestBatchPrioCounts: any;
  latestBatchFilteredCount: number;
  latestBatchTotal: number;
  selectedIds?: Set<string>;
  setSelectedIds?: (val: Set<string>) => void;
  hideBulkActions?: boolean;
};

export function TableToolbar({
  searchQuery,
  setSearchQuery,
  searchInputRef,
  filterOptions,
  colFilters,
  setColFilters,
  latestBatchId,
  latestBatchPrioCounts,
  latestBatchFilteredCount,
  latestBatchTotal,
  selectedIds,
  setSelectedIds,
  hideBulkActions
}: Props) {
  
  const today = new Date();
  const tzOffset = today.getTimezoneOffset() * 60000; 
  const localISOTime = (new Date(today.getTime() - tzOffset)).toISOString().slice(0, -1);
  const todayStr = localISOTime.split('T')[0];
  
  const backdatedDates = (filterOptions.date || [])
    .map((o: any) => o.label)
    .filter((d: string) => {
      if (d === "-") return true;
      const parts = d.split('-');
      if (parts.length !== 3) return false;
      const t = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return t < today;
    });
  const [isPushModalOpen, setIsPushModalOpen] = React.useState(false);
  const [headerEl, setHeaderEl] = React.useState<HTMLElement | null>(null);
  
  React.useEffect(() => {
    setHeaderEl(document.getElementById("header-actions"));
  }, []);
    
  const isCurrentlyBackdated = !!(
    colFilters.date && 
    colFilters.date.size > 0 &&
    colFilters.date.size === backdatedDates.length && 
    backdatedDates.every((d: string) => colFilters.date!.has(d))
  );

  const [isClearing, setIsClearing] = React.useState(false);

  const handleClearTags = async () => {
    if (selectedIds && selectedIds.size > 0) {
      if (!confirm(`Are you sure you want to clear priority tags for ${selectedIds.size} selected tickets?`)) return;
    } else {
      if (!confirm("Are you sure you want to clear ALL priority tags across all active tickets?")) return;
    }

    setIsClearing(true);
    try {
      const ticketIdsArray = selectedIds && selectedIds.size > 0 ? Array.from(selectedIds) : [];
      const res = await bulkClearPriorityTags(ticketIdsArray);
      if (res.success) {
        toast.success(ticketIdsArray.length > 0 ? `Cleared tags for ${ticketIdsArray.length} tickets` : "Cleared all priority tags");
        if (setSelectedIds) setSelectedIds(new Set());
      } else {
        toast.error(res.error || "Failed to clear tags");
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex items-center px-1 justify-between gap-4">
      <div className="relative w-full max-w-sm flex items-center">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search tickets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onPaste={(e) => {
            const paste = e.clipboardData.getData('text');
            if (paste.includes('\n') || paste.includes('\r')) {
              e.preventDefault();
              const newItems = paste.split(/[\r\n]+/).map(i => i.trim()).filter(Boolean);
              const before = searchQuery.slice(0, searchInputRef.current?.selectionStart || 0);
              const after = searchQuery.slice(searchInputRef.current?.selectionEnd || 0);
              const inserted = newItems.join(', ');
              const finalVal = before + inserted + after;
              setSearchQuery(finalVal);
            }
          }}
          className="w-full bg-card/60 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-sm rounded-lg pl-9 pr-12 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
        />
        <div className="absolute right-2.5 flex items-center gap-1 pointer-events-none">
          <span className="text-[10px] font-medium text-muted-foreground/60 border border-border px-1.5 py-0.5 rounded shadow-sm bg-background">⌘</span>
          <span className="text-[10px] font-medium text-muted-foreground/60 border border-border px-1.5 py-0.5 rounded shadow-sm bg-background">K</span>
        </div>
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery("")}
            className="absolute right-12 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 pointer-events-auto"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Actions & New Upload Counts */}
      <div className="flex items-center gap-3 shrink-0">
        
        {latestBatchId && (
        <div className="flex items-center gap-4 text-sm bg-card/60 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-lg px-4 py-2 shadow-sm shrink-0">
          {(latestBatchPrioCounts.e > 0 || latestBatchPrioCounts.v > 0 || latestBatchPrioCounts.s > 0 || Object.keys(latestBatchPrioCounts.numbers).length > 0) && (
            <>
              <div className="flex items-center gap-3">
                {latestBatchPrioCounts.e > 0 && <span className="flex items-center gap-1 text-rose-500 dark:text-rose-400 font-semibold" title="Error/Issue"><AlertTriangle className="w-3.5 h-3.5" strokeWidth={2.5} /> {latestBatchPrioCounts.e}</span>}
                {latestBatchPrioCounts.v > 0 && <span className="flex items-center gap-1 text-violet-500 dark:text-violet-400 font-semibold" title="VIP"><Star className="w-3.5 h-3.5 fill-current" strokeWidth={2.5} /> {latestBatchPrioCounts.v}</span>}
                {latestBatchPrioCounts.s > 0 && <span className="flex items-center gap-1 text-green-500 dark:text-green-400 font-semibold" title="Schedule"><Check className="w-3.5 h-3.5" strokeWidth={3} /> {latestBatchPrioCounts.s}</span>}
                {Object.entries(latestBatchPrioCounts.numbers)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([n, count]) => (
                  <span key={n} className="flex items-center gap-1.5 font-semibold text-foreground" title={`Priority ${n}`}>
                    <span className="bg-primary/15 text-primary px-2 py-1 rounded leading-none text-xs">#{n}</span> 
                    <span>{count as React.ReactNode}</span>
                  </span>
                ))}
              </div>
              <div className="w-px h-4 bg-border shrink-0"></div>
            </>
          )}
          
          <div className="flex items-center gap-2 font-medium text-foreground">
            <span>{latestBatchFilteredCount} / {latestBatchTotal} Tickets</span>
          </div>
        </div>
        )}
      </div>

      {headerEl && !hideBulkActions && createPortal(
        <>
          <button
            onClick={() => {
              setColFilters((prev: any) => ({
                ...prev,
                date: isCurrentlyBackdated ? null : new Set(backdatedDates)
              }));
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap border border-border ${isCurrentlyBackdated ? 'bg-primary text-primary-foreground hover:bg-primary/90 border-transparent' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            title="Select backdated tickets in Date filter"
          >
            <History size={14} />
            Backdated
          </button>
          
          <button
            onClick={handleClearTags}
            disabled={isClearing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap border border-border bg-background text-foreground hover:bg-muted/80 disabled:opacity-50"
            title={selectedIds && selectedIds.size > 0 ? "Clear tags for selected tickets" : "Clear ALL priority tags"}
          >
            {isClearing ? <Loader2 size={14} className="animate-spin" /> : <Eraser size={14} />}
            {selectedIds && selectedIds.size > 0 ? `Clear Tags (${selectedIds.size})` : "Clear All Tags"}
          </button>

          <button
            onClick={() => setIsPushModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/90 border border-transparent"
            title="Push scheduled tickets to dispatch"
          >
            <Send size={14} />
            Push to Schedule
          </button>
        </>,
        headerEl
      )}

      <PushToScheduleModal 
        isOpen={isPushModalOpen}
        onClose={() => setIsPushModalOpen(false)}
      />
    </div>
  );
}
