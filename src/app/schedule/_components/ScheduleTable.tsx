// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Copy, CalendarClock, Flag, Tag, X, MapPin, Trash2, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";

import { ExcelColumnFilter } from "@/components/features/ticket-table/ExcelColumnFilter";
import { CalendarColumnFilter } from "@/components/features/ticket-table/CalendarColumnFilter";
import { InteractiveTagInput, SortableHeader, AutoResizeTextarea } from "@/components/features/ticket-table/TableCells";
import { LocationCombobox } from "@/components/features/ticket-table/LocationCombobox";
import { useSubCategorySettings } from "@/components/providers/SubCategoryProvider";


import { CreateVehicleDialog } from "./CreateVehicleDialog";
import { CreateGTDialog } from "./CreateGTDialog";
import { useScheduleContext } from "./ScheduleContext";
import { ScheduleTableBody } from "./ScheduleTableBody";

export function ScheduleTable() {
  const {
    filteredGroupedData: groupedData,
    selectedIds,
    setSelectedIds,
    annotationsMap,
    setAnnotationsMap,
    geoZones,
    searchQuery,
    colFilters,
    setColFilters,
    sortConfig,
    handleSort,
    filterOptions,
    nameCounts,
    toggleSelectAll,
    toggleSelect,
    profiles,
    vehicles,
    lookups,
    handleFieldUpdate: onUpdateField,
    handleFieldsUpdate: onUpdateFields,
    handleAppendText: onAppendText,
    handleRouteSessionUpdate: onUpdateRouteSession,
    handleDelete: onDelete
  } = useScheduleContext();
  
  const subCategories = useScheduleContext().subCategories;
  const [openFiltersCount, setOpenFiltersCount] = useState(0);

  // Quick Create Modal States
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [gtModalOpen, setGtModalOpen] = useState(false);
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState("");
  const [gtSearchQuery, setGtSearchQuery] = useState("");
  const [pendingRoute, setPendingRoute] = useState<{route: string, date: string, type: 'vehicle' | 'gt1' | 'gt2'} | null>(null);

  const handleFilterOpenChange = (open: boolean) => {
    setOpenFiltersCount(prev => prev + (open ? 1 : -1));
  };

  const getTagColor = (tag: string) => {
    const colors = [
      "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
      "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
      "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400",
      "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
      "bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-400",
      "bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-400",
      "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
    ];
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const renderTags = (tagsStr: string | null) => {
    if (!tagsStr || tagsStr.trim() == "-") return null;
    const tags = tagsStr.split(",").map((t: string) => t.trim()).filter((t: string) => t && t !== "-");
    if (tags.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1">
        {tags.map((tag: string) => (
          <span
            key={tag}
            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border truncate max-w-[90px] ${getTagColor(tag)}`}
            title={tag}
          >
            {tag}
          </span>
        ))}
      </div>
    );
  };

  const statusOptions = lookups.filter(l => l.domain === "TICKET_STATUS" || l.domain === "TICKET");
  const allTicketIds = groupedData.flatMap(g => g.tickets.map(t => t.id));

  const usedGtIds = new Set<string>();
  groupedData.forEach(g => {
    const tripDate = g.tickets[0]?.scheduled_date;
    const rs = g.tickets[0]?.ops_route_sessions;
    if (rs) {
      if (rs.gt1_id) usedGtIds.add(rs.gt1_id);
      if (rs.gt2_id) usedGtIds.add(rs.gt2_id);
    }
  });

  // Local state to hold dynamically created entities without full page refresh
  const [localVehicles, setLocalVehicles] = useState(vehicles);
  const [localProfiles, setLocalProfiles] = useState(profiles);

  useEffect(() => { setLocalVehicles(vehicles); }, [vehicles]);
  useEffect(() => { setLocalProfiles(profiles); }, [profiles]);

  const driverProfiles = localProfiles.filter(p => p.role === "driver" || p.role === "ground");
  const gtProfiles = localProfiles.filter(p => p.role === "ground" || p.role === "supervisor");

  const vehicleDriverOptions = localVehicles.map(v => {
    return {
      id: v.id,
      label: v.driver_name || "Unassigned Driver",
      badge: v.vehicle_no
    };
  });

  const assignedVehicleIds = new Set(
    groupedData.map(g => g.tickets[0]?.ops_route_sessions?.vehicle_id).filter(Boolean)
  );

  const assignedGtIds = new Set(
    groupedData.flatMap(g => [
      g.tickets[0]?.ops_route_sessions?.gt1_id, 
      g.tickets[0]?.ops_route_sessions?.gt2_id
    ]).filter(Boolean)
  );

  return (
    <div className="w-full flex-1 flex flex-col bg-card/60 backdrop-blur-xl border border-border shadow-sm rounded-xl overflow-hidden min-h-0">
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[2000px]">
          <thead className="sticky top-0 z-30 shadow-sm text-left">
            <tr className="bg-white dark:bg-[#171717] divide-x divide-border">
              <th className="px-2 py-1 sticky left-0 z-40 bg-white dark:bg-[#171717] w-[56px] min-w-[56px] max-w-[56px] text-center border-r dark:border-neutral-800 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.3)]">
                <div className="flex flex-col items-center justify-center min-h-[36px]">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-border/80 text-blue-600 focus:ring-blue-600 accent-blue-600 dark:accent-blue-500 cursor-pointer transition-colors"
                    checked={selectedIds.size > 0 && selectedIds.size === allTicketIds.length}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = selectedIds.size > 0 && selectedIds.size < allTicketIds.length;
                      }
                    }}
                    onChange={toggleSelectAll}
                  />
                  {selectedIds.size > 0 ? (
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedIds(new Set());
                      }}
                      className="text-[10px] text-foreground dark:text-white font-bold leading-none mt-1 hover:text-red-500 flex items-center justify-center gap-0.5 transition-colors group cursor-pointer relative z-50"
                      title="Clear Selection"
                    >
                      ({selectedIds.size})
                      <X size={10} className="text-muted-foreground group-hover:text-red-500" strokeWidth={3} />
                    </button>
                  ) : (
                    <span className="text-[10px] opacity-0 select-none leading-none mt-1 font-bold">(0)</span>
                  )}
                </div>
              </th>
              
              <th className="px-2 py-1 text-xs font-bold text-foreground uppercase tracking-wider whitespace-nowrap text-left">
                <SortableHeader label="Date" sortKey="date" sortConfig={sortConfig} onSort={handleSort} />
              </th>
              
              <th className="px-2 py-1 text-xs font-bold text-foreground uppercase tracking-wider whitespace-nowrap w-16 text-center">
                Route
              </th>

              <th className="px-2 py-1 text-xs font-bold text-foreground uppercase tracking-wider whitespace-nowrap w-32 text-left">
                <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
              </th>

              <th className="px-2 py-1 text-xs font-bold text-foreground uppercase tracking-wider whitespace-nowrap w-16 text-center" title="GT Map">
                <div className="flex justify-center items-center"><MapPin className="w-4 h-4 text-muted-foreground" /></div>
              </th>
              
              <th className="px-2 py-1 text-xs font-bold text-foreground uppercase tracking-wider whitespace-nowrap text-left">
                <SortableHeader label="Ops." sortKey="ops" sortConfig={sortConfig} onSort={handleSort} />
              </th>
              
              <th className="px-2 py-1 text-xs font-bold text-foreground uppercase tracking-wider whitespace-nowrap text-left">
                <SortableHeader label="Ticket ID" sortKey="ticket_id" sortConfig={sortConfig} onSort={handleSort} />
              </th>
              
              <th className="px-2 py-1 text-xs font-bold text-foreground uppercase tracking-wider whitespace-nowrap text-left">
                <SortableHeader label="Contact Name" sortKey="contact_name" sortConfig={sortConfig} onSort={handleSort} />
              </th>
              

              
              <th className="px-2 py-1 text-xs font-bold text-foreground uppercase tracking-wider min-w-[200px] text-left">
                <SortableHeader label="Location" sortKey="location" sortConfig={sortConfig} onSort={handleSort} />
              </th>
              
              <th className="px-2 py-1 text-xs font-bold text-foreground uppercase tracking-wider min-w-[250px] text-left">
                Notes
              </th>
              
              <th className="px-2 py-1 text-xs font-bold text-foreground uppercase tracking-wider min-w-[250px] text-left">
                Remarks
              </th>

              <th className="px-2 py-1 text-xs font-bold text-foreground uppercase tracking-wider min-w-[180px] text-left">
                <SortableHeader label="Address" sortKey="address" sortConfig={sortConfig} onSort={handleSort} />
              </th>
              
              <th className="px-2 py-1 text-xs font-bold text-foreground uppercase tracking-wider w-10 text-center">
                {/* Delete action col */}
              </th>
            </tr>
            
            <tr className="bg-muted/50 backdrop-blur-xl divide-x divide-border h-8">
              <th className="p-0 sticky left-0 z-40 bg-muted dark:bg-[#171717] align-top relative border-r dark:border-neutral-800 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.3)]">
                <ExcelColumnFilter 
                  title="Check"
                  options={filterOptions.check} 
                  selectedValues={colFilters.check || new Set()}
                  onFilterChange={(s) => setColFilters(p => ({ ...p, check: s.size === 0 ? null : s }))}
                  onOpenChange={handleFilterOpenChange}
                />
              </th>
              <th className="p-0 align-top relative">
                <CalendarColumnFilter 
                  title="Date"
                  options={filterOptions.date} 
                  selectedValues={filterOptions.date ? (colFilters.date || new Set()) : new Set()}
                  onFilterChange={(s) => setColFilters(p => ({ ...p, date: s.size === 0 ? null : s }))}
                  onOpenChange={handleFilterOpenChange}
                />
              </th>
              <th className="p-0 align-top relative">
                <ExcelColumnFilter 
                  title="Route"
                  options={filterOptions.route} 
                  selectedValues={colFilters.route || new Set()}
                  onFilterChange={(s) => setColFilters(p => ({ ...p, route: s.size === 0 ? null : s }))}
                  onOpenChange={handleFilterOpenChange}
                />
              </th>
              <th className="p-0 align-top relative">
                <ExcelColumnFilter 
                  title="Status"
                  options={filterOptions.schedule} 
                  selectedValues={colFilters.schedule || new Set()}
                  onFilterChange={(s) => setColFilters(p => ({ ...p, schedule: s.size === 0 ? null : s }))}
                  onOpenChange={handleFilterOpenChange}
                />
              </th>
              <th className="p-0 align-top relative"></th>
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
              <th className="p-0 align-top relative"></th>
              <th className="p-0 bg-muted dark:bg-[#171717] border-r dark:border-neutral-800"></th>
            </tr>
          </thead>
          <ScheduleTableBody 
            groupedData={groupedData}
            searchQuery={searchQuery}
            openFiltersCount={openFiltersCount}
            statusOptions={statusOptions}
            nameCounts={nameCounts}
            assignedVehicleIds={assignedVehicleIds}
            assignedGtIds={assignedGtIds}
            vehicleDriverOptions={vehicleDriverOptions}
            gtProfiles={gtProfiles}
            onOpenVehicleModal={(search: string, pending: any) => {
              setVehicleSearchQuery(search);
              setPendingRoute(pending);
              setVehicleModalOpen(true);
            }}
            onOpenGtModal={(search: string, pending: any) => {
              setGtSearchQuery(search);
              setPendingRoute(pending);
              setGtModalOpen(true);
            }}
          />
        </table>
      </div>
      <CreateVehicleDialog 
        open={vehicleModalOpen}
        onOpenChange={setVehicleModalOpen}
        defaultDriverName={vehicleSearchQuery}
        onSuccess={(id) => {
          if (pendingRoute && pendingRoute.type === 'vehicle') {
            onUpdateRouteSession(pendingRoute.route, pendingRoute.date, { vehicle_id: id });
          }
        }}
      />

      <CreateGTDialog 
        open={gtModalOpen}
        onOpenChange={setGtModalOpen}
        defaultName={gtSearchQuery}
        onSuccess={(id) => {
          if (pendingRoute) {
            if (pendingRoute.type === 'gt1') {
              onUpdateRouteSession(pendingRoute.route, pendingRoute.date, { gt1_id: id });
            } else if (pendingRoute.type === 'gt2') {
              onUpdateRouteSession(pendingRoute.route, pendingRoute.date, { gt2_id: id });
            }
          }
        }}
      />
    </div>
  );
}