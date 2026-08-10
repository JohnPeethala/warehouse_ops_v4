"use server";

import { createClient } from "@/lib/supabase/server";

export type DailyStats = {
  total: number;
  done: number;
  nd: number;
  km: number;
  hoverNames: string[]; // E.g., GT names who rode with the driver, or Driver name for GT
};

export type DriverMatrixRow = {
  driver: string;
  daysArrived: number;
  totalTickets: number;
  tasksDone: number;
  notDoneVehDrvr: number;
  totalKm: number;
  dailyData: Record<string, DailyStats>;
};

export async function getDriverMatrixData(
  monthStr: string, // YYYY-MM format
  timezoneOffsetMin = -330
): Promise<{ success: boolean; data?: DriverMatrixRow[]; error?: string }> {
  try {
    const supabase = await createClient();

    // Calculate dates
    const [year, month] = monthStr.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // last day of month

    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    // Determine the absolute start date needed to cover the month
    const queryStart = startStr;
    const queryEnd = endStr;

    // Fetch ops_route_sessions
    const { data: routeSessions, error: rsErr } = await supabase
      .from("ops_route_sessions")
      .select(`
        *,
        core_vehicles!ops_route_sessions_vehicle_id_fkey ( driver_name ),
        gt1:core_profiles!ops_route_sessions_gt1_id_fkey ( name ),
        gt2:core_profiles!ops_route_sessions_gt2_id_fkey ( name )
      `)
      .gte("trip_date", queryStart)
      .lte("trip_date", queryEnd);

    if (rsErr) throw rsErr;

    // Build the matrix
    const driversMap: Record<string, any> = {};

    // Helper to get driver name from session
    const getDriverName = (session: any) => {
      if (session.adhoc_vehicle) {
        if (session.adhoc_vehicle.includes(" - ")) {
          return session.adhoc_vehicle.split(" - ")[0].trim();
        }
        return session.adhoc_vehicle;
      }
      return session.core_vehicles?.driver_name || "Unassigned";
    };

    const rsMapById: Record<string, any> = {};
    (routeSessions || []).forEach(s => {
        rsMapById[s.id] = s;
    });

    const getGtName = (session: any, key: 'gt1' | 'gt2', adhocKey: 'adhoc_gt1' | 'adhoc_gt2') => {
      const dbName = session[key]?.name;
      if (dbName) return dbName;
      if (session[adhocKey]) return session[adhocKey];
      return null;
    };

    // Initialize driver objects
    const initDriver = (name: string) => {
      if (!driversMap[name]) {
        driversMap[name] = {
          driver: name,
          daysArrivedSet: new Set(),
          totalTickets: 0,
          tasksDone: 0,
          notDoneVehDrvr: 0,
          totalKm: 0,
          dailyDataMap: {} as Record<string, DailyStats>
        };
      }
      return driversMap[name];
    };

    // Process Route Sessions
    (routeSessions || []).forEach(s => {
      const driver = getDriverName(s);
      if (driver === "Unassigned") return;

      const dObj = initDriver(driver);

      // Is it in the selected month?
      if (s.trip_date >= startStr && s.trip_date <= endStr) {
        dObj.daysArrivedSet.add(s.trip_date);
        dObj.totalTickets += (s.total_tickets || 0);
        dObj.tasksDone += (s.done_tickets || 0);
        dObj.notDoneVehDrvr += (s.nd_veh_drvr_tickets || 0);
        dObj.totalKm += (s.total_km || 0);
        
        // Track daily breakdown for the month
        const total = s.total_tickets || 0;
        const done = s.done_tickets || 0;
        const nd = s.nd_veh_drvr_tickets || 0;
        const km = s.total_km || 0;
        
        const g1 = getGtName(s, 'gt1', 'adhoc_gt1');
        const g2 = getGtName(s, 'gt2', 'adhoc_gt2');
        
        if (!dObj.dailyDataMap[s.trip_date]) {
            dObj.dailyDataMap[s.trip_date] = { total: 0, done: 0, nd: 0, km: 0, hoverNames: [] };
        }
        
        dObj.dailyDataMap[s.trip_date].total += total;
        dObj.dailyDataMap[s.trip_date].done += done;
        dObj.dailyDataMap[s.trip_date].nd += nd;
        dObj.dailyDataMap[s.trip_date].km += km;
        
        if (g1 && !dObj.dailyDataMap[s.trip_date].hoverNames.includes(g1)) {
          dObj.dailyDataMap[s.trip_date].hoverNames.push(g1);
        }
        if (g2 && !dObj.dailyDataMap[s.trip_date].hoverNames.includes(g2)) {
          dObj.dailyDataMap[s.trip_date].hoverNames.push(g2);
        }
      }
    });

    // Format final array
    const result: DriverMatrixRow[] = Object.values(driversMap).map((d: any) => {
      const dailyData: Record<string, DailyStats> = {};
      
      // Generate keys for every day of the month
      const daysInMonth = endDate.getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const dDate = new Date(year, month - 1, i);
        // Correctly format local date safely to YYYY-MM-DD
        const y = dDate.getFullYear();
        const m = String(dDate.getMonth() + 1).padStart(2, "0");
        const day = String(dDate.getDate()).padStart(2, "0");
        const ds = `${y}-${m}-${day}`;
        
        const stats = d.dailyDataMap[ds];
        if (stats && (stats.total > 0 || stats.km > 0)) {
          dailyData[ds] = {
            total: stats.total,
            done: stats.done,
            nd: stats.nd,
            km: Number(stats.km.toFixed(1)),
            hoverNames: stats.hoverNames
          };
        } else {
          dailyData[ds] = { total: 0, done: 0, nd: 0, km: 0, hoverNames: [] };
        }
      }

      return {
        driver: d.driver,
        daysArrived: d.daysArrivedSet.size,
        totalTickets: d.totalTickets,
        tasksDone: d.tasksDone,
        notDoneVehDrvr: d.notDoneVehDrvr,
        totalKm: Number(d.totalKm.toFixed(1)),
        dailyData
      };
    });

    // Sort by tasks done descending
    result.sort((a, b) => b.tasksDone - a.tasksDone);

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error in getDriverMatrixData:", error);
    return { success: false, error: error.message };
  }
}

