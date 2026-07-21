"use server";

import { createClient } from "@/lib/supabase/server";

export async function getCustomBatchIds() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("ops_custom_batch")
    .select("ticket_ids, updated_at")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("Error fetching custom batch IDs:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function updateCustomBatchIds(ticketIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("ops_custom_batch")
    .update({ 
      ticket_ids: ticketIds, 
      updated_at: new Date().toISOString(),
      updated_by: user.id 
    })
    .eq("id", 1);

  if (error) {
    console.error("Error updating custom batch IDs:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function fetchCustomBatchTickets(ticketIds: string[]) {
  if (!ticketIds || ticketIds.length === 0) {
    return { success: true, data: [] };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Fetch the tickets from ops_staged_tickets matching these IDs
  const { data, error } = await supabase
    .from("ops_staged_tickets")
    .select(`
      *,
      ops_ticket_annotations (*)
    `)
    .in("ticket_id", ticketIds)
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching custom batch tickets:", error);
    return { success: false, error: error.message };
  }

  // To preserve the order of the pasted IDs, we can sort the results based on the input array
  if (data && data.length > 0) {
    const idMap = new Map(ticketIds.map((id, index) => [id, index]));
    data.sort((a, b) => {
      const indexA = idMap.get(a.ticket_id) ?? 999999;
      const indexB = idMap.get(b.ticket_id) ?? 999999;
      return indexA - indexB;
    });
  }

  return { success: true, data: data || [] };
}
