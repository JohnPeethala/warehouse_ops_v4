"use server"

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createVehicleAction(vehicleNo: string, driverName: string) {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('core_vehicles')
    .insert([
      { vehicle_no: vehicleNo, driver_name: driverName }
    ])
    .select()
    .single()

  if (error) {
    console.error("Failed to create vehicle:", error)
    return { success: false, error: error.message }
  }

  revalidatePath('/schedule')
  return { success: true, data }
}

export async function createGTAction(name: string, phone: string) {
  try {
    const supabase = createAdminClient()
    
    const formatName = (str: string) => {
      return str.trim().split(' ').filter(w => w.length > 0).map((word, index) => {
        if (index === 0 && word.toUpperCase() === 'GT') return 'GT';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }).join(' ');
    };
    
    let formattedName = formatName(name);
    const gtName = formattedName.startsWith('GT ') ? formattedName : `GT ${formattedName}`;

    const dummyEmail = `${phone.replace(/[^0-9]/g, '')}@warehouse.com`
    const password = "123456" // Supabase requires min 6 characters by default

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: dummyEmail,
      password: password,
      email_confirm: true, // Auto-confirm
      user_metadata: {
        name: gtName,
        phone: phone,
        role: 'ground' // Pass role explicitly for the Postgres trigger
      }
    })

    if (authError) {
      console.error("Failed to create GT auth user:", authError)
      const errMsg = authError?.message || String(authError);
      return { success: false, error: errMsg }
    }

    // The Postgres trigger 'on_auth_user_created' will automatically insert into core_profiles.
    // We don't need to manually insert into core_profiles here, otherwise we get a duplicate key violation.

    revalidatePath('/schedule')
    
    // Return a basic profile object so the UI can update immediately
    return { success: true, data: { id: authData.user.id, name: gtName, role: 'ground', phone: phone } }
  } catch (err: unknown) {
    console.error("Server Action Exception:", err);
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}