export type GtMatrixRow = {
  gtName: string;
  daysArrived: number;
  totalTickets: number;
  tasksDone: number;
  notDoneTotal: number;
  totalKm: number;
  dailyData: Record<string, DailyStats>;
};

export async function getGtMatrixData(
  selectedMonth: string // format "YYYY-MM"
) {
  try {
    const supabase = await createClient();
    
    // Parse selected month start and end dates
    const [year, month] = selectedMonth.split("-").map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // Timezone logic
    const timezoneOffsetMin = 330; // +05:30 IST
    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    const queryStart = startStr;
    const queryEnd = endStr;

    // Fetch ops_route_sessions with GT profiles
    const { data: routeSessions, error: rsErr } = await supabase
      .from("ops_route_sessions")
      .select(`
        *,
        core_vehicles!ops_route_sessions_vehicle_id_fkey ( driver_name ),
        gt1:core_profiles!ops_route_sessions_gt1_id_fkey ( name ),
        gt2:core_profiles!ops_route_sessions_gt2_id_fkey ( name )
      `)
      .gte("trip_date", queryStart)
      .lte("trip_date", queryEnd);

    if (rsErr) throw rsErr;

    const gtsMap: Record<string, any> = {};

    const getGt1Name = (session: any) => {
      if (session.gt1?.name) return session.gt1.name;
      if (session.adhoc_gt1) return session.adhoc_gt1;
      return null;
    };
    const getGt2Name = (session: any) => {
      if (session.gt2?.name) return session.gt2.name;
      if (session.adhoc_gt2) return session.adhoc_gt2;
      return null;
    };
    const getDriverName = (session: any) => {
      if (session.adhoc_vehicle) {
        if (session.adhoc_vehicle.includes(" - ")) {
          return session.adhoc_vehicle.split(" - ")[0].trim();
        }
        return session.adhoc_vehicle;
      }
      return session.core_vehicles?.driver_name || "Unassigned";
    };

    const initGt = (name: string) => {
      if (!gtsMap[name]) {
        gtsMap[name] = {
          gtName: name,
          daysArrivedSet: new Set(),
          totalTickets: 0,
          tasksDone: 0,
          notDoneTotal: 0,
          totalKm: 0,
          dailyDataMap: {} as Record<string, DailyStats>
        };
      }
      return gtsMap[name];
    };

    (routeSessions || []).forEach(s => {
      const g1 = getGt1Name(s);
      const g2 = getGt2Name(s);
      const driver = getDriverName(s);

      const processGt = (gName: string | null) => {
        if (!gName || gName === "Unassigned") return;
        
        const gObj = initGt(gName);

        // Is it in the selected month?
        if (s.trip_date >= startStr && s.trip_date <= endStr) {
          gObj.daysArrivedSet.add(s.trip_date);
          gObj.totalTickets += (s.total_tickets || 0);
          gObj.tasksDone += (s.done_tickets || 0);
          gObj.notDoneTotal += (s.not_done_tickets || 0);
          gObj.totalKm += (s.total_km || 0);
          
          const total = s.total_tickets || 0;
          const done = s.done_tickets || 0;
          const nd = s.not_done_tickets || 0; // GT gets total ND evaluated
          const km = s.total_km || 0;

          if (!gObj.dailyDataMap[s.trip_date]) {
              gObj.dailyDataMap[s.trip_date] = { total: 0, done: 0, nd: 0, km: 0, hoverNames: [] };
          }
          gObj.dailyDataMap[s.trip_date].total += total;
          gObj.dailyDataMap[s.trip_date].done += done;
          gObj.dailyDataMap[s.trip_date].nd += nd;
          gObj.dailyDataMap[s.trip_date].km += km;
          
          if (driver && driver !== "Unassigned" && !gObj.dailyDataMap[s.trip_date].hoverNames.includes(driver)) {
            gObj.dailyDataMap[s.trip_date].hoverNames.push(driver);
          }
        }
      };

      processGt(g1);
      processGt(g2);
    });

    // Format final array
    const result: GtMatrixRow[] = Object.values(gtsMap).map((d: any) => {
      const dailyData: Record<string, DailyStats> = {};
      
      const daysInMonth = endDate.getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const dDate = new Date(year, month - 1, i);
        const y = dDate.getFullYear();
        const m = String(dDate.getMonth() + 1).padStart(2, "0");
        const day = String(dDate.getDate()).padStart(2, "0");
        const ds = `${y}-${m}-${day}`;
        
        const stats = d.dailyDataMap[ds];
        if (stats && (stats.total > 0 || stats.km > 0)) {
          dailyData[ds] = {
            total: stats.total,
            done: stats.done,
            nd: stats.nd,
            km: Number(stats.km.toFixed(1)),
            hoverNames: stats.hoverNames
          };
        } else {
          dailyData[ds] = { total: 0, done: 0, nd: 0, km: 0, hoverNames: [] };
        }
      }

      return {
        gtName: d.gtName,
        daysArrived: d.daysArrivedSet.size,
        totalTickets: d.totalTickets,
        tasksDone: d.tasksDone,
        notDoneTotal: d.notDoneTotal,
        totalKm: Number(d.totalKm.toFixed(1)),
        dailyData
      };
    });

    // Sort by tasks done descending
    result.sort((a, b) => b.tasksDone - a.tasksDone);

    return { success: true, data: result };

  } catch (error: any) {
    console.error("Error in getGtMatrixData:", error);
    return { success: false, error: error.message };
  }
}
