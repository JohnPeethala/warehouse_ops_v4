"use client";

import { useState, useMemo } from "react";
import { LayoutGrid, ChevronDown, Layers, Truck } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useRoutePlanner } from "./RoutePlannerContext";
import React from "react";

export function RouteStats() {
  const [isOpen, setIsOpen] = useState(true);
  const context = useRoutePlanner();
  
  const { routes, groups, ticketRoutes, categories, getRouteColor } = context;

  const stats = useMemo(() => {
    const s: Record<string, Record<string, number>> = {};
    routes.forEach(r => s[r] = {});
    
    groups.forEach(g => {
      g.tickets.forEach(t => {
        const route = ticketRoutes[`${g.id}::${t.id}`];
        if (route) {
           if (!s[route]) s[route] = {};
           const sub = (t.sub_category || 'general').toLowerCase().trim();
           s[route][sub] = (s[route][sub] || 0) + 1;
        }
      });
    });
    return s;
  }, [routes, groups, ticketRoutes]);

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

  // Do not render anything if no routes exist
  if (!routes || routes.length === 0) return null;

  return (
    <div className={`w-[260px] bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border overflow-hidden flex flex-col transition-all duration-300 ease-in-out pointer-events-auto h-fit max-h-[50vh] ${isOpen ? '' : '!max-h-[38px]'}`}>
      
      {/* Header */}
      <div 
        className="px-4 py-2.5 flex items-center justify-between cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors border-b border-border"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Truck size={14} className="text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Vehicle Summary</h3>
        </div>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-1">
        <div className="flex flex-col">
          {routes.map(route => {
            const routeStatsMap = stats[route] || {};
            const totalAssigned = Object.values(routeStatsMap).reduce((a,b) => a+b, 0);
            const colorInfo = getRouteColor(route);

            return (
              <div 
                key={route} 
                className="group relative px-4 py-2.5 border-b border-border/50 last:border-b-0 hover:bg-muted/30 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-2.5 h-2.5 rounded-full shadow-sm" 
                    style={{ backgroundColor: colorInfo.hex }}
                  />
                  <span className="text-xs font-black uppercase tracking-wider text-foreground">
                    {route}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground ml-1">
                    ({totalAssigned})
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {totalAssigned > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {Object.entries(routeStatsMap).map(([type, count]) => {
                        const { Icon, color } = getIconForCategory(type);
                        return (
                          <div 
                            key={type} 
                            className="flex items-center gap-1 bg-background px-1.5 py-0.5 rounded border border-border/60" 
                            title={`${type}: ${count}`}
                          >
                            {Icon && <Icon size={10} color={color} strokeWidth={2.5} />}
                            <span className="text-[9px] font-bold text-foreground">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
