"use server";

import { createClient } from "@/lib/supabase/server";

export async function createVehicle(vehicleNo: string, defaultDriverName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("core_vehicles")
    .insert({
      vehicle_no: vehicleNo.trim().toUpperCase(),
      driver_name: defaultDriverName.trim() || null,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating vehicle:", error);
    return { success: false, error: error.message };
  }

  return { success: true, vehicle: data };
}

export async function createProfile(name: string, role: 'driver' | 'ground' | 'supervisor') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("core_profiles")
    .insert({
      name: name.trim(),
      role: role,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating profile:", error);
    return { success: false, error: error.message };
  }

  return { success: true, profile: data };
}
