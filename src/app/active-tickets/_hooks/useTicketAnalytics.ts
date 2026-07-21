import { useMemo } from "react";
import type { EnrichedTicket, TicketAnnotation } from "../_components/types";

export function useTicketAnalytics(data: EnrichedTicket[], filteredData: EnrichedTicket[], annotationsMap: Record<string, TicketAnnotation>) {
  const latestBatchTicket = useMemo(() => {
    if (!data || data.length === 0) return null;
    return data.reduce((latest, current) => {
      // @ts-ignore
      const current_date = current.created_at ? new Date(current.created_at).getTime() : 0;
      // @ts-ignore
      const latest_date = latest.created_at ? new Date(latest.created_at).getTime() : 0;
      return current_date > latest_date ? current : latest;
    }, data[0]);
  }, [data]);

  const latestBatchId = latestBatchTicket?.batch_id;

  const latestBatchTotal = useMemo(() => {
    return data.filter(t => t.batch_id === latestBatchId).length;
  }, [data, latestBatchId]);

  const latestBatchFilteredCount = useMemo(() => {
    return filteredData.filter(t => t.batch_id === latestBatchId).length;
  }, [filteredData, latestBatchId]);

  const latestBatchPrioCounts = useMemo(() => {
    const counts = { e: 0, v: 0, s: 0, numbers: {} as Record<string, number> };
    filteredData.filter(t => t.batch_id === latestBatchId).forEach(t => {
      const activeAnnotation = annotationsMap[t.ticket_id] || t.annotation;
      const prioTag = (activeAnnotation?.priority_tag || "").toLowerCase();
      if (!prioTag) return;
      
      if (prioTag.includes('e')) counts.e++;
      else if (prioTag.includes('v')) counts.v++;
      else if (prioTag.includes('s')) counts.s++;
      else {
        const match = prioTag.match(/[0-9]/);
        if (match) {
          const n = match[0];
          counts.numbers[n] = (counts.numbers[n] || 0) + 1;
        }
      }
    });
    return counts;
  }, [filteredData, latestBatchId, annotationsMap]);

  const scheduleStats = useMemo(() => {
    const totalSubCounts: Record<string, number> = {};
    const scheduleSubCounts: Record<string, number> = {};

    filteredData.filter(t => t.batch_id === latestBatchId).forEach(t => {
      const cat = t.sub_category || 'Uncategorized';
      totalSubCounts[cat] = (totalSubCounts[cat] || 0) + 1;
      
      const activeAnnotation = annotationsMap[t.ticket_id] || t.annotation;
      const prioTag = (activeAnnotation?.priority_tag || "").toLowerCase();
      if (prioTag.includes('s')) {
        scheduleSubCounts[cat] = (scheduleSubCounts[cat] || 0) + 1;
      }
    });

    return { totalSubCounts, scheduleSubCounts };
  }, [filteredData, latestBatchId, annotationsMap]);

  const nameCounts = useMemo(() => {
    return filteredData.reduce((acc, t) => {
      const name = (t.contact_name || "").trim();
      if (name) acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [filteredData]);

  return {
    latestBatchId,
    latestBatchTotal,
    latestBatchFilteredCount,
    latestBatchPrioCounts,
    scheduleStats,
    nameCounts,
  };
}
