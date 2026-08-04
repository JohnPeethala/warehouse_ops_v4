import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ScheduleLog } from "@/app/schedule/_hooks/useScheduleLogic";

export function useRealtimeDispatchLogs(initialData: ScheduleLog[]) {
  const [logs, setLogs] = useState<ScheduleLog[]>(initialData);

  // Update when server data changes
  useEffect(() => {
    setLogs(initialData);
  }, [initialData]);

  useEffect(() => {
    const supabase = createClient();
    
    // Listen to dispatch log changes (like status updates)
    const logChannel = supabase.channel('realtime_dispatch_logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ops_dispatch_log' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          // New dispatch log, but usually it comes through staged tickets first.
          // We'll add it if it's not already there.
          setLogs(prev => {
            const exists = prev.some(l => l.id === payload.new.id);
            if (exists) return prev;
            return [...prev, payload.new as ScheduleLog];
          });
        } else if (payload.eventType === 'UPDATE') {
          setLogs(prev => prev.map(log => {
            if (log.id === payload.new.id) {
              // Merge the update but preserve joined data like ops_route_sessions
              return { ...log, ...payload.new, ops_route_sessions: log.ops_route_sessions };
            }
            return log;
          }));
        } else if (payload.eventType === 'DELETE') {
          setLogs(prev => prev.filter(log => log.id !== payload.old.id));
        }
      })
      .subscribe();

    // Listen to route session changes (like GT assignment)
    const sessionChannel = supabase.channel('realtime_route_sessions')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ops_route_sessions' }, (payload) => {
        setLogs(prev => prev.map(log => {
          if (log.gt_trip_id === payload.new.id) {
            return {
              ...log,
              ops_route_sessions: { ...log.ops_route_sessions, ...payload.new }
            };
          }
          return log;
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(logChannel);
      supabase.removeChannel(sessionChannel);
    };
  }, []);

  return { logs, setLogs };
}
