import { getCustomBatchIds, fetchCustomBatchTickets } from "@/app/actions/custom_batch";
import { ActiveTicketsView } from "../../active-tickets/_components/ActiveTicketsView";
import { AlertCircle } from "lucide-react";
import { CustomBatchSummaryTrigger } from "./CustomBatchSummaryTrigger";

export async function CustomBatchData() {
  const { data: batchIdsData, error: batchError } = await getCustomBatchIds();
  
  if (batchError || !batchIdsData || !batchIdsData.ticket_ids || batchIdsData.ticket_ids.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center border rounded-xl border-dashed">
        <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
        <p>No backdated tickets found. Click "Update Backdated Tickets" to get started.</p>
      </div>
    );
  }

  const { data: ticketsData, error: ticketsError } = await fetchCustomBatchTickets(batchIdsData.ticket_ids || []);

  if (ticketsError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500 p-8 text-center border border-red-500/20 rounded-xl bg-red-500/5">
        <AlertCircle className="w-8 h-8 mb-2 opacity-80" />
        <p>Failed to load backdated tickets: {ticketsError}</p>
      </div>
    );
  }

  if (!ticketsData || ticketsData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center border rounded-xl border-dashed bg-card/50">
        <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
        <p>This backdated tickets list is currently empty. Click "Update Backdated Tickets" to paste Ticket IDs.</p>
      </div>
    );
  }

  // Format the data to match what ActiveTicketsView expects
  const enrichedTickets = ticketsData.map((ticket: any) => {
    let annotation = null;
    if (ticket.ops_ticket_annotations && Array.isArray(ticket.ops_ticket_annotations) && ticket.ops_ticket_annotations.length > 0) {
      annotation = ticket.ops_ticket_annotations[0];
    } else if (ticket.ops_ticket_annotations && !Array.isArray(ticket.ops_ticket_annotations)) {
      annotation = ticket.ops_ticket_annotations; // in case of one-to-one mapping in PostgREST
    }

    return {
      ...ticket,
      annotation: annotation
    };
  });

  return (
    <>
      <CustomBatchSummaryTrigger tickets={enrichedTickets} />
      <ActiveTicketsView data={enrichedTickets} hideBulkActions={true} />
    </>
  );
}
