"use client";

import React, { createContext, useContext, useState, useMemo, ReactNode } from "react";
import { useScheduleLogic } from "../_hooks/useScheduleLogic";

type ScheduleLogicReturn = ReturnType<typeof useScheduleLogic>;

export type ScheduleContextType = ScheduleLogicReturn & {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  driverFilter: string;
  setDriverFilter: (driver: string) => void;
  gtFilter: string;
  setGtFilter: (gt: string) => void;
  filteredGroupedData: { route: string; tickets: any[] }[];
  totalTickets: number;
  subCategoryBreakdown: Record<string, number>;
  logs: any[];
  geoZones: any[];
  profiles: any[];
  vehicles: any[];
  lookups: any[];
  subCategories: any[];
  annotationsMap: Record<string, any>;
  setAnnotationsMap: React.Dispatch<React.SetStateAction<Record<string, any>>>;
};

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export function ScheduleProvider({ 
  children, 
  logs, 
  geoZones, 
  profiles, 
  vehicles, 
  lookups, 
  subCategories 
}: { 
  children: ReactNode;
  logs: any[];
  geoZones: any[];
  profiles: any[];
  vehicles: any[];
  lookups: any[];
  subCategories: any[];
}) {
  const scheduleLogic = useScheduleLogic(logs);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [driverFilter, setDriverFilter] = useState("all");
  const [gtFilter, setGtFilter] = useState("all");
  const [annotationsMap, setAnnotationsMap] = useState<Record<string, any>>({});
  
  // Local state for geoZones to support realtime updates
  const [localGeoZones, setLocalGeoZones] = useState<any[]>(geoZones);

  React.useEffect(() => {
    setLocalGeoZones(geoZones);
  }, [geoZones]);

  React.useEffect(() => {
    const supabase = (require("@/lib/supabase/client")).createClient();
    const geoChannel = supabase.channel('realtime_geozones_schedule')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cfg_geo_zones' }, () => {
        (require("@/app/actions/geo")).getGeoZones().then((zones: any) => setLocalGeoZones(zones));
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(geoChannel);
    };
  }, []);

  const filteredGroupedData = useMemo(() => {
    return scheduleLogic.groupedData.map((group: any) => {
      const q = searchQuery.toLowerCase();
      let tickets = group.tickets;
      if (q) {
        tickets = tickets.filter((log: any) => 
          log.ticket_id?.toLowerCase().includes(q) ||
          log.contact_name?.toLowerCase().includes(q) ||
          log.location?.toLowerCase().includes(q) ||
          log.pincode?.toLowerCase().includes(q)
        );
      }

      // Apply Driver Filter
      if (driverFilter !== "all") {
        tickets = tickets.filter((log: any) => log.ops_route_sessions?.vehicle_id === driverFilter);
      }

      // Apply GT Filter
      if (gtFilter !== "all") {
        tickets = tickets.filter((log: any) => 
          log.ops_route_sessions?.gt1_id === gtFilter || 
          log.ops_route_sessions?.gt2_id === gtFilter
        );
      }

      // Apply Col Filters
      if (scheduleLogic.colFilters && Object.keys(scheduleLogic.colFilters).length > 0) {
        tickets = tickets.filter((log: any) => {
          let pass = true;
          if (scheduleLogic.colFilters.check && scheduleLogic.colFilters.check.size > 0) {
             const val = scheduleLogic.selectedIds.has(log.id) ? "Selected" : "Unselected";
             if (!scheduleLogic.colFilters.check.has(val)) pass = false;
          }
          if (scheduleLogic.colFilters.contactName && scheduleLogic.colFilters.contactName.size > 0) {
            const name = log.contact_name?.trim() || "Unknown";
            if (!scheduleLogic.colFilters.contactName.has(name)) pass = false;
          }
          return pass;
        });
      }

      // Apply Sort
      if (scheduleLogic.sortConfig && scheduleLogic.sortConfig.direction) {
        const { key, direction } = scheduleLogic.sortConfig;
        tickets.sort((a: any, b: any) => {
          let valA = a[key as keyof typeof a];
          let valB = b[key as keyof typeof b];
          if (valA === null || valA === undefined) valA = "";
          if (valB === null || valB === undefined) valB = "";
          valA = String(valA).toLowerCase();
          valB = String(valB).toLowerCase();
          
          if (valA < valB) return direction === "asc" ? -1 : 1;
          if (valA > valB) return direction === "asc" ? 1 : -1;
          return 0;
        });
      }

      return tickets.length > 0 ? { ...group, tickets } : null;
    }).filter(Boolean) as { route: string, tickets: any[] }[];
  }, [scheduleLogic.groupedData, searchQuery, driverFilter, gtFilter, scheduleLogic.colFilters, scheduleLogic.selectedIds, scheduleLogic.sortConfig]);

  const totalTickets = filteredGroupedData.reduce((acc, group) => acc + group.tickets.length, 0);
  const subCategoryBreakdown = filteredGroupedData.reduce((acc, group) => {
    group.tickets.forEach(t => {
      const sub = t.sub_category || "Uncategorized";
      acc[sub] = (acc[sub] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const value = {
    ...scheduleLogic,
    searchQuery,
    setSearchQuery,
    driverFilter,
    setDriverFilter,
    gtFilter,
    setGtFilter,
    filteredGroupedData,
    totalTickets,
    subCategoryBreakdown,
    logs,
    geoZones: localGeoZones,
    profiles,
    vehicles,
    lookups,
    subCategories,
    annotationsMap,
    setAnnotationsMap
  };

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useScheduleContext() {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error("useScheduleContext must be used within a ScheduleProvider");
  }
  return context;
}
