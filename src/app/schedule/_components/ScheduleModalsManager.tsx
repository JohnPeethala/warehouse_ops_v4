"use client";

import React from "react";
import { useScheduleContext } from "./ScheduleContext";
import { AddTicketsModal } from "./AddTicketsModal";
import { BulkCopyModal } from "./BulkCopyModal";
import { SummaryModal } from "./SummaryModal";
import { ProgressSummaryModal } from "./ProgressSummaryModal";
import { NotDoneSummaryModal } from "./NotDoneSummaryModal";

export function ScheduleModalsManager({
  isAddModalOpen,
  setIsAddModalOpen,
  isBulkCopyModalOpen,
  setIsBulkCopyModalOpen,
  isSummaryModalOpen,
  setIsSummaryModalOpen,
  isProgressModalOpen,
  setIsProgressModalOpen,
  isNotDoneModalOpen,
  setIsNotDoneModalOpen,
}: {
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  isBulkCopyModalOpen: boolean;
  setIsBulkCopyModalOpen: (open: boolean) => void;
  isSummaryModalOpen: boolean;
  setIsSummaryModalOpen: (open: boolean) => void;
  isProgressModalOpen: boolean;
  setIsProgressModalOpen: (open: boolean) => void;
  isNotDoneModalOpen: boolean;
  setIsNotDoneModalOpen: (open: boolean) => void;
}) {
  const {
    filteredGroupedData,
    logs,
    vehicles,
    profiles,
    subCategories,
    handleAddLogs
  } = useScheduleContext();

  return (
    <>
      <AddTicketsModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onTicketsAdded={handleAddLogs} 
      />

      <BulkCopyModal
        isOpen={isBulkCopyModalOpen}
        onClose={() => setIsBulkCopyModalOpen(false)}
        vehicles={vehicles}
        profiles={profiles}
      />

      <SummaryModal 
        isOpen={isSummaryModalOpen} 
        onClose={() => setIsSummaryModalOpen(false)} 
        date={logs[0]?.scheduled_date || ""} 
        tickets={filteredGroupedData.flatMap(g => g.tickets)} 
      />

      <ProgressSummaryModal 
        isOpen={isProgressModalOpen} 
        onClose={() => setIsProgressModalOpen(false)} 
        date={logs[0]?.scheduled_date || ""} 
        tickets={filteredGroupedData.flatMap(g => g.tickets)} 
      />

      <NotDoneSummaryModal 
        isOpen={isNotDoneModalOpen} 
        onClose={() => setIsNotDoneModalOpen(false)} 
        date={logs[0]?.scheduled_date || ""} 
        tickets={filteredGroupedData.flatMap(g => g.tickets)} 
        vehicles={vehicles}
        profiles={profiles}
        subCategories={subCategories}
      />
    </>
  );
}
