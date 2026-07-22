"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useScheduleContext } from "./ScheduleContext";
import { ActiveFiltersBar } from "@/app/active-tickets/_components/ActiveFiltersBar";
import { EntityDropdown } from "./cells/EntityDropdown";
import { getCategoryDetails } from "@/lib/categoryUtils";
import { Search, XCircle, FileBarChart2, ChevronDown, Plus, Copy, AlertCircle, Activity } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format } from "date-fns";

export function ScheduleHeader({
  headerEl,
  isReportsOpen,
  setIsReportsOpen,
  setIsSummaryModalOpen,
  setIsNotDoneModalOpen,
  setIsProgressModalOpen,
  setIsAddModalOpen,
}: {
  headerEl: HTMLElement | null;
  isReportsOpen: boolean;
  setIsReportsOpen: (open: boolean) => void;
  setIsSummaryModalOpen: (open: boolean) => void;
  setIsNotDoneModalOpen: (open: boolean) => void;
  setIsProgressModalOpen: (open: boolean) => void;
  setIsAddModalOpen: (open: boolean) => void;
}) {
  const {
    totalTickets,
    subCategoryBreakdown,
    subCategories,
    colFilters,
    setColFilters,
    driverFilter,
    setDriverFilter,
    gtFilter,
    setGtFilter,
    searchQuery,
    setSearchQuery,
    vehicles,
    profiles,
    selectedIds,
    filteredGroupedData
  } = useScheduleContext();

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const vehicleOptions = [
    { id: "all", label: "All Vehicles/Drivers" },
    ...vehicles.map(v => ({ id: v.id, label: `${v.vehicle_no} - ${v.driver_name}` }))
  ];
  
  const gtOptions = [
    { id: "all", label: "All GTs" },
    ...profiles.filter(p => p.role === 'ground').map(p => ({ id: p.id, label: p.name }))
  ];

  const activeFilters = useMemo(() => {
    const list: { key: string, val: string, label: string }[] = [];
    
    if (colFilters) {
      Object.entries(colFilters).forEach(([key, set]) => {
        if (set && set.size > 0) {
          set.forEach((val: any) => {
            list.push({ key, val, label: `${key}: ${val}` });
          });
        }
      });
    }

    if (driverFilter !== "all") {
      const v = vehicles.find(x => x.id === driverFilter);
      list.push({ key: 'driver', val: driverFilter, label: v ? `Vehicle: ${v.vehicle_no}` : 'Driver' });
    }

    if (gtFilter !== "all") {
      const p = profiles.find(x => x.id === gtFilter);
      list.push({ key: 'gt', val: gtFilter, label: p ? `GT: ${p.name}` : 'GT' });
    }

    if (searchQuery) {
      list.push({ key: 'search', val: searchQuery, label: `Search: ${searchQuery}` });
    }

    return list;
  }, [colFilters, driverFilter, gtFilter, searchQuery, vehicles, profiles]);

  const removeFilter = (key: string, val: string) => {
    if (key === 'search') setSearchQuery("");
    else if (key === 'driver') setDriverFilter("all");
    else if (key === 'gt') setGtFilter("all");
    else {
      setColFilters((prev: any) => {
        const nextSet = new Set(prev[key]);
        nextSet.delete(val);
        return { ...prev, [key]: nextSet.size > 0 ? nextSet : null };
      });
    }
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setDriverFilter("all");
    setGtFilter("all");
    setColFilters({});
  };

  const handleCopyData = () => {
    const allTickets = filteredGroupedData.flatMap(g => g.tickets);
    
    const headers = [
      "Date", "Route", "Driver", "Vehicle No", "GT 1", "GT 2", "Status", "GT Map Link", "Ops", "Ticket ID", "Name", "Location", "Pincode", "Notes", "Remarks", "Address"
    ];
    
    const rows = allTickets.map(t => {
      const session = t.ops_route_sessions || {};
      const vehicle = vehicles.find(v => v.id === session.vehicle_id);
      const gt1 = profiles.find(p => p.id === session.gt1_id);
      const gt2 = profiles.find(p => p.id === session.gt2_id);
      const dateStr = t.scheduled_date ? format(new Date(t.scheduled_date), "dd-MMM-yyyy") : "";

      return [
        dateStr, t.route || "-", vehicle ? vehicle.driver_name || "" : "", vehicle ? vehicle.vehicle_no || "" : "",
        gt1?.name || "", gt2?.name || "", t.ops_status || "Pending", t.gt_map || "", t.sub_category || "Uncategorized",
        t.ticket_id || "", t.contact_name || "", t.location || "", t.pincode || "",
        (t.notes || "").replace(/\n/g, " "), (t.remarks || "").replace(/\n/g, " "), (t.address || "").replace(/\n/g, " ")
      ].map(cell => {
        const cellStr = String(cell || "");
        if (cellStr.includes("\t") || cellStr.includes("\n") || cellStr.includes("\"")) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join("\t");
    });

    const tsv = [headers.join("\t"), ...rows].join("\n");
    navigator.clipboard.writeText(tsv).then(() => {
      toast.success("Data copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy data");
    });
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Stats Summary Bar */}
        <div className="flex items-center gap-6 px-3 py-2.5 bg-card/40 backdrop-blur-xl border border-border rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Total Tickets</span>
            <span className="text-sm font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">{totalTickets}</span>
          </div>
          <div className="h-4 w-px bg-border/50" />
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider mr-1">Schedule Done:</span>
            {Object.entries(subCategoryBreakdown).length > 0 ? (
              Object.entries(subCategoryBreakdown).map(([sub, count]) => {
                const { Icon, color } = getCategoryDetails(sub, subCategories);
                return (
                  <div key={sub} className="flex items-center gap-1.5 transition-colors">
                    <div style={{ color }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm text-foreground">{count}</span>
                  </div>
                );
              })
            ) : (
              <span className="text-muted-foreground italic text-xs">No tickets</span>
            )}
          </div>
        </div>

        {/* Active Filters Row */}
        <div className="mt-1">
          <ActiveFiltersBar 
            activeFilters={activeFilters} 
            removeFilter={removeFilter} 
            clearAllFilters={clearAllFilters} 
          />
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-1">
          <div className="relative w-full max-w-sm flex items-center shrink-0">
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
                  const newItems = paste.split(/[\r\n]+/).map((i: string) => i.trim()).filter(Boolean);
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
          
          <div className="flex items-center gap-3 ml-auto shrink-0">
            {selectedIds.size > 0 && (
              <span className="text-sm font-medium text-muted-foreground mr-2">
                {selectedIds.size} selected
              </span>
            )}
            <EntityDropdown
              value={driverFilter}
              onChange={(val) => setDriverFilter(val || "all")}
              options={vehicleOptions}
              placeholder="All Vehicles/Drivers"
              widthClass="w-[200px]"
              dropdownWidthClass="w-[250px]"
            />

            <EntityDropdown
              value={gtFilter}
              onChange={(val) => setGtFilter(val || "all")}
              options={gtOptions}
              placeholder="All GTs"
              widthClass="w-[160px]"
              dropdownWidthClass="w-[200px]"
            />
          </div>
        </div>
      </div>

      {headerEl && createPortal(
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Popover open={isReportsOpen} onOpenChange={setIsReportsOpen}>
              <PopoverTrigger 
                className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer whitespace-nowrap border border-border bg-background hover:bg-muted text-foreground w-[140px]"
                title="View Reports"
              >
                <div className="flex items-center gap-2">
                  <FileBarChart2 size={16} className="text-primary" />
                  <span>Reports</span>
                </div>
                <ChevronDown size={14} className="opacity-50" />
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[140px] p-2 bg-background border border-border shadow-xl rounded-xl">
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => { setIsSummaryModalOpen(true); setIsReportsOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted text-foreground text-left w-full"
                  >
                    <FileBarChart2 size={16} className="text-emerald-500 shrink-0" />
                    Schedule
                  </button>
                  <button 
                    onClick={() => { setIsNotDoneModalOpen(true); setIsReportsOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted text-foreground text-left w-full"
                  >
                    <AlertCircle size={16} className="text-red-500 shrink-0" />
                    Not Done
                  </button>
                  <button 
                    onClick={() => { setIsProgressModalOpen(true); setIsReportsOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted text-foreground text-left w-full"
                  >
                    <Activity size={16} className="text-blue-500 shrink-0" />
                    Progress
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap border border-border bg-primary text-primary-foreground hover:bg-primary/90"
            title="Add tickets by ID"
          >
            <Plus size={16} />
            Add Tickets
          </button>
          <button 
            onClick={() => handleCopyData()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap border border-border bg-background hover:bg-muted text-foreground"
            title="Copy displayed tickets to clipboard"
          >
            <Copy size={16} />
            Copy
          </button>
        </div>,
        headerEl
      )}
    </>
  );
}
