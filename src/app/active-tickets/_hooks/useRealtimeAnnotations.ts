import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TicketAnnotation, EnrichedTicket } from "@/components/features/ticket-table/types";

export function useRealtimeAnnotations() {
  const [annotationsMap, setAnnotationsMap] = useState<Record<string, TicketAnnotation>>({});

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel('realtime_annotations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ops_ticket_annotations' }, (payload) => {
        const newAnnotation = payload.new as TicketAnnotation;
        setAnnotationsMap(prev => ({
          ...prev,
          [newAnnotation.ticket_id]: newAnnotation
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { annotationsMap, setAnnotationsMap };
}
