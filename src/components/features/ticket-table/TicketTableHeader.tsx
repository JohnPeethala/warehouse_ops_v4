"use client";

import React from "react";
import { Flag, CalendarClock, X } from "lucide-react";
import { SortableHeader } from "./TableCells";
import { ExcelColumnFilter } from "./ExcelColumnFilter";
import { CalendarColumnFilter } from "./CalendarColumnFilter";
import type { SortConfig } from "./types";

type TicketTableHeaderProps = {
  showCheckboxes: boolean;
  showScheduleStatus: boolean;
  selectedFilteredCount: number;
  filteredDataLength: number;
  toggleSelectAll: () => void;
  clearSelection: () => void;
  sortConfig: SortConfig;
  handleSort: (key: string) => void;
  filterOptions: Record<string, string[]>;
  colFilters: Record<string, Set<string> | null>;
  setColFilters: React.Dispatch<React.SetStateAction<Record<string, Set<string> | null>>>;
  handleFilterOpenChange: (open: boolean) => void;
};

export function TicketTableHeader({
  showCheckboxes,
  showScheduleStatus,
  selectedFilteredCount,
  filteredDataLength,
  toggleSelectAll,
  clearSelection,
  sortConfig,
  handleSort,
  filterOptions,
  colFilters,
  setColFilters,
  handleFilterOpenChange,
}: TicketTableHeaderProps) {
  return (
    <thead className="sticky top-0 z-30 shadow-sm text-left">
      <tr className="bg-white dark:bg-[#171717] divide-x divide-border">
        {showCheckboxes && (
          <th className="px-2 py-1 sticky left-0 z-40 bg-white dark:bg-[#171717] w-[56px] min-w-[56px] max-w-[56px] text-center border-r dark:border-neutral-800 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.3)]">
            <div className="flex flex-col items-center justify-center min-h-[36px]">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-border/80 text-blue-600 focus:ring-blue-600 accent-blue-600 dark:accent-blue-500 cursor-pointer transition-colors"
                checked={selectedFilteredCount > 0 && selectedFilteredCount === filteredDataLength}
                ref={(input) => {
                  if (input) {
                    input.indeterminate = selectedFilteredCount > 0 && selectedFilteredCount < filteredDataLength;
                  }
                }}
                onChange={toggleSelectAll}
              />
              {selectedFilteredCount > 0 ? (
                <button
                  onClick={clearSelection}
                  className="text-[10px] text-foreground dark:text-white font-bold leading-none mt-1 hover:text-red-500 flex items-center justify-center gap-0.5 transition-colors group cursor-pointer"
                  title="Clear Selection"
                >
                  ({selectedFilteredCount})
                  <X size={10} className="text-muted-foreground group-hover:text-red-500" strokeWidth={3} />
                </button>
              ) : (
                <span className="text-[10px] opacity-0 select-none leading-none mt-1 font-bold">(0)</span>
              )}
            </div>
          </th>
        )}

        <th className="px-2 py-1 text-xs font-bold text-foreground uppercase tracking-wider whitespace-nowrap w-16 text-left" title="Priority">
          <SortableHeader label="Prio" sortKey="prio" sortConfig={sortConfig} onSort={handleSort} icon={<Flag className="w-3.5 h-3.5" strokeWidth={2.5} />} />
        </th>

        {showScheduleStatus && (
          <th className="px-2 py-1 text-xs font-bold text-foreground uppercase tracking-wider whitespace-nowrap w-16 text-left" title="Schedule Status">
            <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} icon={<CalendarClock className="w-3.5 h-3.5" strokeWidth={2.5} />} />
          </th>
        )}

        <th className="px-2 py-1 text-xs font-bold text-foreground uppercase tracking-wider whitespace-nowrap w-28 text-left">
          <SortableHeader label="Date" sortKey="date" sortConfig={sortConfig} onSort={handleSort} />
        </th>

        <th className="px-2 py-1 text-xs font-bold text-foreground uppercase tracking-wider whitespace-nowrap w-20 text-left">
          <SortableHeader label="Age" sortKey="age" sortConfig={sortConfig} onSort={handleSort} />
        </th>

        <th className="px-2 py-1 text-xs font-bold text-foreground uppercase tracking-wider whitespace-nowrap w-36 text-left">
          Tags
        </th>

        <th className="px-2 py-1 text-xs font-bold text-foreground uppercase tracking-wider whitespace-nowrap w-24 text-left">
          <SortableHeader label="Ops." sortKey="ops" sortConfig={sortConfig} onSort={handleSort} />
        </th>

        <th className="px-2 py-1 text-xs font-bold text-foreground uppercase tracking-wider whitespace-nowrap w-28 text-left">
          <SortableHeader label="Ticket ID" sortKey="ticket_id" sortConfig={sortConfig} onSort={handleSort} />
        </th>

        <th className="px-2 py-1 text-xs font-bold text-foreground uppercase tracking-wider whitespace-nowrap w-48 text-left">
          <SortableHeader label="Contact Name" sortKey="contact_name" sortConfig={sortConfig} onSort={handleSort} />
        </th>

        <th className="px-2 py-1 text-xs font-bold text-foreground uppercase tracking-wider w-56 text-left">
          <SortableHeader label="Location" sortKey="location" sortConfig={sortConfig} onSort={handleSort} />
        </th>

        <th className="px-2 py-1 text-xs font-bold text-foreground uppercase tracking-wider w-72 text-left">
          Notes
        </th>

        <th className="px-2 py-1 text-xs font-bold text-foreground uppercase tracking-wider text-left">
          <SortableHeader label="Address" sortKey="address" sortConfig={sortConfig} onSort={handleSort} />
        </th>
      </tr>

      <tr className="bg-muted/50 backdrop-blur-xl divide-x divide-border h-8">
        {showCheckboxes && (
          <th className="p-0 sticky left-0 z-40 bg-muted dark:bg-[#171717] align-top relative border-r dark:border-neutral-800 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.3)]">
            <ExcelColumnFilter
              title="Check"
              options={filterOptions.check}
              selectedValues={colFilters.check || new Set()}
              onFilterChange={(s) => setColFilters(p => ({ ...p, check: s.size === 0 ? null : s }))}
              onOpenChange={handleFilterOpenChange}
            />
          </th>
        )}
        <th className="p-0 align-top relative">
          <ExcelColumnFilter
            title="Prio"
            options={filterOptions.prio}
            selectedValues={colFilters.prio || new Set()}
            onFilterChange={(s) => setColFilters(p => ({ ...p, prio: s.size === 0 ? null : s }))}
            onOpenChange={handleFilterOpenChange}
          />
        </th>
        {showScheduleStatus && (
          <th className="p-0 align-top relative">
            <ExcelColumnFilter
              title="Status"
              options={filterOptions.schedule}
              selectedValues={colFilters.schedule || new Set()}
              onFilterChange={(s) => setColFilters(p => ({ ...p, schedule: s.size === 0 ? null : s }))}
              onOpenChange={handleFilterOpenChange}
            />
          </th>
        )}
        <th className="p-0 align-top relative">
          <CalendarColumnFilter
            title="Date"
            options={filterOptions.date}
            selectedValues={colFilters.date || new Set()}
            onFilterChange={(s) => setColFilters(p => ({ ...p, date: s.size === 0 ? null : s }))}
            onOpenChange={handleFilterOpenChange}
          />
        </th>
        <th className="p-0 align-top relative">{/* Age */}</th>
        <th className="p-0 align-top relative">
          <ExcelColumnFilter
            title="Tags"
            options={filterOptions.tags}
            selectedValues={colFilters.tags || new Set()}
            onFilterChange={(s) => setColFilters(p => ({ ...p, tags: s.size === 0 ? null : s }))}
            onOpenChange={handleFilterOpenChange}
          />
        </th>
        <th className="p-0 align-top relative">
          <ExcelColumnFilter
            title="Ops"
            options={filterOptions.ops}
            selectedValues={colFilters.ops || new Set()}
            onFilterChange={(s) => setColFilters(p => ({ ...p, ops: s.size === 0 ? null : s }))}
            onOpenChange={handleFilterOpenChange}
          />
        </th>
        <th className="p-0 align-top relative"></th>
        <th className="p-0 align-top relative"></th>
        <th className="p-0 align-top relative"></th>
        <th className="p-0 align-top relative"></th>
        <th className="p-0 align-top relative"></th>
      </tr>
    </thead>
  );
}
