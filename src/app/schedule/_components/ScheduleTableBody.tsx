"use client";

import React from "react";
import { Tag } from "lucide-react";
import { RouteGroupHeader } from "./RouteGroupHeader";
import { TicketRow } from "./TicketRow";

import { Database } from "@/lib/supabase/database.types";
import { ScheduleLog } from "../_hooks/useScheduleLogic";

type PendingVehicle = { route: string; date: string };
type PendingGt = { route: string; date: string; type: 'gt1'|'gt2' };

export function ScheduleTableBody({
  groupedData,
  searchQuery,
  openFiltersCount,
  statusOptions,
  nameCounts,
  assignedVehicleIds,
  assignedGtIds,
  vehicleDriverOptions,
  gtProfiles,
  onOpenVehicleModal,
  onOpenGtModal
}: {
  groupedData: { route: string; tickets: ScheduleLog[] }[];
  searchQuery: string;
  openFiltersCount: number;
  statusOptions: Database['public']['Tables']['cfg_lookups']['Row'][];
  nameCounts: Record<string, number>;
  assignedVehicleIds: Set<string>;
  assignedGtIds: Set<string>;
  vehicleDriverOptions: Database['public']['Tables']['core_vehicles']['Row'][];
  gtProfiles: Database['public']['Tables']['core_profiles']['Row'][];
  onOpenVehicleModal: (search: string, pending: PendingVehicle) => void;
  onOpenGtModal: (search: string, pending: PendingGt) => void;
}) {
  return (
    <tbody className={`divide-y divide-border/50 transition-all duration-300 ${openFiltersCount > 0 ? 'blur-[1px] opacity-80' : ''}`}>
      {groupedData.length === 0 ? (
        <tr>
          <td colSpan={13} className="px-4 py-12 text-center">
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <Tag className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-base font-medium text-foreground">
                {searchQuery ? "No tickets match your search" : "No scheduled tickets found"}
              </p>
            </div>
          </td>
        </tr>
      ) : (
        groupedData.map(group => {
          return (
            <React.Fragment key={group.route || "unassigned"}>
              <RouteGroupHeader
                group={group}
                onOpenVehicleModal={onOpenVehicleModal}
                onOpenGtModal={onOpenGtModal}
                assignedVehicleIds={assignedVehicleIds}
                assignedGtIds={assignedGtIds}
                vehicleDriverOptions={vehicleDriverOptions}
                gtProfiles={gtProfiles}
              />
              
              {group.tickets.map((ticket: ScheduleLog) => {
                const nameCount = nameCounts[ticket.contact_name?.trim() || "Unknown"] || 1;
                return (
                  <TicketRow 
                    key={ticket.id}
                    ticket={ticket}
                    nameCount={nameCount}
                    statusOptions={statusOptions}
                  />
                );
              })}
            </React.Fragment>
          );
        })
      )}
    </tbody>
  );
}
