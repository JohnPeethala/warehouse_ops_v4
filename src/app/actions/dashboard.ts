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
};

export async function getDashboardData(timezoneOffsetMin = -330): Promise<DashboardData> {
  try {
    const supabase = await createClient();

    // Timezone logic to get 'today'
    const nowUtc = new Date();
    const localNow = new Date(nowUtc.getTime() - timezoneOffsetMin * 60000);
    const todayStr = localNow.toISOString().split("T")[0]; // YYYY-MM-DD

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

    // 4. Backdated Active Tickets (ops_staged_tickets where date <= yesterdayStr)
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

    // 7. Dummy Daily Crew Summary
    const dailyCrewSummary = [
      {
        date: "2026-07-20",
        dateLabel: "Today",
        crews: [
          { vehicle: "Van 1", driver: "Alice", gt1: "GT-A", gt2: "", total: 15, done: 10, pending: 5, notDone: 0, km: 45 },
          { vehicle: "Truck A", driver: "Bob", gt1: "GT-B", gt2: "GT-C", total: 20, done: 15, pending: 3, notDone: 2, km: 120 }
        ]
      },
      {
        date: "2026-07-19",
        dateLabel: "Yesterday",
        crews: [
          { vehicle: "Van 1", driver: "Alice", gt1: "GT-A", gt2: "", total: 18, done: 18, pending: 0, notDone: 0, km: 50 },
          { vehicle: "Truck A", driver: "Bob", gt1: "GT-B", gt2: "GT-C", total: 22, done: 20, pending: 0, notDone: 2, km: 110 },
          { vehicle: "Van 2", driver: "Charlie", gt1: "GT-D", gt2: "", total: 10, done: 9, pending: 0, notDone: 1, km: 30 }
        ]
      }
    ];

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
      dailyCrewSummary
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
      dailyCrewSummary: []
    };
  }
}
