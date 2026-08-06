import React, { useState, useEffect } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { EntityDropdown } from "./cells/EntityDropdown";
import { useScheduleContext } from "./ScheduleContext";

export function RouteGroupHeader({
  group,
  onOpenVehicleModal,
  onOpenGtModal,
  assignedVehicleIds,
  assignedGtIds,
  vehicleDriverOptions,
  gtProfiles,
}: {
  group: any;
  onOpenVehicleModal: (search: string, pending: any) => void;
  onOpenGtModal: (search: string, pending: any) => void;
  assignedVehicleIds: Set<string>;
  assignedGtIds: Set<string>;
  vehicleDriverOptions: any[];
  gtProfiles: any[];
}) {
  const { selectedIds, setSelectedIds, handleRouteSessionUpdate } = useScheduleContext();
  
  const isUnassigned = !group.route;
  const routeSession = group.tickets[0]?.ops_route_sessions || {};
  const tripDate = group.tickets[0]?.scheduled_date || group.tickets[0]?.created_at;

  const [startKm, setStartKm] = useState(routeSession.starting_km?.toString() || "");
  const [endKm, setEndKm] = useState(routeSession.ending_km?.toString() || "");
  const [totalKm, setTotalKm] = useState(routeSession.total_km?.toString() || "");

  useEffect(() => {
    setStartKm(routeSession.starting_km?.toString() || "");
    setEndKm(routeSession.ending_km?.toString() || "");
    setTotalKm(routeSession.total_km?.toString() || "");
  }, [routeSession.starting_km, routeSession.ending_km, routeSession.total_km]);

  return (
    <tr className="bg-zinc-100 dark:bg-zinc-900 border-y border-border/50">
      <td className="px-2 py-1 sticky left-0 z-10 bg-zinc-100 dark:bg-zinc-900 border-r border-border/50 w-[56px] shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)] align-middle text-center">
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const groupTicketIds = group.tickets.map((t: any) => t.id);
              const allSelected = groupTicketIds.every((id: any) => selectedIds.has(id));
              const next = new Set(selectedIds);
              if (allSelected) {
                groupTicketIds.forEach((id: any) => next.delete(id));
              } else {
                groupTicketIds.forEach((id: any) => next.add(id));
              }
              setSelectedIds(next);
            }}
            className="flex items-center justify-center p-0.5 rounded-full hover:bg-green-500/10 text-green-500 transition-colors group/chk"
            title="Select/Deselect all in group"
          >
            {group.tickets.length > 0 && group.tickets.every((t: any) => selectedIds.has(t.id)) ? (
              <CheckCircle2 className="w-5 h-5 fill-green-500 text-white dark:text-zinc-900 drop-shadow-sm transition-transform group-hover/chk:scale-110" />
            ) : group.tickets.some((t: any) => selectedIds.has(t.id)) ? (
              <div className="w-[18px] h-[18px] rounded-full border-[2.5px] border-green-500 flex items-center justify-center transition-transform group-hover/chk:scale-110 shadow-sm mx-[1px]">
                <div className="w-2 h-[2.5px] bg-green-500 rounded-full" />
              </div>
            ) : (
              <Circle className="w-[18px] h-[18px] text-green-500/40 group-hover/chk:text-green-500 transition-all group-hover/chk:scale-110 mx-[1px]" strokeWidth={2.5} />
            )}
          </button>
        </div>
      </td>
      <td className="px-2 py-1 font-bold text-foreground text-center text-sm border-r border-border/50 whitespace-nowrap">
        {isUnassigned ? `Unassigned (${group.tickets.length})` : `Route ${group.route} (${group.tickets.length})`}
      </td>
      <td colSpan={11} className="px-4 py-1.5 border-r border-border/50">
        <div className="flex items-center justify-start gap-8 w-full">
          <div className="flex items-center gap-6">
            {!isUnassigned && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">Vehicle/Driver:</span>
                  <EntityDropdown
                    value={routeSession.vehicle_id}
                    onChange={(val) => {
                      handleRouteSessionUpdate(group.route, tripDate, { vehicle_id: val || null });
                    }}
                    options={vehicleDriverOptions.filter((o: any) => !assignedVehicleIds.has(o.id) || o.id === routeSession.vehicle_id)}
                    placeholder="Select..."
                    widthClass="w-[280px]"
                    dropdownWidthClass="w-[280px]"
                    onCreateNew={(search) => {
                      onOpenVehicleModal(search, { route: group.route, date: tripDate, type: 'vehicle' });
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">GT1:</span>
                  <EntityDropdown
                    value={routeSession.gt1_id}
                    onChange={(val) => handleRouteSessionUpdate(group.route, tripDate, { gt1_id: val || null })}
                    options={gtProfiles.map((p: any) => ({ id: p.id, label: p.name })).filter((o: any) => !assignedGtIds.has(o.id) || o.id === routeSession.gt1_id)}
                    placeholder="Select..."
                    onCreateNew={(search) => {
                      onOpenGtModal(search, { route: group.route, date: tripDate, type: 'gt1' });
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">GT2:</span>
                  <EntityDropdown
                    value={routeSession.gt2_id}
                    onChange={(val) => handleRouteSessionUpdate(group.route, tripDate, { gt2_id: val || null })}
                    options={gtProfiles.map((p: any) => ({ id: p.id, label: p.name })).filter((o: any) => !assignedGtIds.has(o.id) || o.id === routeSession.gt2_id)}
                    placeholder="Select..."
                    onCreateNew={(search) => {
                      onOpenGtModal(search, { route: group.route, date: tripDate, type: 'gt2' });
                    }}
                  />
                </div>
                
                {/* KM tracking block */}
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-border/50 bg-slate-50 dark:bg-slate-800/30 py-1 px-3 rounded-lg border border-slate-200 dark:border-slate-700/50">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Start KM</span>
                    <input 
                      type="number"
                      className="w-20 px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 font-semibold hide-spinners outline-none focus:ring-1 focus:ring-slate-400"
                      value={startKm}
                      onChange={(e) => setStartKm(e.target.value)}
                      onBlur={() => {
                        const val = startKm ? Number(startKm) : null;
                        if (val !== routeSession.starting_km) {
                          const updates: Record<string, any> = { starting_km: val };
                          const end = endKm ? Number(endKm) : null;
                          if (val !== null && end !== null) {
                            updates.total_km = Math.max(0, end - val);
                            setTotalKm(updates.total_km.toString());
                          }
                          handleRouteSessionUpdate(group.route, tripDate, updates);
                        }
                      }}
                      placeholder="---"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">End KM</span>
                    <input 
                      type="number"
                      className="w-20 px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 font-semibold hide-spinners outline-none focus:ring-1 focus:ring-slate-400"
                      value={endKm}
                      onChange={(e) => setEndKm(e.target.value)}
                      onBlur={() => {
                        const val = endKm ? Number(endKm) : null;
                        if (val !== routeSession.ending_km) {
                          const updates: Record<string, any> = { ending_km: val };
                          const start = startKm ? Number(startKm) : null;
                          if (val !== null && start !== null) {
                            updates.total_km = Math.max(0, val - start);
                            setTotalKm(updates.total_km.toString());
                          }
                          handleRouteSessionUpdate(group.route, tripDate, updates);
                        }
                      }}
                      placeholder="---"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Total</span>
                    <div className="w-16 px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-slate-200/50 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-slate-100 min-h-[26px] flex items-center">
                      {totalKm || "---"}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">KM</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}
