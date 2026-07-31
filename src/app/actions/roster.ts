"use server";

import { createClient } from "@/lib/supabase/server";

export async function getRosterData(startDate: string, endDate: string) {
  const supabase = await createClient();
  
  const { data: masterData, error: masterError } = await supabase
    .from("ops_gt_master")
    .select("*")
    .order("gt_name", { ascending: true });
    
  if (masterError) {
    console.error("Error fetching ops_gt_master:", masterError);
  }
    
  const { data: rosterData, error: rosterError } = await supabase
    .from("ops_gt_roster")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate);
    
  if (rosterError) {
    console.error("Error fetching ops_gt_roster:", rosterError);
  }
    
  return { master: masterData || [], roster: rosterData || [] };
}

export async function addGTMaster(name: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ops_gt_master")
    .insert({ gt_name: name, is_active: true })
    .select()
    .single();
    
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function toggleGTMasterActive(id: string, is_active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("ops_gt_master")
    .update({ is_active })
    .eq("id", id);
    
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateRosterEntry(date: string, gt_id: string, updates: any) {
  const supabase = await createClient();
  
  const { data: existing } = await supabase
    .from("ops_gt_roster")
    .select("id")
    .eq("date", date)
    .eq("gt_id", gt_id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("ops_gt_roster").update(updates).eq("id", existing.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("ops_gt_roster").insert({ date, gt_id, ...updates });
    if (error) return { success: false, error: error.message };
  }
  
  return { success: true };
}

export async function dispatchGT(date: string, gt_id: string) {
  const supabase = await createClient();
  
  const { data: existing } = await supabase
    .from("ops_gt_roster")
    .select("id, delivery_count")
    .eq("date", date)
    .eq("gt_id", gt_id)
    .maybeSingle();
    
  const currentCount = existing?.delivery_count || 0;
  const updates = {
    duty: 'Delivery',
    delivery_count: currentCount + 1,
    last_dispatched_at: new Date().toISOString()
  };

  if (existing) {
    const { error } = await supabase.from("ops_gt_roster").update(updates).eq("id", existing.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("ops_gt_roster").insert({ 
      date, 
      gt_id, 
      attendance: 'Present',
      ...updates 
    });
    if (error) return { success: false, error: error.message };
  }
  
  return { success: true };
}
