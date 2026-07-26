"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// -----------------------------
// USER (TEAM) CRUD
// -----------------------------

export async function addProfile(name: string, phone: string, role: string, is_active: boolean = true) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('core_profiles')
    .insert([{ name, phone, role, is_active }]);

  if (error) {
    console.error("Error adding profile:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/settings');
  return { success: true };
}

export async function updateProfile(id: string, updates: any) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('core_profiles')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/settings');
  return { success: true };
}

export async function deleteProfile(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('core_profiles')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error("Error deleting profile:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/settings');
  return { success: true };
}

// -----------------------------
// VEHICLE CRUD
// -----------------------------

export async function addVehicle(vehicle_no: string, driver_name: string, driver_phone: string | null = null, is_active: boolean = true) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('core_vehicles')
    .insert([{ vehicle_no, driver_name, driver_phone, is_active }]);

  if (error) {
    console.error("Error adding vehicle:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/settings');
  return { success: true };
}

export async function updateVehicle(id: string, updates: any) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('core_vehicles')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error("Error updating vehicle:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/settings');
  return { success: true };
}

export async function deleteVehicle(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('core_vehicles')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error("Error deleting vehicle:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/settings');
  return { success: true };
}

// -----------------------------
// LOOKUP STATUS CRUD
// -----------------------------

export async function addLookup(
  domain: string,
  status: string,
  sub_status: string | null = null,
  status_color: string = "zinc",
  sub_status_color: string = "zinc",
  is_terminal: boolean = false,
  order_idx: number = 0,
  is_active: boolean = true
) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('cfg_lookups')
    .insert([{ domain, status, sub_status, status_color, sub_status_color, is_terminal, order_idx, is_active }]);

  if (error) {
    console.error("Error adding lookup:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/settings');
  return { success: true };
}

export async function updateLookup(id: string, updates: any) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('cfg_lookups')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error("Error updating lookup:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/settings');
  return { success: true };
}

export async function deleteLookup(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('cfg_lookups')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error("Error deleting lookup:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/settings');
  return { success: true };
}

export async function updateLookupsOrder(items: { id: string; order_idx: number }[]) {
  const supabase = await createClient();
  
  for (const item of items) {
    await supabase.from("cfg_lookups").update({ order_idx: item.order_idx }).eq("id", item.id);
  }
  
  revalidatePath('/settings');
  return { success: true };
}
