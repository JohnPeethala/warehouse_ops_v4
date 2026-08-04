import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { EnrichedTicket } from "@/components/features/ticket-table/types";

export function useRealtimeTickets(initialData: EnrichedTicket[], acceptInserts: boolean = true) {
  const [tickets, setTickets] = useState<EnrichedTicket[]>(initialData);

  // When initial data changes from server (e.g., full page reload), update state.
  useEffect(() => {
    setTickets(initialData);
  }, [initialData]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel('realtime_staged_tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ops_staged_tickets' }, (payload) => {
        if (payload.eventType === 'INSERT' && acceptInserts) {
          // Add new ticket at the beginning
          setTickets(prev => [payload.new as EnrichedTicket, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          // Update existing ticket
          setTickets(prev => prev.map(t => 
            t.id === payload.new.id ? { ...t, ...payload.new } : t
          ));
        } else if (payload.eventType === 'DELETE') {
          // Remove deleted ticket
          setTickets(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { tickets, setTickets };
}
