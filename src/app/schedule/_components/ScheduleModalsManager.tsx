"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { useScheduleContext } from "./ScheduleContext";
import { AddTicketsModal } from "./AddTicketsModal";
import { SummaryModal } from "./SummaryModal";
import { ProgressSummaryModal } from "./ProgressSummaryModal";
import { NotDoneSummaryModal } from "./NotDoneSummaryModal";

export function ScheduleModalsManager({
  isAddModalOpen,
  setIsAddModalOpen,
  isSummaryModalOpen,
  setIsSummaryModalOpen,
  isProgressModalOpen,
  setIsProgressModalOpen,
  isNotDoneModalOpen,
  setIsNotDoneModalOpen,
}: {
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  isSummaryModalOpen: boolean;
  setIsSummaryModalOpen: (open: boolean) => void;
  isProgressModalOpen: boolean;
  setIsProgressModalOpen: (open: boolean) => void;
  isNotDoneModalOpen: boolean;
  setIsNotDoneModalOpen: (open: boolean) => void;
}) {
  const searchParams = useSearchParams();
  const selectedDateStr = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");

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
        selectedDate={selectedDateStr}
      />

      <SummaryModal 
        isOpen={isSummaryModalOpen} 
        onClose={() => setIsSummaryModalOpen(false)} 
        date={selectedDateStr} 
        tickets={filteredGroupedData.flatMap(g => g.tickets)} 
      />

      <ProgressSummaryModal 
        isOpen={isProgressModalOpen} 
        onClose={() => setIsProgressModalOpen(false)} 
        date={selectedDateStr} 
        tickets={filteredGroupedData.flatMap(g => g.tickets)} 
        vehicles={vehicles}
        profiles={profiles}
        subCategories={subCategories}
      />

      <NotDoneSummaryModal 
        isOpen={isNotDoneModalOpen} 
        onClose={() => setIsNotDoneModalOpen(false)} 
        date={selectedDateStr} 
        tickets={filteredGroupedData.flatMap(g => g.tickets)} 
        vehicles={vehicles}
        profiles={profiles}
        subCategories={subCategories}
      />
    </>
  );
}
