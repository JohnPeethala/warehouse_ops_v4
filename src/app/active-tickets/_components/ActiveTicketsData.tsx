import { createClient } from "@/lib/supabase/server";
import { ActiveTicketsView } from "./ActiveTicketsView";

export async function ActiveTicketsData() {
  const supabase = await createClient();
  const { data: stagedData, error: stagedError } = await supabase
    .from("ops_staged_tickets")
    .select("*")
    .order("date", { ascending: true });

  if (stagedError) {
    console.error("Error fetching staged tickets:", stagedError);
  }

  const { data: annotationsData, error: annotationsError } = await supabase
    .from("ops_ticket_annotations")
    .select("*");

  if (annotationsError) {
    console.error("Error fetching annotations:", annotationsError);
  }

  const { data: dispatchLogData, error: dispatchLogError } = await supabase
    .from("ops_dispatch_log")
    .select("ticket_id, scheduled_date");

  if (dispatchLogError) {
    console.error("Error fetching dispatch logs:", dispatchLogError);
  }

  const stagedTickets = stagedData || [];
  const annotations = annotationsData || [];
  const dispatchLogs = dispatchLogData || [];

  // Group dispatch logs by ticket_id to find latest scheduled date
  const latestSchedules: Record<string, string> = {};
  for (const log of dispatchLogs) {
    if (log.scheduled_date) {
      if (!latestSchedules[log.ticket_id] || log.scheduled_date > latestSchedules[log.ticket_id]) {
        latestSchedules[log.ticket_id] = log.scheduled_date;
      }
    }
  }

  // Merge annotations and schedule into staged tickets
  const enrichedTickets = stagedTickets.map(ticket => {
    const annotation = annotations.find(a => a.ticket_id === ticket.ticket_id);
    return {
      ...ticket,
      annotation: annotation || null,
      latest_schedule_date: latestSchedules[ticket.ticket_id] || null
    };
  });

  return <ActiveTicketsView data={enrichedTickets} />;
}
