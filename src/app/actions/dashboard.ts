"use server";

import { createClient } from "@/lib/supabase/server";

const toLocalDateStr = (d: Date) => d.toISOString().split("T")[0];

export type DashboardFunnel = {
  totalTickets: number;
  scheduledToday: number;
  pending: number;
  backdatedActive: number;
};

export type SubCategorySplit = {
  name: string;
  value: number;
  color: string;
}[];

export type DashboardData = {
  funnel: DashboardFunnel;
  subCategorySplit: SubCategorySplit;
  futureSchedule: any[];
  stagedTickets: any[];
  dailyCrewSummary: any[];
  historicalCompletion: any[];
};

export async function getDashboardData(timezoneOffsetMin = -330): Promise<DashboardData> {
  try {
    const supabase = await createClient();

    // Timezone logic to get 'today'
    const nowUtc = new Date();
    const localNow = new Date(nowUtc.getTime() - timezoneOffsetMin * 60000);
    const todayStr = localNow.toISOString().split("T")[0]; // YYYY-MM-DD
    const tomorrow = new Date(localNow.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = toLocalDateStr(tomorrow);

    // 1. Total Tickets Count
    const { count: totalTicketsCount, error: stagedCountErr } = await supabase
      .from("ops_staged_tickets")
      .select("*", { count: 'exact', head: true });
    
    if (stagedCountErr) throw stagedCountErr;
    const totalTickets = totalTicketsCount || 0;

    // 1b. Total Tickets Data (for Sub-category split and table)
    const { data: stagedTickets, error: stagedDataErr } = await supabase
      .from("ops_staged_tickets")
      .select("ticket_id, date, category, sub_category, contact_name, address1, ticket_age");

    if (stagedDataErr) throw stagedDataErr;

    // 2. Scheduled Today (ops_dispatch_log)
    const { count: scheduledCount, error: dispatchErr } = await supabase
      .from("ops_dispatch_log")
      .select("*", { count: 'exact', head: true })
      .eq('scheduled_date', todayStr);
      
    if (dispatchErr) throw dispatchErr;
    const scheduledToday = scheduledCount || 0;

    // 3. Pending (Total - Scheduled Today)
    const pending = Math.max(0, totalTickets - scheduledToday);

    // 4. Backdated Active Tickets
    const yesterday = new Date(localNow.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = toLocalDateStr(yesterday);

    const { count: backdatedCount, error: backdatedErr } = await supabase
      .from("ops_staged_tickets")
      .select("*", { count: 'exact', head: true })
      .lte("date", yesterdayStr);
      
    if (backdatedErr) throw backdatedErr;
    const backdatedActive = backdatedCount || 0;

    // 5. Sub-category Split
    const catCounts: Record<string, number> = {};
    if (stagedTickets && stagedTickets.length > 0) {
      stagedTickets.forEach(m => {
        const cat = m.sub_category || "Other";
        catCounts[cat] = (catCounts[cat] || 0) + 1;
      });
    }

    const subCategorySplit = Object.entries(catCounts)
      .map(([name, value]) => {
        let color = "#71717a"; // muted-foreground default
        const n = name.toLowerCase();
        if (n.includes("delivery")) color = "#3b82f6"; // blue-500
        else if (n.includes("partial pickup")) color = "#a855f7"; // purple-500
        else if (n.includes("defaulter pickup")) color = "#ef4444"; // red-500
        else if (n.includes("pickup")) color = "#9333ea"; // purple-600
        else if (n.includes("relocation")) color = "#14b8a6"; // teal-500
        else if (n.includes("upgrade")) color = "#16a34a"; // green-600
        else if (n.includes("replacement")) color = "#f97316"; // orange-500
        else if (n.includes("repair")) color = "#ca8a04"; // yellow-600
        else if (n.includes("installation")) color = "#6366f1"; // indigo-500
        return { name, value, color };
      })
      .sort((a, b) => b.value - a.value);

    // 6. Future Schedule Forecast (14 days, starting tomorrow)
    const futureSchedule: any[] = [];
    
    for (let i = 1; i <= 14; i++) {
      const d = new Date(localNow);
      d.setDate(d.getDate() + i);
      const ds = toLocalDateStr(d);
      
      const dayData: any = { date: ds, total: 0 };
      subCategorySplit.forEach(cat => {
        dayData[cat.name] = 0;
      });
      futureSchedule.push(dayData);
    }

    if (stagedTickets && stagedTickets.length > 0) {
      stagedTickets.forEach(t => {
        const d = t.date;
        const target = futureSchedule.find(f => f.date === d);
        if (target) {
          const cat = t.sub_category || "Other";
          if (target[cat] !== undefined) {
            target[cat]++;
          } else {
            target[cat] = 1;
          }
          target.total++;
        }
      });
    }

    // 7. Dynamic Daily Crew Summary & Historical Completion (Last 30 days, up to yesterday)
    const thirtyDaysAgo = new Date(localNow);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = toLocalDateStr(thirtyDaysAgo);

    const { data: routeSessions, error: routeSessionsErr } = await supabase
      .from("ops_route_sessions")
      .select(`
        *,
        core_vehicles!ops_route_sessions_vehicle_id_fkey ( vehicle_no, driver_name ),
        gt1:core_profiles!ops_route_sessions_gt1_id_fkey ( name ),
        gt2:core_profiles!ops_route_sessions_gt2_id_fkey ( name )
      `)
      .gte("trip_date", thirtyDaysAgoStr)
      .lte("trip_date", yesterdayStr)
      .order("trip_date", { ascending: false });

    if (routeSessionsErr) {
      console.error("Failed to fetch ops_route_sessions:", routeSessionsErr);
    }

    const histMap: Record<string, any> = {};
    for (let i = 30; i >= 1; i--) {
      const d = new Date(localNow);
      d.setDate(d.getDate() - i);
      const ds = toLocalDateStr(d);
      histMap[ds] = { success: 0, pending: 0, notDone: 0, total: 0, vehicles: new Set() };
    }

    const groupedSessions: Record<string, any[]> = {};
    if (routeSessions) {
      routeSessions.forEach((s: any) => {
        const d = s.trip_date;

        // Populate historical map
        if (histMap[d]) {
          histMap[d].success += s.done_tickets || 0;
          histMap[d].pending += s.pending_tickets || 0;
          histMap[d].notDone += s.not_done_tickets || 0;
          histMap[d].total += s.total_tickets || 0;
          if (s.vehicle_id) histMap[d].vehicles.add(s.vehicle_id);
        }

        // Group sessions for Daily Crew
        if (!groupedSessions[d]) {
          groupedSessions[d] = [];
        }
        groupedSessions[d].push({
          vehicle: s.core_vehicles?.vehicle_no || "-",
          driver: s.core_vehicles?.driver_name || "-",
          gt1: s.gt1?.name || s.adhoc_gt1 || "-",
          gt2: s.gt2?.name || s.adhoc_gt2 || "",
          total: s.total_tickets || 0,
          done: s.done_tickets || 0,
          pending: s.pending_tickets || 0,
          notDone: s.not_done_tickets || 0,
          km: s.total_km || 0
        });
      });
    }

    const historicalCompletion = Object.entries(histMap).map(([date, stats]) => {
      const uniqueVehicles = stats.vehicles.size;
      const dateObj = new Date(date);
      const formattedDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

      return {
        date: formattedDate,
        success: stats.success,
        pending: stats.pending,
        notDone: stats.notDone,
        total: stats.total,
        vehicles: uniqueVehicles,
        tasksPerVehicle: uniqueVehicles > 0 ? Number((stats.success / uniqueVehicles).toFixed(1)) : 0
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const sevenDaysAgo = new Date(localNow);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = toLocalDateStr(sevenDaysAgo);

    const dailyCrewSummary = Object.entries(groupedSessions)
      .filter(([date]) => date >= sevenDaysAgoStr && date <= yesterdayStr)
      .map(([date, crews]) => {
        const parsed = new Date(date);
        const dateLabel = parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        
        let relativeLabel = null;
        if (date === yesterdayStr) relativeLabel = "Yesterday";

        return { date, dateLabel, relativeLabel, crews };
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    return {
      funnel: {
        totalTickets,
        scheduledToday,
        pending,
        backdatedActive
      },
      subCategorySplit,
      futureSchedule,
      stagedTickets: stagedTickets || [],
      dailyCrewSummary,
      historicalCompletion
    };
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return {
      funnel: {
        totalTickets: 0,
        scheduledToday: 0,
        pending: 0,
        backdatedActive: 0
      },
      subCategorySplit: [],
      futureSchedule: [],
      stagedTickets: [],
      dailyCrewSummary: [],
      historicalCompletion: []
    };
  }
}
