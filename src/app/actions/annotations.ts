"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateAnnotation(ticketId: string, stagedTicketId: string, field: string, value: string) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  const userId = user.user?.id;

  const validFields = ["contact_name", "location", "pincode", "notes", "link", "priority_tag"];
  if (!validFields.includes(field)) {
    return { success: false, error: "Invalid field" };
  }

  // Upsert the annotation
  const payload: Record<string, unknown> = {
    ticket_id: ticketId,
    staged_ticket_id: stagedTicketId,
    updated_by: userId,
    updated_at: new Date().toISOString(),
    [field]: value
  };

  const { data: existing } = await supabase
    .from("ops_ticket_annotations")
    .select("ticket_id")
    .eq("ticket_id", ticketId)
    .single();

  let error;
  if (existing) {
    const { error: updateError } = await supabase
      .from("ops_ticket_annotations")
      .update(payload)
      .eq("ticket_id", ticketId);
    error = updateError;
  } else {
    const { error: insertError } = await supabase
      .from("ops_ticket_annotations")
      .insert([payload]);
    error = insertError;
  }

  if (error) {
    console.error(`Failed to update ${field} for ticket ${ticketId}:`, error);
    return { success: false, error: error.message };
  }

  revalidatePath('/active-tickets');

  return { success: true };
}

export async function saveTicketTag(ticketId: string, stagedTicketId: string, value: string) {
  return updateAnnotation(ticketId, stagedTicketId, "priority_tag", value);
}

export async function saveTicketLink(ticketId: string, stagedTicketId: string, value: string) {
  return updateAnnotation(ticketId, stagedTicketId, "link", value);
}

export async function bulkClearPriorityTags(ticketIds?: string[]) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  const userId = user.user?.id;

  let query = supabase
    .from("ops_ticket_annotations")
    .update({ 
      priority_tag: "", 
      updated_by: userId, 
      updated_at: new Date().toISOString() 
    });
    
  // If ticketIds are provided, only clear those. Otherwise clear all (where priority_tag is not empty).
  if (ticketIds && ticketIds.length > 0) {
    query = query.in("ticket_id", ticketIds);
  } else {
    query = query.neq("priority_tag", "");
  }

  const { error } = await query;

  if (error) {
    console.error(`Failed to bulk clear priority tags:`, error);
    return { success: false, error: error.message };
  }

  revalidatePath('/active-tickets');
  return { success: true };
}
