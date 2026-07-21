"use server";

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getLiveTrackerData(targetDate?: string) {
  try {
    const cookieStore = await cookies();
    
    // 1. Try Authenticated Client first
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore cookie errors
            }
          },
        },
      }
    );

    const { data: { session } } = await authClient.auth.getSession();
    const isAuth = !!session;

    // Use admin client if not authenticated (for magic link guests)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const dbClient = !isAuth && supabaseServiceKey 
      ? createClient(supabaseUrl, supabaseServiceKey) 
      : authClient;

    const queryDate = targetDate || new Date().toLocaleDateString('en-CA');

    // Fetch ops_dispatch_log (tickets) for the date
    const { data: ticketsData, error: ticketsError } = await dbClient
      .from("ops_dispatch_log")
      .select(`
        id, 
        ticket_id, 
        scheduled_date, 
        status, 
        sub_status,
        sub_category,
        contact_name,
        location,
        gt_trip_id,
        ops_route_sessions (
          id,
          core_vehicles ( vehicle_no, driver_name ),
          driver_profile:core_profiles!gt1_id ( name ),
          gt2_profile:core_profiles!gt2_id ( name )
        )
      `)
      .eq("scheduled_date", queryDate);

    if (ticketsError) {
      console.error("Tickets Error:", ticketsError);
      throw ticketsError;
    }
    
    // Fetch cfg_lookups to map terminal statuses
    const { data: lookupsData, error: lookupsError } = await dbClient
      .from("cfg_lookups")
      .select("domain, status, sub_status, status_color, sub_status_color, is_terminal")
      .eq("domain", "TICKET")
      .eq("is_active", true);
      
    if (lookupsError) {
      console.error("Lookups Error:", lookupsError);
      throw lookupsError;
    }

    // Fetch cfg_ticket_categories to map icons and colors
    const { data: categoriesData, error: categoriesError } = await dbClient
      .from("cfg_ticket_categories")
      .select("name, icon_name, color")
      .eq("is_active", true);
      
    if (categoriesError) {
      console.error("Categories Error:", categoriesError);
      throw categoriesError;
    }

    return { 
      success: true, 
      tickets: ticketsData || [],
      lookups: lookupsData || [],
      categories: categoriesData || [],
      isAuth
    };
  } catch (error: any) {
    console.error("Live Tracker fetch error:", error);
    return { 
      success: false, 
      error: error.message || "Failed to fetch live tracker data",
      tickets: [],
      lookups: [],
      categories: [],
      isAuth: false
    };
  }
}
