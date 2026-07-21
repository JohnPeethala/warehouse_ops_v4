"use client";

import { Check, X, Layers, MapPin, Truck, Ticket, Ban, Navigation2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { RouteSelector } from "./RouteSelector";
import { LocationGroup, Category, useRoutePlanner } from "./RoutePlannerContext";
import React from "react";

interface NodeGroupCardProps {
  group: LocationGroup;
  assignedRoute: string;
  ticketRoutes: Record<string, string>;
  isPulsing: boolean;
  showCoords: boolean;
  onToggleCoords: () => void;
  onUpdateCoords: (coords: string) => void;
  onAssignGroupRoute: (route: string) => void;
  onAssignTicketRoute: (ticketId: string, route: string) => void;
}

export function NodeGroupCard({
  group,
  assignedRoute,
  ticketRoutes,
  isPulsing,
  showCoords,
  onToggleCoords,
  onUpdateCoords,
  onAssignGroupRoute,
  onAssignTicketRoute
}: NodeGroupCardProps) {
  const context = useRoutePlanner();
  const categories = context.categories || [];
  const { selectedGroupIds, toggleGroupSelection } = context;
  
  const isSelected = selectedGroupIds.has(group.id);
  
  const isMixed = assignedRoute === "MIXED";
  const routeColor = (assignedRoute && !isMixed) ? context.getRouteColor(assignedRoute) : null;
  const hasCoords = !!group.coords;
  
  const typeSummary: Record<string, number> = {};
  group.tickets?.forEach((t) => {
    const k = (t.sub_category || 'general').toLowerCase().trim();
    typeSummary[k] = (typeSummary[k] || 0) + 1;
  });

  const getIconForCategory = (categoryName: string) => {
    const match = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
    if (match) {
      const icons = LucideIcons as Record<string, React.FC<any>>;
      let IconComponent = icons[match.icon_name];
      if (!IconComponent) {
        const key = Object.keys(icons).find(k => k.toLowerCase() === match.icon_name.toLowerCase());
        if (key) IconComponent = icons[key];
      }
      return { Icon: IconComponent || LucideIcons.HelpCircle, color: match.color };
    }
    return { Icon: LucideIcons.HelpCircle, color: "#9ca3af" };
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (e.shiftKey || context.isMultiSelectMode) {
      toggleGroupSelection(group.id, true);
    } else {
      if (group.coords) {
        window.dispatchEvent(new CustomEvent('planner-map-action', { detail: { action: 'panToNode', coords: group.coords } }));
      }
    }
  };

  return (
    <div id={`node-group-${group.id}`} className={`flex flex-col border-l-[3px] rounded-r-xl overflow-hidden shrink-0 transition-all duration-300 ${
      isSelected ? 'bg-blue-500/10 border-blue-500 ring-1 ring-blue-500 shadow-md' : 'bg-card border-border shadow-sm'
    } ${
      !isSelected && isMixed 
        ? 'border-l-purple-500'
        : (!isSelected && routeColor 
            ? routeColor.borderColor 
            : '')
    } ${isPulsing && !isSelected ? 'ring-2 ring-blue-500/30 scale-[0.99]' : ''}`}>
      
      {/* Card Header */}
      <div 
        className={`p-2 border-b border-border cursor-pointer transition-colors ${isSelected ? 'bg-transparent' : 'bg-card hover:bg-muted/50'}`}
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between gap-2">
          
          <div className={`w-7 h-7 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-500 text-white border-blue-600' : 'border-border bg-muted text-foreground'}`}>
            {isSelected ? <Check size={14} strokeWidth={3} /> : <span className="text-xs font-black leading-none">{group.serial || '0'}</span>}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              {!hasCoords && (
                <span title="OFF-MAP" className="shrink-0 flex"><Ban size={10} className="text-destructive" strokeWidth={2.5} /></span>
              )}
              <h4 className="text-xs font-bold uppercase text-foreground truncate leading-none">{group.originalArea}</h4>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground ml-1 leading-none pt-[1px]">{group.pincode}</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-1 mt-2">
              <div className="flex items-center justify-center h-6 px-2 rounded border border-border bg-muted/50 mr-1" title="Total Tickets">
                <Ticket size={12} className="text-muted-foreground" strokeWidth={2.5} />
                <span className="text-[10px] font-semibold text-foreground ml-1">{group.tickets?.length || 0}</span>
              </div>
              {Object.entries(typeSummary).map(([typeKey, count]) => {
                const { Icon, color } = getIconForCategory(typeKey);
                return (
                  <div key={typeKey} className="flex items-center justify-center h-6 px-2 rounded border border-border bg-muted/50" title={typeKey}>
                    {Icon && <Icon size={12} color={color} strokeWidth={2.5} />}
                    <span className="text-[10px] font-semibold text-muted-foreground ml-1">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <RouteSelector 
                  value={assignedRoute}
                  onSelect={onAssignGroupRoute}
                  iconOnly={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Card Section */}
      <div className="flex flex-col">
        {/* Ticket List */}
        <div className={`flex flex-col ${isMixed ? 'bg-purple-500/10' : 'bg-card'}`}>
          {group.tickets?.map((ticket, tIdx) => {
            const { Icon, color } = getIconForCategory(ticket.sub_category);
            const ticketKey = `${group.id}::${ticket.id}`;
            const ticketRoute = ticketRoutes[ticketKey] || '';
            
            return (
              <div key={tIdx} className="px-2 py-1 flex items-center gap-2 border-b border-border last:border-b-0 transition-colors">
                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                  {Icon && <span title={ticket.sub_category} className="shrink-0 flex"><Icon size={12} color={color} strokeWidth={2.5} /></span>}
                  <span className="text-[10px] font-bold text-foreground">{ticket.ticket_id || 'NO-ID'}</span>
                  <span className="text-[10px] font-bold uppercase truncate text-foreground ml-1">{ticket.name || 'No Name'}</span>
                </div>
                
                <div className="shrink-0 scale-90 origin-right">
                  <RouteSelector 
                    value={ticketRoute}
                    onSelect={(v) => onAssignTicketRoute(ticket.id, v)}
                    iconOnly={true}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
