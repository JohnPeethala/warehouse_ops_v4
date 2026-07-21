"use client";

import { useState } from "react";
import { Database } from "lucide-react";
import { useRoutePlanner } from "./RoutePlannerContext";
import { NodeGroupCard } from "./NodeGroupCard";
import { DispatchHeader } from "./DispatchHeader";
import { BulkActionBar } from "./BulkActionBar";

export function DispatchConsole() {
  const context = useRoutePlanner();
  
  const groups = context?.groups || [];
  const unassignedCount = context?.unassignedCount || 0;
  const totalTickets = groups.reduce((sum, g) => sum + g.tickets.length, 0);
  
  const [isScrolled, setIsScrolled] = useState(false);

  return (
    <aside className="absolute top-5 right-5 bottom-5 flex gap-3 z-30 pointer-events-none">
      <div className="w-[380px] h-full rounded-xl border border-border flex flex-col overflow-hidden shadow-lg bg-card/95 backdrop-blur-md pointer-events-auto">
        
        <DispatchHeader 
          isScrolled={isScrolled} 
          unassignedCount={unassignedCount} 
          totalTickets={totalTickets} 
        />

        <div 
          className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-2 no-scrollbar bg-background relative"
          onScroll={(e) => setIsScrolled((e.target as HTMLDivElement).scrollTop > 5)}
        >
          <BulkActionBar />

          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
              <Database size={32} strokeWidth={1} />
              <p className="text-xs font-black uppercase tracking-[0.2em] text-center leading-relaxed text-muted-foreground/60">System ready for<br />manifest ingestion</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pb-40">
              {groups.map((group) => {
                const assignedRoute = context.groupRoutes[group.id] || '';
                const showCoords = false; // Add state if needed

                return (
                  <NodeGroupCard
                    key={group.id}
                    group={group}
                    assignedRoute={assignedRoute}
                    ticketRoutes={context.ticketRoutes}
                    isPulsing={false}
                    showCoords={showCoords}
                    onToggleCoords={() => {}}
                    onUpdateCoords={(coords) => context.updateCoords(group.id, coords)}
                    onAssignGroupRoute={(v) => context.assignGroupRoute(group.id, v)}
                    onAssignTicketRoute={(tId, v) => context.assignTicketRoute(group.id, tId, v)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
