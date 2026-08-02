"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateDispatchLogField(id: string, field: string, value: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  if (field === "route") {
    const { data: currentLog } = await supabase
      .from("ops_dispatch_log")
      .select("gt_trip_id, scheduled_date")
      .eq("id", id)
      .single();

    const oldTripId = currentLog?.gt_trip_id;
    const scheduledDate = currentLog?.scheduled_date;
    let newTripId = null;

    if (value && value.trim() !== "" && scheduledDate) {
      const { data: existingSession } = await supabase
        .from("ops_dispatch_log")
        .select("gt_trip_id")
        .eq("route", value)
        .eq("scheduled_date", scheduledDate)
        .not("gt_trip_id", "is", null)
        .limit(1)
        .maybeSingle();
      if (existingSession && existingSession.gt_trip_id) {
        newTripId = existingSession.gt_trip_id;
      }
    }

    const { error } = await supabase
      .from("ops_dispatch_log")
      .update({ route: value, gt_trip_id: newTripId, updated_by: user.id })
      .eq("id", id);
    if (error) return { success: false, error: error.message };

    if (oldTripId && oldTripId !== newTripId) {
      const { count } = await supabase
        .from("ops_dispatch_log")
        .select("*", { count: 'exact', head: true })
        .eq("gt_trip_id", oldTripId);
      if (count === 0) {
        await supabase.from("ops_route_sessions").delete().eq("id", oldTripId);
      }
    }
    return { success: true };
  }

  const { error } = await supabase
    .from("ops_dispatch_log")
    .update({ [field]: value, updated_by: user.id })
    .eq("id", id);

  if (error) {
    console.error(`Error updating dispatch log ${field}:`, error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateDispatchLogFields(id: string, updates: Record<string, any>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const payload = { ...updates, updated_by: user.id };
  // The database trigger will automatically resolve the parent status from sub_status
  delete payload.status;

  const { error } = await supabase
    .from("ops_dispatch_log")
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error(`Error updating dispatch log fields:`, error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteDispatchLog(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("ops_dispatch_log")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting dispatch log:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function appendNoteOrRemark(id: string, field: 'notes' | 'remarks', newText: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("core_profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  const userName = profile?.name || "Unknown";
  
  // Format date like '12 Jul 15:30'
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  
  const timestampString = `\n[${userName} - ${dateStr} ${timeStr}] ${newText}`;

  // Fetch current value
  const { data: log } = await supabase
    .from("ops_dispatch_log")
    .select(field)
    .eq("id", id)
    .single();

  const currentVal = log?.[field] || "";
  const finalVal = currentVal ? `${currentVal}${timestampString}` : timestampString.trim();

  const { error } = await supabase
    .from("ops_dispatch_log")
    .update({ [field]: finalVal, updated_by: user.id })
    .eq("id", id);

  if (error) {
    console.error(`Error appending to ${field}:`, error);
    return { success: false, error: error.message };
  }

  return { success: true, finalVal };
}

export async function updateRouteSession(
  route: string, 
  date: string, 
  updates: Record<string, any>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // 1. Find tickets for this route and date
  const { data: tickets, error: fetchError } = await supabase
    .from("ops_dispatch_log")
    .select("id, gt_trip_id")
    .eq("route", route)
    .eq("scheduled_date", date);

  if (fetchError || !tickets || tickets.length === 0) {
    return { success: false, error: "No tickets found for this route" };
  }

  // 2. Find if any ticket already has a gt_trip_id
  const existingTripId = tickets.find(t => t.gt_trip_id)?.gt_trip_id;

  if (existingTripId) {
    // Update existing session
    const { error: updateError } = await supabase
      .from("ops_route_sessions")
      .update({ ...updates, updated_by: user.id })
      .eq("id", existingTripId);

    if (updateError) return { success: false, error: updateError.message };
    
    // Ensure all tickets in this route are linked to this trip
    const unlinkedTickets = tickets.filter(t => t.gt_trip_id !== existingTripId);
    if (unlinkedTickets.length > 0) {
      await supabase
        .from("ops_dispatch_log")
        .update({ gt_trip_id: existingTripId })
        .in("id", unlinkedTickets.map(t => t.id));
    }
  } else {
    // Create new session
    const { data: newSession, error: createError } = await supabase
      .from("ops_route_sessions")
      .insert({ 
        trip_date: date,
        ...updates,
        updated_by: user.id
      })
      .select("id")
      .single();

    if (createError) return { success: false, error: createError.message };

    // Update all tickets in this route to point to new session
    const { error: linkError } = await supabase
      .from("ops_dispatch_log")
      .update({ gt_trip_id: newSession.id })
      .in("id", tickets.map(t => t.id));

    if (linkError) return { success: false, error: linkError.message };
  }

  return { success: true };
}

export async function bulkUpdateDispatchLogFields(ids: string[], updates: Record<string, any>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  if (updates.route !== undefined) {
    // If route is updated, delegate to individual update function to handle gt_trip_id and session cleanup
    for (const id of ids) {
      const res = await updateDispatchLogField(id, "route", updates.route);
      if (!res.success) return res;
    }
    // Remove route from updates so we don't overwrite the gt_trip_id logic
    const { route, ...restUpdates } = updates;
    if (Object.keys(restUpdates).length > 0) {
      const { error } = await supabase.from("ops_dispatch_log").update({ ...restUpdates, updated_by: user.id }).in("id", ids);
      if (error) return { success: false, error: error.message };
    }
    return { success: true };
  }

  const payload = { ...updates, updated_by: user.id };
  // The database trigger will automatically resolve the parent status from sub_status
  delete payload.status;

  const { error } = await supabase
    .from("ops_dispatch_log")
    .update(payload)
    .in("id", ids);

  if (error) {
    console.error("Error in bulk update dispatch logs:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function fetchTicketByIdForSchedule(ticketId: string, date?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // 1. Fetch from public.ops_staged_tickets
  const { data: ticketsData, error: fetchError } = await supabase
    .from("ops_staged_tickets")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("date", { ascending: false })
    .limit(1);
    
  const ticket = ticketsData && ticketsData.length > 0 ? ticketsData[0] : null;

  if (fetchError || !ticket) {
    if (fetchError?.code === "PGRST116" || !ticket) {
      return { success: false, error: "Ticket not found" };
    }
    return { success: false, error: fetchError.message };
  }

  // 2. Check if already in the target date's ops_dispatch_log
  const today = new Date();
  const tzOffset = today.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(today.getTime() - tzOffset)).toISOString().slice(0, -1);
  const targetDateStr = date || localISOTime.split('T')[0];

  const { data: existingLog } = await supabase
    .from("ops_dispatch_log")
    .select("id")
    .eq("ticket_id", ticketId)
    .eq("scheduled_date", targetDateStr)
    .single();

  if (existingLog) {
    return { success: false, error: `Ticket is already scheduled for ${targetDateStr}` };
  }

  return { success: true, data: ticket };
}

export async function addTicketsToSchedule(ticketsData: any[], date?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const today = new Date();
  const tzOffset = today.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(today.getTime() - tzOffset)).toISOString().slice(0, -1);
  const targetDateStr = date || localISOTime.split('T')[0];

  const logsToInsert = [];
  
  for (const t of ticketsData) {
    if (t.isNew) {
      // Insert new ticket into ops_staged_tickets
      const { data: newStagedTicket } = await supabase.from("ops_staged_tickets").insert({
        ticket_id: t.ticket_id,
        date: targetDateStr,
        contact_name: t.contact_name,
        address1: t.address1,
        sub_category: t.sub_category,
        category: "Dispatch" // default category
      }).select().single();
      
      if (newStagedTicket) {
        t.id = newStagedTicket.id; // Assign the newly generated UUID
      }
    } else {
      // If there are overrides like contact_name, address1, update ops_staged_tickets
      const ticketUpdates: any = {};
      if (t.contact_name !== undefined) ticketUpdates.contact_name = t.contact_name;
      if (t.address1 !== undefined) ticketUpdates.address1 = t.address1;
      if (t.sub_category !== undefined) ticketUpdates.sub_category = t.sub_category;
      
      if (Object.keys(ticketUpdates).length > 0) {
        await supabase.from("ops_staged_tickets").update(ticketUpdates).eq("id", t.id);
      }
    }

    // Prepare dispatch log entry
    logsToInsert.push({
      ticket_id: t.ticket_id,
      scheduled_date: targetDateStr,
      route: null, // Default to null so it's blank in the UI
      status: "Pending", // Default
      sub_status: "Pending", // Default
      updated_by: user.id,
      address: t.address1 || t.address || "",
      sub_category: t.sub_category || "",
      contact_name: t.contact_name || "",
      pincode: t.pincode || "",
      notes: t.notes || "",
      remarks: t.remarks || "",
      location: t.location || "",
    });
  }

  const { data: insertedLogs, error } = await supabase
    .from("ops_dispatch_log")
    .insert(logsToInsert)
    .select(`
      *,
      ops_route_sessions (
        id, vehicle_id, gt1_id, gt2_id, trip_date, total_tickets, done_tickets, not_done_tickets, pending_tickets
      )
    `);

  if (error) {
    console.error("Error adding tickets to schedule:", error);
    if (error.code === '23505') {
      return { success: false, error: "One or more of these tickets are already scheduled for this date." };
    }
    return { success: false, error: error.message };
  }

  return { success: true, data: insertedLogs };
}

export async function fetchBulkScheduleData(startDate: string, endDate: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("ops_dispatch_log")
    .select(`
      *,
      ops_route_sessions (
        id, vehicle_id, gt1_id, gt2_id, trip_date, total_tickets, done_tickets, not_done_tickets, pending_tickets
      )
    `)
    .gte("scheduled_date", startDate)
    .lte("scheduled_date", endDate)
    .order("scheduled_date", { ascending: true })
    .order("route", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching bulk schedule data:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}
