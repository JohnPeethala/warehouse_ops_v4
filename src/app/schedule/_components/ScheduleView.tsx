"use client";

import React, { useState, useEffect } from "react";
import { ScheduleTable } from "./ScheduleTable";
import { ScheduleProvider, useScheduleContext } from "./ScheduleContext";
import { ScheduleHeader } from "./ScheduleHeader";
import { ScheduleModalsManager } from "./ScheduleModalsManager";
import { useSubCategorySettings } from "@/components/providers/SubCategoryProvider";

import { Database } from "@/lib/supabase/database.types";

type Props = {
  logs: Database['public']['Tables']['ops_dispatch_log']['Row'][];
  geoZones: Database['public']['Tables']['cfg_geo_zones']['Row'][];
  profiles: Database['public']['Tables']['core_profiles']['Row'][];
  vehicles: Database['public']['Tables']['core_vehicles']['Row'][];
  lookups: Database['public']['Tables']['cfg_lookups']['Row'][];
};

export function ScheduleView(props: Props) {
  const subCategories = useSubCategorySettings();

  return (
    <ScheduleProvider {...props} subCategories={subCategories}>
      <ScheduleContent />
    </ScheduleProvider>
  );
}

function ScheduleContent() {

  const [headerEl, setHeaderEl] = useState<HTMLElement | null>(null);
  
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isNotDoneModalOpen, setIsNotDoneModalOpen] = useState(false);

  useEffect(() => {
    setHeaderEl(document.getElementById("schedule-header-actions"));
  }, []);

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <ScheduleHeader 
        headerEl={headerEl}
        isReportsOpen={isReportsOpen}
        setIsReportsOpen={setIsReportsOpen}
        setIsSummaryModalOpen={setIsSummaryModalOpen}
        setIsNotDoneModalOpen={setIsNotDoneModalOpen}
        setIsProgressModalOpen={setIsProgressModalOpen}
        setIsAddModalOpen={setIsAddModalOpen}
      />

      {/* Main Table Area */}
      <div className="flex-1 bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col relative z-0">
        <ScheduleTable />
      </div>

      <ScheduleModalsManager 
        isAddModalOpen={isAddModalOpen}
        setIsAddModalOpen={setIsAddModalOpen}
        isSummaryModalOpen={isSummaryModalOpen}
        setIsSummaryModalOpen={setIsSummaryModalOpen}
        isProgressModalOpen={isProgressModalOpen}
        setIsProgressModalOpen={setIsProgressModalOpen}
        isNotDoneModalOpen={isNotDoneModalOpen}
        setIsNotDoneModalOpen={setIsNotDoneModalOpen}
      />
    </div>
  );
}
