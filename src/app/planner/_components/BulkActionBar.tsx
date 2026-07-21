"use client";

import { X } from "lucide-react";
import { RouteSelector } from "./RouteSelector";
import { useRoutePlanner } from "./RoutePlannerContext";

export function BulkActionBar() {
  const context = useRoutePlanner();

  if (!context?.selectedGroupIds || context.selectedGroupIds.size === 0) {
    return null;
  }

  return (
    <div className="sticky top-0 z-20 mb-2 p-3 rounded-xl border border-blue-500/30 bg-blue-500/10 backdrop-blur-md shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xs font-black text-blue-500 uppercase tracking-wider">{context.selectedGroupIds.size} Selected</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="scale-90 origin-right">
          <RouteSelector 
            value=""
            onSelect={(v) => context.bulkAssignGroupRoute(v)}
          />
        </div>
        <button 
          onClick={() => context.clearGroupSelection()}
          className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded text-foreground transition-colors"
          title="Clear Selection"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
