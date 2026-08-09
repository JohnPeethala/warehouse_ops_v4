"use server";

import { createClient } from "@/lib/supabase/server";

export async function fetchRouteSessionsData(startDate: string, endDate: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("ops_route_sessions")
    .select(`
      id,
      trip_date,
      vehicle_id,
      gt1_id,
      gt2_id,
      total_km,
      starting_km,
      ending_km,
      total_tickets,
      done_tickets,
      not_done_tickets,
      pending_tickets,
      adhoc_gt1,
      adhoc_gt2,
      ops_dispatch_log(route)
    `)
    .gte("trip_date", startDate)
    .lte("trip_date", endDate)
    .order("trip_date", { ascending: true });

  if (error) {
    console.error("Error fetching route sessions data:", error);
    return { success: false, error: error.message };
  }
  
  if (data && data.length > 0) {
    const tripIds = data.map(d => d.id);
    const { data: logsData } = await supabase
      .from("ops_dispatch_log")
      .select("gt_trip_id, route")
      .in("gt_trip_id", tripIds);
      
    if (logsData) {
      const routeMap = new Map<string, string>();
      for (const log of logsData) {
        if (log.gt_trip_id && log.route) {
          routeMap.set(log.gt_trip_id, log.route);
        }
      }
      
      for (const session of data) {
        (session as any).route_name = routeMap.get(session.id) || "Unknown";
      }
    }
  }

  return { success: true, data };
}
