"use client";

import React, { useState } from "react";
import { Copy, Download, Loader2, Calendar, FileBarChart2 } from "lucide-react";
import { fetchBulkScheduleData } from "@/app/actions/schedule";
import { fetchRouteSessionsData } from "@/app/actions/reports";
import { toast } from "sonner";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import * as XLSX from "xlsx";

import { Database } from "@/lib/supabase/database.types";

type Props = {
  initialData: {
    profiles: Database['public']['Tables']['core_profiles']['Row'][];
    vehicles: Database['public']['Tables']['core_vehicles']['Row'][];
  };
};

export function ReportsManager({ initialData }: Props) {
  const { profiles, vehicles } = initialData;
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [reportType, setReportType] = useState<"schedule" | "route_sessions">("schedule");
  const [loading, setLoading] = useState(false);

  const getReportData = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select a valid date range");
      return null;
    }

    let queryStart = startDate;
    let queryEnd = endDate;
    if (startDate > endDate) {
      queryStart = endDate;
      queryEnd = startDate;
    }

    setLoading(true);
    let finalRows: (string | number | boolean | null)[][] = [];
    let headers: string[] = [];

    try {
      if (reportType === "schedule") {
        const res = await fetchBulkScheduleData(queryStart, queryEnd);
        if (!res.success || !res.data) throw new Error(res.error || "Failed to fetch data");

        const tickets = res.data;
        if (tickets.length === 0) {
          toast.error("No tickets found in the selected date range");
          setLoading(false);
          return null;
        }

        headers = [
          "Date", "Route", "Driver", "Vehicle No", "GT 1", "GT 2", "Status", "Sub Status",
          "GT Map Link", "Ops", "Ticket ID", "Name", "Location", "Pincode",
          "Notes", "Remarks", "Address", "Start KM", "End KM", "Total KM", "Trip ID (UUID)"
        ];

        finalRows = tickets.map((t: Record<string, unknown>) => {
          let driverName = "";
          let vehicleNo = "";
          let gt1Name = "";
          let gt2Name = "";
          let startKm: number | string = "";
          let endKm: number | string = "";
          let totalKm: number | string = "";
          let tripId = "";

          if (t.ops_route_sessions) {
            const s = t.ops_route_sessions as any;
            tripId = s.id || "";
            startKm = s.starting_km ?? "";
            endKm = s.ending_km ?? "";
            totalKm = s.total_km ?? "";
            
            const v = vehicles.find(x => x.id === s.vehicle_id);
            if (v) {
              driverName = v.driver_name || "";
              vehicleNo = v.vehicle_no || "";
            }
            
            gt1Name = profiles.find(x => x.id === s.gt1_id)?.name || s.adhoc_gt1 || "";
            gt2Name = profiles.find(x => x.id === s.gt2_id)?.name || s.adhoc_gt2 || "";
          }

          const dateStr = t.scheduled_date ? format(new Date(t.scheduled_date as string), "dd-MMM-yyyy") : "";
          
          return [
            dateStr, t.route || "-", driverName, vehicleNo, gt1Name, gt2Name,
            t.status || "Pending", t.sub_status || "", t.gt_map || "", t.sub_category || "Uncategorized",
            t.ticket_id || "", t.contact_name || "", t.location || "", t.pincode || "",
            (t.notes as string || "").replace(/\n/g, " "), (t.remarks as string || "").replace(/\n/g, " "),
            (t.address as string || "").replace(/\n/g, " "), startKm, endKm, totalKm, tripId
          ];
        });

      } else {
        const res = await fetchRouteSessionsData(queryStart, queryEnd);
        if (!res.success || !res.data) throw new Error(res.error || "Failed to fetch data");

        const sessions = res.data;
        if (sessions.length === 0) {
          toast.error("No route sessions found in the selected date range");
          setLoading(false);
          return null;
        }

        headers = [
          "Date", "Route Name", "Vehicle No", "Driver", "GT 1", "GT 2",
          "Starting KM", "Ending KM", "Total KM", "Total Tickets",
          "Done Tickets", "Not Done Tickets", "Pending Tickets", "Trip ID (UUID)"
        ];

        finalRows = sessions.map((s: Record<string, unknown>) => {
          let driverName = "";
          let vehicleNo = "";
          let gt1Name = "";
          let gt2Name = "";

          const v = vehicles.find(x => x.id === s.vehicle_id);
          if (v) {
            driverName = v.driver_name || "";
            vehicleNo = v.vehicle_no || "";
          }
          gt1Name = profiles.find(x => x.id === s.gt1_id)?.name || s.adhoc_gt1 || "";
          gt2Name = profiles.find(x => x.id === s.gt2_id)?.name || s.adhoc_gt2 || "";

          const dateStr = s.trip_date ? format(new Date(s.trip_date), "dd-MMM-yyyy") : "";

          return [
            dateStr, s.route_name || "-", vehicleNo, driverName, gt1Name, gt2Name,
            s.starting_km ?? "-", s.ending_km ?? "-", s.total_km ?? "-",
            s.total_tickets || 0, s.done_tickets || 0, s.not_done_tickets || 0, s.pending_tickets || 0,
            s.id || ""
          ];
        });
      }

      setLoading(false);
      return { headers, rows: finalRows, type: reportType };
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to fetch data");
      setLoading(false);
      return null;
    }
  };

  const handleCopy = async () => {
    const data = await getReportData();
    if (!data) return;

    const formattedRows = data.rows.map(row => 
      row.map(cell => {
        const cellStr = String(cell || "");
        if (cellStr.includes("\t") || cellStr.includes("\n") || cellStr.includes("\"")) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join("\t")
    );

    const tsvContent = formattedRows.join("\n");
    await navigator.clipboard.writeText(tsvContent);
    toast.success(`Copied report data to clipboard!`);
  };

  const handleDownload = async () => {
    const data = await getReportData();
    if (!data) return;

    const worksheet = XLSX.utils.aoa_to_sheet([data.headers, ...data.rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    
    const fileName = `${data.type === "schedule" ? "Schedule_Report" : "Route_Sessions_Report"}_${startDate}_to_${endDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast.success(`Downloaded ${fileName}`);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-border bg-muted/30">
        <h2 className="text-lg font-bold text-foreground">Reports Download</h2>
        <p className="text-sm text-foreground/50 mt-1">
          Export ticket schedules or route session overviews.
        </p>
      </div>

      <div className="p-6 flex flex-col gap-8 max-w-2xl">
        
        {/* Report Type Selection */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-foreground">Select Report Type</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setReportType("schedule")}
              className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                reportType === "schedule" 
                ? "border-primary bg-primary/5 shadow-sm" 
                : "border-border hover:border-primary/30 hover:bg-muted/50"
              }`}
            >
              <FileBarChart2 className={`w-5 h-5 shrink-0 ${reportType === "schedule" ? "text-primary" : "text-muted-foreground"}`} />
              <div>
                <p className={`font-semibold text-sm ${reportType === "schedule" ? "text-primary" : "text-foreground"}`}>Schedule / Dispatch Log</p>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">Detailed ticket-level report with dispatch status and customer info.</p>
              </div>
            </button>

            <button
              onClick={() => setReportType("route_sessions")}
              className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                reportType === "route_sessions" 
                ? "border-primary bg-primary/5 shadow-sm" 
                : "border-border hover:border-primary/30 hover:bg-muted/50"
              }`}
            >
              <Calendar className={`w-5 h-5 shrink-0 ${reportType === "route_sessions" ? "text-primary" : "text-muted-foreground"}`} />
              <div>
                <p className={`font-semibold text-sm ${reportType === "route_sessions" ? "text-primary" : "text-foreground"}`}>Route Session / Trip Overview</p>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">High-level trip details including assigned teams and KM readings.</p>
              </div>
            </button>
          </div>
        </div>

        {/* Date Selection */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-foreground">Select Date Range</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">Start Date</label>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                showTicketCounts={false}
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">End Date</label>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                showTicketCounts={false}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 flex flex-wrap gap-3">
          <button
            onClick={handleDownload}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download .xlsx
          </button>
          
          <button
            onClick={handleCopy}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 border border-border bg-background text-foreground rounded-lg text-sm font-semibold hover:bg-muted transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
            Copy to Clipboard
          </button>
        </div>

      </div>
    </div>
  );
}
