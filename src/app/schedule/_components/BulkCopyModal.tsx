"use client";

import React, { useState } from "react";
import { X, Copy, Loader2, Calendar } from "lucide-react";
import { fetchBulkScheduleData } from "@/app/actions/schedule";
import { toast } from "sonner";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import { useSubCategorySettings } from "@/components/providers/SubCategoryProvider";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  vehicles: any[];
  profiles: any[];
};

export function BulkCopyModal({ isOpen, onClose, vehicles, profiles }: Props) {
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const subCategories = useSubCategorySettings();

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select a valid date range");
      return;
    }

    let queryStart = startDate;
    let queryEnd = endDate;
    if (startDate > endDate) {
      queryStart = endDate;
      queryEnd = startDate;
    }

    setLoading(true);
    try {
      const res = await fetchBulkScheduleData(queryStart, queryEnd);
      if (!res.success || !res.data) {
        toast.error(res.error || "Failed to fetch data");
        return;
      }

      const tickets = res.data;
      if (tickets.length === 0) {
        toast.error("No tickets found in the selected date range");
        return;
      }

      // Generate TSV string
      const headers = [
        "Date",
        "Route",
        "Driver",
        "Vehicle No",
        "GT 1",
        "GT 2",
        "Status",
        "GT Map Link",
        "Ops",
        "Ticket ID",
        "Name",
        "Location",
        "Pincode",
        "Notes",
        "Remarks",
        "Address"
      ];

      const rows = tickets.map((t: any) => {
        // Resolve Driver/Vehicle and GTs from route_sessions if available
        let driverName = "";
        let vehicleNo = "";
        let gt1Name = "";
        let gt2Name = "";

        if (t.ops_route_sessions) {
          const s = t.ops_route_sessions;
          const v = vehicles.find(x => x.id === s.vehicle_id);
          if (v) {
            driverName = v.driver_name || "";
            vehicleNo = v.vehicle_no || "";
          }
          const gt1 = profiles.find(x => x.id === s.gt1_id);
          if (gt1) gt1Name = gt1.name;
          const gt2 = profiles.find(x => x.id === s.gt2_id);
          if (gt2) gt2Name = gt2.name;
        }

        const dateStr = t.scheduled_date ? format(new Date(t.scheduled_date), "dd-MMM-yyyy") : "";
        
        return [
          dateStr,
          t.route || "-",
          driverName,
          vehicleNo,
          gt1Name,
          gt2Name,
          t.ops_status || "Pending",
          t.gt_map || "",
          t.sub_category || "Uncategorized",
          t.ticket_id || "",
          t.contact_name || "",
          t.location || "",
          t.pincode || "",
          (t.notes || "").replace(/\n/g, " "),
          (t.remarks || "").replace(/\n/g, " "),
          (t.address || "").replace(/\n/g, " ")
        ].map(cell => {
          // Clean up cells for TSV
          const cellStr = String(cell || "");
          if (cellStr.includes("\t") || cellStr.includes("\n") || cellStr.includes("\"")) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join("\t");
      });

      const tsvContent = [headers.join("\t"), ...rows].join("\n");
      await navigator.clipboard.writeText(tsvContent);
      
      toast.success(`Copied ${tickets.length} tickets to clipboard!`);
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to copy data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-sm rounded-xl border border-border shadow-2xl flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Bulk Copy Data</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Select a date range to query from the schedule and copy to your clipboard. The data will be formatted for Excel (TSV).
          </p>
          
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">Start Date</label>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                showTicketCounts={true}
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">End Date</label>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                showTicketCounts={true}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 bg-muted/20 flex justify-end gap-2 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCopy}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
            Copy Data
          </button>
        </div>
      </div>
    </div>
  );
}
