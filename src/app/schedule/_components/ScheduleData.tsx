import { createClient } from "@/lib/supabase/server";
import { ScheduleView } from "./ScheduleView";

export async function ScheduleData({ date }: { date?: string }) {
  // Use provided date or default to today's local date (YYYY-MM-DD)
  const targetDate = date || new Date().toLocaleDateString('en-CA'); // 'en-CA' outputs YYYY-MM-DD

  const supabase = await createClient();

  const [
    { data: logs },
    { data: geoZones },
    { data: profiles },
    { data: vehicles },
    { data: lookups }
  ] = await Promise.all([
    supabase
      .from("ops_dispatch_log")
      .select(`
        *,
        ops_route_sessions (
          id,
          vehicle_id,
          gt1_id,
          gt2_id,
          adhoc_gt1,
          adhoc_gt2, adhoc_vehicle,
          trip_date,
          starting_km,
          ending_km,
          total_km,
          total_tickets,
          done_tickets,
          not_done_tickets,
          pending_tickets
        )
      `)
      .eq("scheduled_date", targetDate)
      .order("scheduled_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("cfg_geo_zones").select("*"),
    supabase.from("core_profiles").select("id, name, role, created_at").eq("is_active", true).order("name"),
    supabase.from("core_vehicles").select("id, vehicle_no, driver_name").eq("is_active", true).order("vehicle_no"),
    supabase.from("cfg_lookups").select("*").eq("is_active", true)
  ]);

  return (
    <ScheduleView 
      logs={logs || []} 
      geoZones={geoZones || []}
      profiles={profiles || []}
      vehicles={vehicles || []}
      lookups={lookups || []}
    />
  );
}
