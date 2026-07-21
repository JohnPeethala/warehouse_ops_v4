import { useRef, useEffect } from "react";
import type { EnrichedTicket } from "../_components/types";
import { useRealtimeAnnotations } from "./useRealtimeAnnotations";
import { useRealtimeGeoZones } from "./useRealtimeGeoZones";
import { useTicketSelection } from "./useTicketSelection";
import { useTicketFilters } from "./useTicketFilters";
import { useTicketAnalytics } from "./useTicketAnalytics";

export function useTableLogic(data: EnrichedTicket[]) {
  const { annotationsMap, setAnnotationsMap } = useRealtimeAnnotations();
  const { geoZones } = useRealtimeGeoZones();
  
  const dataIds = data.map(t => t.id);
  const { selectedIds, setSelectedIds, toggleSelectAll, toggleSelect } = useTicketSelection(dataIds);

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
