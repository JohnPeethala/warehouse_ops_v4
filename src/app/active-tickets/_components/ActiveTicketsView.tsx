"use client";

import React from "react";
import { useSubCategorySettings } from "@/components/providers/SubCategoryProvider";

import type { EnrichedTicket } from "@/components/features/ticket-table/types";
import { useTableLogic } from "../_hooks/useTableLogic";
import { ReadinessBoard } from "./ReadinessBoard";
import { TableToolbar } from "./TableToolbar";
import { ActiveFiltersBar } from "./ActiveFiltersBar";
import { TicketTable } from "@/components/features/ticket-table/TicketTable";

type Props = {
  data: EnrichedTicket[];
  hideBulkActions?: boolean;
};

export function ActiveTicketsView({ data, hideBulkActions }: Props) {
  const {
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
  } = useTableLogic(data);

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <ReadinessBoard latestBatchId={latestBatchId} scheduleStats={scheduleStats} />
      
      <TableToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchInputRef={searchInputRef}
        filterOptions={filterOptions}
        colFilters={colFilters}
        setColFilters={setColFilters}
        latestBatchId={latestBatchId}
        latestBatchPrioCounts={latestBatchPrioCounts}
        latestBatchFilteredCount={latestBatchFilteredCount}
        latestBatchTotal={latestBatchTotal}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        hideBulkActions={hideBulkActions}
      />
      
      <ActiveFiltersBar
        activeFilters={activeFilters}
        removeFilter={removeFilter}
        clearAllFilters={clearAllFilters}
      />
      
      <TicketTable 
        data={data}
        filteredData={filteredData}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        annotationsMap={annotationsMap}
        setAnnotationsMap={setAnnotationsMap}
        geoZones={geoZones}
        searchQuery={searchQuery}
        colFilters={colFilters}
        setColFilters={setColFilters}
        sortConfig={sortConfig}
        handleSort={handleSort}
        filterOptions={filterOptions}
        nameCounts={nameCounts}
        toggleSelectAll={toggleSelectAll}
        toggleSelect={toggleSelect}
      />
    </div>
  );
}
