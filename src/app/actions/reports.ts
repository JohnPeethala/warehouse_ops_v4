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
        adhoc_vehicle,
      gt1_id,
      gt2_id,
      total_km,
      starting_km,
      ending_km,
      total_tickets,
      done_tickets,
      not_done_tickets,
      nd_veh_drvr_tickets,
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
import { format } from "date-fns";

export async function exportFormattedRouteSessions(startDate: string, endDate: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: sessions, error } = await supabase
    .from("ops_route_sessions")
    .select(`
      id,
      trip_date,
      vehicle_id,
        adhoc_vehicle,
      gt1_id,
      gt2_id,
      total_km,
      starting_km,
      ending_km,
      total_tickets,
      done_tickets,
      not_done_tickets,
      nd_veh_drvr_tickets,
      pending_tickets,
      adhoc_gt1,
      adhoc_gt2,
      ops_dispatch_log(route)
    `)
    .gte("trip_date", startDate)
    .lte("trip_date", endDate)
    .order("trip_date", { ascending: true });

  if (error) return { success: false, error: error.message };

  const { data: profiles } = await supabase.from("core_profiles").select("id, name");
  const { data: vehicles } = await supabase.from("core_vehicles").select("id, vehicle_no, driver_name");
  
  const headers = [
    "Date", "Route Name", "Vehicle No", "Driver", "GT 1", "GT 2",
    "Starting KM", "Ending KM", "Total KM", "Total Tickets",
    "Done Tickets", "Not Done Tickets", "Veh/Drvr ND Tickets", "Pending Tickets", "Trip ID (UUID)"
  ];

  const rows = (sessions || []).map((s: any) => {
    let driverName = "";
    let vehicleNo = "";
    let gt1Name = "";
    let gt2Name = "";

    const v = (vehicles || []).find(x => x.id === s.vehicle_id);
    if (s.adhoc_vehicle) {
      const adhocStr = s.adhoc_vehicle as string;
      if (adhocStr.includes(" - ")) {
        const parts = adhocStr.split(" - ");
        driverName = parts[0].trim();
        vehicleNo = parts.slice(1).join(" - ").replace(" *", "").trim();
      } else {
        driverName = adhocStr;
        vehicleNo = "Temp Vehicle";
      }
    } else if (v) {
      driverName = v.driver_name || "";
      vehicleNo = v.vehicle_no || "";
    }

    gt1Name = (profiles || []).find(x => x.id === s.gt1_id)?.name || s.adhoc_gt1 || "";
    gt2Name = (profiles || []).find(x => x.id === s.gt2_id)?.name || s.adhoc_gt2 || "";

    const dateStr = s.trip_date ? format(new Date(s.trip_date), "dd-MMM-yyyy") : "";

    const logArr = s.ops_dispatch_log as any[];
    const routeName = (logArr && logArr.length > 0) ? logArr[0].route : "-";

    return [
      dateStr, routeName || "-", vehicleNo, driverName, gt1Name, gt2Name,
      s.starting_km ?? "-", s.ending_km ?? "-", s.total_km ?? "-",
      s.total_tickets || 0, s.done_tickets || 0, s.not_done_tickets || 0, s.nd_veh_drvr_tickets || 0, s.pending_tickets || 0,
      s.id || ""
    ];
  });

  return { success: true, data: { headers, rows } };
}
