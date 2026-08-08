import { useRef, useEffect, useState } from "react";
import type { EnrichedTicket } from "@/components/features/ticket-table/types";
import { useRealtimeAnnotations } from "./useRealtimeAnnotations";
import { useRealtimeGeoZones } from "./useRealtimeGeoZones";
import { useTicketFilters } from "./useTicketFilters";
import { useTicketAnalytics } from "./useTicketAnalytics";

export function useTableLogic(data: EnrichedTicket[]) {
  const { annotationsMap, setAnnotationsMap } = useRealtimeAnnotations();
  const { geoZones } = useRealtimeGeoZones();
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const {
    searchQuery,
    setSearchQuery,
    colFilters,
    setColFilters,
    sortConfig,
    handleSort,
    filterOptions,
    activeFilters,
    removeFilter,
    clearAllFilters,
    filteredData,
  } = useTicketFilters(data, annotationsMap, selectedIds);

  const {
    latestBatchId,
    latestBatchTotal,
    latestBatchFilteredCount,
    latestBatchPrioCounts,
    scheduleStats,
    nameCounts,
  } = useTicketAnalytics(data, filteredData, annotationsMap);

  const toggleSelectAll = () => {
    const filteredIds = filteredData.map(t => t.id);
    const allSelected = filteredIds.every(id => selectedIds.has(id));
    
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected && filteredIds.length > 0) {
        filteredIds.forEach(id => next.delete(id));
      } else {
        filteredIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    selectedIds,
    setSelectedIds,
    annotationsMap,
    setAnnotationsMap,
    geoZones,
    searchQuery,
    setSearchQuery,
    searchInputRef,
    colFilters,
    setColFilters,
    sortConfig,
    handleSort,
    filterOptions,
    activeFilters,
    removeFilter,
    clearAllFilters,
    filteredData,
    latestBatchId,
    latestBatchTotal,
    latestBatchFilteredCount,
    latestBatchPrioCounts,
    scheduleStats,
    nameCounts,
    toggleSelectAll,
    toggleSelect
  };
}
