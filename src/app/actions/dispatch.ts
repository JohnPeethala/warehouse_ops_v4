"use server";

import { createClient } from "@/lib/supabase/server";
import { ActionResponse } from "@/lib/types";

export async function pushToDispatchLog(date: string): Promise<ActionResponse> {
  const supabase = await createClient();

  // 1. Fetch tickets from active manifest (ops_staged_tickets) that have an 's' or 'schedule' annotation
  const { data: tickets, error: fetchError } = await supabase
    .from('ops_staged_tickets')
    .select(`
      ticket_id, 
      sub_category, 
      contact_name, 
      address1,
      ops_ticket_annotations!inner(
        priority_tag, 
        location, 
        pincode, 
        notes
      )
    `)
    .in('ops_ticket_annotations.priority_tag', ['s', 'schedule']);

  if (fetchError) {
    console.error("Error fetching success annotations:", fetchError);
    return { success: false, error: fetchError.message };
  }

  if (!tickets || tickets.length === 0) {
    return { success: true, message: "No active success tickets found to push.", count: 0 };
  }

  // 2. Combine the data into the ops_dispatch_log schema format
  const dispatchLogs = tickets.map((t: any) => {
    const ann = Array.isArray(t.ops_ticket_annotations) ? t.ops_ticket_annotations[0] : t.ops_ticket_annotations;
    
    return {
      ticket_id: t.ticket_id,
      scheduled_date: date,
      sub_category: t.sub_category || "",
      contact_name: ann?.contact_name || t.contact_name || "",
      location: ann?.location || t.city || "",
      address: t.address1 || "",
      pincode: ann?.pincode || "",
      notes: ann?.notes || "",
      gt_map: null,
      status: null, 
    };
  });

  // 4. Upsert into ops_dispatch_log
  const { error: upsertError } = await supabase
    .from('ops_dispatch_log')
    .upsert(dispatchLogs, {
      onConflict: 'ticket_id, scheduled_date'
    });

  if (upsertError) {
    console.error("Error upserting dispatch logs:", upsertError);
    return { success: false, error: upsertError.message };
  }

  return { success: true, count: dispatchLogs.length };
}

export async function getSchedulePushBreakdown(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  const supabase = await createClient();

  // 1. Fetch active tickets with 's' or 'schedule' tags
  const { data: tickets, error: fetchError } = await supabase
    .from('ops_staged_tickets')
    .select(`
      ticket_id, 
      sub_category,
      address1,
      ops_ticket_annotations!inner(
        priority_tag, 
        location
      )
    `)
    .in('ops_ticket_annotations.priority_tag', ['s', 'schedule']);

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  if (!tickets || tickets.length === 0) {
    return { success: true, data: [] };
  }

  // Group by sub_category
  const breakdownMap: Record<string, number> = {};
  
  tickets.forEach((t: any) => {
    const subCategory = t.sub_category || "Unknown";
    breakdownMap[subCategory] = (breakdownMap[subCategory] || 0) + 1;
  });

  try {
    const data = Object.entries(breakdownMap)
      .map(([subCategory, count]) => ({ subCategory, count }))
      .sort((a, b) => b.count - a.count);

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function getFutureScheduleBreakdown(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  const supabase = await createClient();

  const today = new Date();
  const tzOffset = today.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(today.getTime() - tzOffset)).toISOString().slice(0, -1);
  const todayStr = localISOTime.split('T')[0];

  const { data, error } = await supabase
    .from('ops_dispatch_log')
    .select('scheduled_date, sub_category')
    .gte('scheduled_date', todayStr);

  if (error) {
    return { success: false, error: error.message };
  }

  // Group by date and sub_category
  const futureMap: Record<string, any> = {};

  // Pre-fill next 7 days
  for (let i = 0; i <= 7; i++) {
    const d = new Date(today.getTime() + i * 86400000);
    const dateKey = (new Date(d.getTime() - tzOffset)).toISOString().split('T')[0];
    futureMap[dateKey] = { date: dateKey };
  }

  if (data) {
    data.forEach((row: any) => {
      const d = row.scheduled_date;
      const cat = row.sub_category || "Unknown";
      if (!futureMap[d]) futureMap[d] = { date: d };
      futureMap[d][cat] = (futureMap[d][cat] || 0) + 1;
    });
  }

  const result = Object.values(futureMap).sort((a, b) => (a.date > b.date ? 1 : -1)).slice(0, 7);

  return { success: true, data: result };
}

