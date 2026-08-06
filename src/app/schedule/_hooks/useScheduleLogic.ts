import { useState, useMemo, useCallback } from "react";
import { 
  updateDispatchLogField, 
  appendNoteOrRemark, 
  updateRouteSession,
  bulkUpdateDispatchLogFields,
  deleteDispatchLog,
  updateDispatchLogFields
} from "@/app/actions/schedule";

import { Database } from "@/lib/supabase/database.types";
import { toast } from "sonner";

export type ScheduleLog = Database['public']['Tables']['ops_dispatch_log']['Row'] & { ops_route_sessions?: any };

export function useScheduleLogic(initialLogs: ScheduleLog[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [colFilters, setColFilters] = useState<Record<string, Set<string> | null>>({});
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'|null} | null>({ key: 'contact_name', direction: 'asc' });
  
  // Optimistic state for single fields
  const [optimisticLogs, setOptimisticLogs] = useState<Record<string, Partial<ScheduleLog>>>({});

  // Optimistic state for route sessions (affects all tickets in a route)
  // Format: { [routeLetter]: { vehicle_id: "...", driver_id: "..." } }
  const [optimisticSessions, setOptimisticSessions] = useState<Record<string, Record<string, string | null>>>({});

  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  // Newly added logs from the UI
  const [addedLogs, setAddedLogs] = useState<ScheduleLog[]>([]);

  // 1. Merge optimistic state with server data + added logs
  const data = useMemo(() => {
    return [...initialLogs, ...addedLogs]
      .filter(log => !deletedIds.has(log.id))
      .map(log => {
      const merged = { ...log, ...optimisticLogs[log.id] };
      
      const routeStr = merged.route?.toUpperCase() || "";
      const dateStr = merged.scheduled_date || "";
      const sessionKey = `${dateStr}_${routeStr}`;
      
      if (routeStr && optimisticSessions[sessionKey]) {
        merged.ops_route_sessions = {
          ...(merged.ops_route_sessions || {}),
          ...optimisticSessions[sessionKey]
        };
      }
      return merged;
    });
  }, [initialLogs, addedLogs, deletedIds, optimisticLogs, optimisticSessions]);

  // 2. Group the merged data by route
  const groupedData = useMemo(() => {
    const groups: Record<string, ScheduleLog[]> = {};
    const unassigned: ScheduleLog[] = [];

    data.forEach(log => {
      const route = log.route?.toUpperCase() || "";
      if (route && route !== "UNASSIGNED") {
        if (!groups[route]) groups[route] = [];
        groups[route].push(log);
      } else {
        unassigned.push(log);
      }
    });

    // Sort route keys alphabetically
    const sortedGroups = Object.keys(groups).sort().map(key => ({
      route: key,
      tickets: groups[key] // We could apply sorting here later if needed
    }));

    if (unassigned.length > 0) {
      sortedGroups.unshift({ route: "Unassigned", tickets: unassigned });
    }

    return sortedGroups;
  }, [data]);

  const toggleSelectAll = () => {
    const allIds = data.map(t => t.id);
    if (selectedIds.size === allIds.length && allIds.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const filterOptions = useMemo(() => {
    const checkMap = new Map<string, number>();
    const dateMap = new Map<string, number>();
    const routeMap = new Map<string, number>();
    const scheduleMap = new Map<string, number>();
    const opsMap = new Map<string, number>();

    data.forEach((log: any) => {
      const isChecked = selectedIds.has(log.id) ? "Selected" : "Unselected";
      checkMap.set(isChecked, (checkMap.get(isChecked) || 0) + 1);

      const dKey = log.scheduled_date || "-";
      dateMap.set(dKey, (dateMap.get(dKey) || 0) + 1);

      const rKey = log.route || "Unassigned";
      routeMap.set(rKey, (routeMap.get(rKey) || 0) + 1);

      const sKey = log.status || "Pending";
      scheduleMap.set(sKey, (scheduleMap.get(sKey) || 0) + 1);

      const oKey = log.sub_status || "Pending";
      opsMap.set(oKey, (opsMap.get(oKey) || 0) + 1);
    });

    const toOptions = (map: Map<string, number>) => Array.from(map.entries()).map(([label, count]) => ({ label, count })).sort((a, b) => a.label.localeCompare(b.label));

    return {
      check: toOptions(checkMap),
      prio: [],
      schedule: toOptions(scheduleMap),
      date: toOptions(dateMap),
      route: toOptions(routeMap),
      tags: [],
      ops: toOptions(opsMap)
    };
  }, [data, selectedIds]);
  
  const nameCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(log => {
      const name = log.contact_name?.trim() || "Unknown";
      counts[name] = (counts[name] || 0) + 1;
    });
    return counts;
  }, [data]);

  const handleBulkUpdate = useCallback(async (field: string, value: string) => {
    if (selectedIds.size === 0) return;
    
    const ids = Array.from(selectedIds);
    
    // Optimistic update
    setOptimisticLogs(prev => {
      const next = { ...prev };
      const updates: Record<string, string> = { [field]: value };
      if (field === 'route') {
        updates.gt_trip_id = null;
        updates.ops_route_sessions = null;
      }
      ids.forEach(id => {
        next[id] = { ...next[id], ...updates };
      });
      return next;
    });

    // Server update
    const res = await bulkUpdateDispatchLogFields(ids, { [field]: value });
    if (!res.success) {
      alert("Failed to bulk update: " + res.error);
    }
  }, [selectedIds]);

  const handleFieldUpdate = useCallback(async (id: string, field: string, value: string) => {
    if (selectedIds.has(id) && selectedIds.size > 1) {
      handleBulkUpdate(field, value);
      return;
    }
    
    // Optimistic update
    setOptimisticLogs(prev => {
      const updates: Record<string, string> = { [field]: value };
      if (field === 'route') {
        updates.gt_trip_id = null;
        updates.ops_route_sessions = null;
      }
      return {
        ...prev,
        [id]: { ...prev[id], ...updates }
      };
    });

    // Server update
    const res = await updateDispatchLogField(id, field, value);
    if (!res.success) {
      alert("Failed to update field: " + res.error);
    }
  }, [selectedIds, handleBulkUpdate]);

  // Handle multiple fields update (e.g. status and sub_status)
  const handleFieldsUpdate = useCallback((id: string, updates: Record<string, string | null>) => {
    let targetIds = [id];
    if (selectedIds.has(id) && selectedIds.size > 1) {
      targetIds = Array.from(selectedIds);
    }

    setOptimisticLogs(prev => {
      const next = { ...prev };
      targetIds.forEach(targetId => {
        next[targetId] = { ...(next[targetId] || {}), ...updates };
      });
      return next;
    });

    targetIds.forEach(targetId => {
      updateDispatchLogFields(targetId, updates);
    });
    
    if (targetIds.length > 1) {
      toast.success(`Updated status for ${targetIds.length} tickets`);
      setSelectedIds(new Set()); // Auto-clear selection after bulk action
    }
  }, [selectedIds]);

  const handleAppendText = useCallback(async (id: string, field: 'notes' | 'remarks', newText: string) => {
    // Server action returns the fully formatted string
    const res = await appendNoteOrRemark(id, field, newText);
    if (res.success && res.finalVal) {
      setOptimisticLogs(prev => ({
        ...prev,
        [id]: { ...prev[id], [field]: res.finalVal }
      }));
    } else {
      alert("Failed to add text: " + res.error);
    }
  }, []);

  const handleRouteSessionUpdate = useCallback(async (
    route: string, 
    date: string, 
    updates: Record<string, any>
  ) => {
    if (!route || !date) return;
    const sessionKey = `${date}_${route.toUpperCase()}`;

    // Optimistic update
    setOptimisticSessions(prev => ({
      ...prev,
      [sessionKey]: {
        ...(prev[sessionKey] || {}),
        ...updates
      }
    }));

    // Server update
    const res = await updateRouteSession(route, date, updates);
    if (!res.success) {
      alert("Failed to update route session: " + res.error);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    let targetIds = [id];
    if (selectedIds.has(id) && selectedIds.size > 1) {
      targetIds = Array.from(selectedIds);
    }

    const msg = targetIds.length > 1 
      ? `Are you sure you want to delete these ${targetIds.length} tickets from the schedule?`
      : "Are you sure you want to delete this ticket from the schedule?";
    if (!window.confirm(msg)) return;
    
    // Optimistic delete
    setDeletedIds(prev => {
      const next = new Set(prev);
      targetIds.forEach(targetId => next.add(targetId));
      return next;
    });

    let successCount = 0;
    let failCount = 0;

    for (const targetId of targetIds) {
      const res = await deleteDispatchLog(targetId);
      if (res.success) {
        successCount++;
      } else {
        failCount++;
        // Revert optimistic delete for this one
        setDeletedIds(prev => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
      }
    }

    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} tickets.`);
    }
    if (successCount > 0) {
      toast.success(`Deleted ${successCount} tickets.`);
      if (targetIds.length > 1) {
        setSelectedIds(new Set()); // Auto-clear selection
      }
    }
  }, [selectedIds]);

  const handleAddLogs = useCallback((newLogs: ScheduleLog[]) => {
    setAddedLogs(prev => [...prev, ...newLogs]);
  }, []);

  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => prev?.key === key && prev.direction === 'asc' ? { key, direction: 'desc' } : { key, direction: 'asc' });
  }, []);

  return {
    data,
    groupedData,
    selectedIds,
    setSelectedIds,
    handleFieldUpdate,
    handleFieldsUpdate,
    handleAppendText,
    handleRouteSessionUpdate,
    handleBulkUpdate,
    handleDelete,
    colFilters,
    setColFilters,
    sortConfig,
    setSortConfig,
    handleSort,
    filterOptions,
    nameCounts,
    toggleSelectAll,
    toggleSelect,
    handleAddLogs
  };
}
