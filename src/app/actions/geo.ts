"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getGeoZones() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('cfg_geo_zones').select('*').order('area', { ascending: true });
  
  if (error) {
    console.error("Failed to fetch geo zones:", error);
    return [];
  }
  
  return data || [];
}

export async function saveGeoZone(area: string, pincode: string, lat: number, lng: number) {
  const supabase = await createClient();
  
  // Try to find if area OR exact coordinates exist
  const { data: existingArea } = await supabase
    .from('cfg_geo_zones')
    .select('id, area, pincode')
    .ilike('area', area)
    .limit(1)
    .maybeSingle();
    
  if (existingArea) {
    return { 
      success: true, 
      data: existingArea, 
      warning: `Location name "${existingArea.area}" already exists. Using existing location.` 
    };
  }

  const { data: existingCoord } = await supabase
    .from('cfg_geo_zones')
    .select('id, area, pincode')
    .eq('lat', lat)
    .eq('lng', lng)
    .limit(1)
    .maybeSingle();

  if (existingCoord) {
    return { 
      success: true, 
      data: existingCoord, 
      warning: `These coordinates already exist under "${existingCoord.area}". Using existing location.` 
    };
  }

  const { data, error } = await supabase
    .from('cfg_geo_zones')
    .insert({ area, pincode, lat, lng })
    .select()
    .single();

  if (error) {
    console.error("Failed to save geo zone:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function deleteGeoZone(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('cfg_geo_zones').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/settings');
  return { success: true };
}

export async function addGeoZone(area: string, pincode: string, lat: number, lng: number) {
  const supabase = await createClient();
  
  // Check unique constraints first
  const { data: existingArea } = await supabase
    .from('cfg_geo_zones')
    .select('id, area, pincode')
    .ilike('area', area)
    .limit(1)
    .maybeSingle();
    
  if (existingArea) {
    return { success: false, error: `Area "${area}" already exists.` };
  }

  const { data: existingCoord } = await supabase
    .from('cfg_geo_zones')
    .select('id, area, pincode')
    .eq('lat', lat)
    .eq('lng', lng)
    .limit(1)
    .maybeSingle();

  if (existingCoord) {
    return { success: false, error: `These exact coordinates already exist under the area "${existingCoord.area}".` };
  }

  const { data, error } = await supabase
    .from('cfg_geo_zones')
    .insert({ area, pincode, lat, lng })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/settings');
  return { success: true, data };
}

export async function updateGeoZone(id: string, updates: Partial<{ lat: number, lng: number }>) {
  const supabase = await createClient();
  const { error } = await supabase.from('cfg_geo_zones').update(updates).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/settings');
  return { success: true };
}

export async function updateTicketLocation(ticketId: string, stagedTicketId: string | undefined | null, location: string, pincode: string) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  const userId = user.user?.id;

  const payload: any = {
    ticket_id: ticketId,
    location,
    pincode,
    updated_by: userId,
    updated_at: new Date().toISOString()
  };

  // If a valid UUID is provided, use it
  if (stagedTicketId && stagedTicketId.length === 36) {
    // Just a quick check to see if it's likely a real UUID
    // However, if called from schedule, stagedTicketId might be a dispatch log ID. 
    // It's safer to just lookup the real staged_ticket_id by ticket_id!
  }

  // Lookup the actual staged_ticket_id just to be safe and ensure referential integrity
  const { data: stagedTicket } = await supabase
    .from("ops_staged_tickets")
    .select("id")
    .eq("ticket_id", ticketId)
    .order("date", { ascending: false })
    .limit(1)
    .single();

  if (stagedTicket) {
    payload.staged_ticket_id = stagedTicket.id;
  }

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
    console.error(`Failed to update location for ticket ${ticketId}:`, error);
    return { success: false, error: error.message };
  }

  revalidatePath('/active-tickets');
  revalidatePath('/schedule');
  revalidatePath('/custom-batch');

  return { success: true };
}
