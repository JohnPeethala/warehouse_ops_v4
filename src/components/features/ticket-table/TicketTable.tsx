"use client";

import React from "react";
import { format } from "date-fns";
import { Copy, CalendarClock, Flag, Tag, X } from "lucide-react";
import { toast } from "sonner";

import { ExcelColumnFilter } from "./ExcelColumnFilter";
import { CalendarColumnFilter } from "./CalendarColumnFilter";
import { InteractiveTagInput, SortableHeader, AutoResizeTextarea } from "./TableCells";
import { LocationCombobox } from "./LocationCombobox";
import { getCategoryDetails } from "@/lib/categoryUtils";
import { useSubCategorySettings } from "@/components/providers/SubCategoryProvider";
import { updateAnnotation } from "@/app/actions/annotations";
import { updateTicketLocation } from "@/app/actions/geo";
import { TicketTableHeader } from "./TicketTableHeader";
import { TicketTableRow } from "./TicketTableRow";
const safeDateParse = (dateString: string) => {
  if (!dateString || dateString === "-" || dateString.startsWith("1970-01-01")) return null;
  const parts = dateString.split("T")[0].split("-");
  if (parts.length === 3) {
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }
  return new Date(dateString);
};

import type { EnrichedTicket, TicketAnnotation, SortConfig } from "./types";

type TicketTableProps = {
  data: EnrichedTicket[];
  filteredData: EnrichedTicket[];
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  annotationsMap: Record<string, TicketAnnotation>;
  setAnnotationsMap: React.Dispatch<React.SetStateAction<Record<string, TicketAnnotation>>>;
  geoZones: any[];
  searchQuery: string;
  colFilters: Record<string, Set<string> | null>;
  setColFilters: React.Dispatch<React.SetStateAction<Record<string, Set<string> | null>>>;
  sortConfig: SortConfig;
  handleSort: (key: string) => void;
  filterOptions: any;
  nameCounts: Record<string, number>;
  toggleSelectAll: () => void;
  toggleSelect: (id: string) => void;
  // Optional configuration flags
  showCheckboxes?: boolean;
  showScheduleStatus?: boolean;
};

export function TicketTable({
  data,
  filteredData,
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
  showCheckboxes = true,
  showScheduleStatus = true,
}: TicketTableProps) {
  const subCategories = useSubCategorySettings();
  const [openFiltersCount, setOpenFiltersCount] = React.useState(0);

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

  return (
    <div className="w-full flex-1 flex flex-col bg-card/60 backdrop-blur-xl border border-border shadow-sm rounded-xl overflow-hidden min-h-0">
      <div className="overflow-y-scroll overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse table-fixed min-w-[2000px]">
          <TicketTableHeader
            showCheckboxes={showCheckboxes}
            showScheduleStatus={showScheduleStatus}
            selectedIdsSize={selectedIds.size}
            filteredDataLength={filteredData.length}
            toggleSelectAll={toggleSelectAll}
            clearSelection={() => setSelectedIds(new Set())}
            sortConfig={sortConfig}
            handleSort={handleSort}
            filterOptions={filterOptions}
            colFilters={colFilters}
            setColFilters={setColFilters}
            handleFilterOpenChange={handleFilterOpenChange}
          />
          <tbody className={`divide-y divide-border/50 transition-all duration-300 ${openFiltersCount > 0 ? 'blur-[1px] opacity-80' : ''}`}>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Tag className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-base font-medium text-foreground">
                      {searchQuery ? "No tickets match your search" : "No active tickets found"}
                    </p>
                    <p className="text-sm mt-1">
                      {searchQuery ? "Try adjusting your filters" : "Upload a manifest to view staged tickets here."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((ticket) => {
                const { Icon, color } = getCategoryDetails(ticket.sub_category, subCategories);
                const annotation = annotationsMap[ticket.ticket_id] || ticket.annotation;
                const displayName = annotation?.contact_name || ticket.contact_name || "Unknown";
                const nCount = nameCounts[displayName.trim()] || 0;
                const isNameFiltered = colFilters.contactName?.has(displayName.trim()) || false;

                const handleNameFilterToggle = (name: string) => {
                  setColFilters(prev => {
                    const next = { ...prev };
                    if (next.contactName?.has(name)) {
                      next.contactName = null;
                    } else {
                      next.contactName = new Set([name]);
                    }
                    return next;
                  });
                };

                const handlePriorityUpdate = async (val: string, isSelectedRow: boolean) => {
                  if (isSelectedRow && selectedIds.size > 1) {
                    setAnnotationsMap(prev => {
                      const updated = { ...prev };
                      selectedIds.forEach(id => {
                        const t = data.find(d => d.id === id);
                        if (t) updated[t.ticket_id] = { ...updated[t.ticket_id], priority_tag: val };
                      });
                      return updated;
                    });
                    const updatePromises = Array.from(selectedIds).map(id => {
                      const t = data.find(d => d.id === id);
                      if (t) return updateAnnotation(t.ticket_id, t.id, "priority_tag", val);
                      return Promise.resolve({ success: false });
                    });
                    await Promise.all(updatePromises);
                    toast.success(`Updated priority tag for ${selectedIds.size} tickets`);
                    setSelectedIds(new Set());
                  } else {
                    setAnnotationsMap(prev => ({
                      ...prev,
                      [ticket.ticket_id]: { ...prev[ticket.ticket_id], priority_tag: val }
                    }));
                    await updateAnnotation(ticket.ticket_id, ticket.id, "priority_tag", val);
                  }
                };

                const handleLocationUpdate = async (area: string, pincode: string, isSelectedRow: boolean) => {
                  if (isSelectedRow && selectedIds.size > 1) {
                    setAnnotationsMap(prev => {
                      const nextMap = { ...prev };
                      Array.from(selectedIds).forEach(id => {
                        const t = data.find(x => x.id === id);
                        if (t) nextMap[t.ticket_id] = { ...(nextMap[t.ticket_id] || t.annotation || { ticket_id: t.ticket_id }), location: area, pincode: pincode };
                      });
                      return nextMap;
                    });
                    const promises = Array.from(selectedIds).map(id => {
                      const t = data.find(x => x.id === id);
                      if (t) return updateTicketLocation(t.ticket_id, t.id, area, pincode);
                    });
                    await Promise.all(promises);
                    setSelectedIds(new Set());
                  } else {
                    setAnnotationsMap(prev => ({
                      ...prev,
                      [ticket.ticket_id]: { ...(prev[ticket.ticket_id] || ticket.annotation || { ticket_id: ticket.ticket_id }), location: area, pincode: pincode }
                    }));
                    await updateTicketLocation(ticket.ticket_id, ticket.id, area, pincode);
                  }
                };

                return (
                  <TicketTableRow
                    key={ticket.id}
                    ticket={ticket}
                    annotation={annotation}
                    isSelected={selectedIds.has(ticket.id)}
                    showCheckboxes={showCheckboxes}
                    showScheduleStatus={showScheduleStatus}
                    toggleSelect={toggleSelect}
                    Icon={Icon}
                    color={color}
                    geoZones={geoZones}
                    nameCount={nCount}
                    isNameFiltered={isNameFiltered}
                    onNameFilterToggle={handleNameFilterToggle}
                    onPriorityUpdate={handlePriorityUpdate}
                    onLocationUpdate={handleLocationUpdate}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
