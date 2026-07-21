"use client";

import React from "react";
import { Check } from "lucide-react";
import { getCategoryDetails } from "@/lib/categoryUtils";
import { useSubCategorySettings } from "@/components/providers/SubCategoryProvider";

type Props = {
  latestBatchId: string | null | undefined;
  scheduleStats: {
    totalSubCounts: Record<string, number>;
    scheduleSubCounts: Record<string, number>;
  };
};

export function ReadinessBoard({ latestBatchId, scheduleStats }: Props) {
  const subCategories = useSubCategorySettings();

  if (!latestBatchId || Object.keys(scheduleStats.totalSubCounts).length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-6 px-3 py-2 bg-card/40 backdrop-blur-xl border border-border rounded-lg shadow-sm mb-1">
      <div className="flex items-center gap-5 flex-wrap">
        <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Schedule Done:</span>
        {Object.entries(scheduleStats.totalSubCounts)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([cat, total]) => {
          const successCount = scheduleStats.scheduleSubCounts[cat] || 0;
          const isReady = successCount > 0 && successCount === total;
          
          const { Icon, color } = getCategoryDetails(cat === 'Uncategorized' ? null : cat, subCategories);
          
          return (
            <div key={cat} className={`flex items-center gap-1.5 ${successCount > 0 ? 'text-foreground' : 'text-muted-foreground opacity-60'} transition-colors`} title={`${cat} tickets`}>
              <div style={{ color }}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm">{successCount} <span className="text-xs text-muted-foreground font-medium">/ {total}</span></span>
              {isReady && <Check size={16} className="text-primary -ml-0.5" strokeWidth={3} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
