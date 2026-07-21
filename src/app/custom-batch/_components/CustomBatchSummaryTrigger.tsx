"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FileBarChart2, Copy } from "lucide-react";
import { toast } from "sonner";
import { CustomBatchSummaryModal } from "./CustomBatchSummaryModal";
import type { EnrichedTicket } from "@/components/features/ticket-table/types";

interface Props {
  tickets: EnrichedTicket[];
}

export function CustomBatchSummaryTrigger({ tickets }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [headerEl, setHeaderEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHeaderEl(document.getElementById("header-actions"));
  }, []);

  const handleCopyTable = async () => {
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const cleanNote = (note: string) => note.replace(/\[.*? - .*?\] - /g, '').trim();

    const headers = ["Date", "Status", "Ops", "Ticket ID", "Name", "Notes"];
    const rows = [headers.join("\t")];

    tickets.forEach(t => {
      const status = t.status || "-";
      const ops = t.sub_category || "-";
      const ticketId = t.ticket_id || "-";
      const name = (t.contact_name || "-").replace(/\t/g, ' ');
      const notes = cleanNote(t.annotation?.notes || "-").replace(/\t/g, ' ').replace(/\n/g, ' ');

      rows.push([today, status, ops, ticketId, name, notes].join("\t"));
    });

    try {
      await navigator.clipboard.writeText(rows.join("\n"));
      toast.success("Table copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy table");
    }
  };

  return (
    <>
      {headerEl && createPortal(
        <>
          <button
            onClick={handleCopyTable}
            className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-[#171717] border border-border text-foreground text-sm font-semibold rounded-lg hover:bg-muted transition-colors shadow-sm"
            title="Copy Table Data (Excel format)"
          >
            <Copy size={16} className="text-muted-foreground" />
            Copy Data
          </button>
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-[#171717] border border-border text-foreground text-sm font-semibold rounded-lg hover:bg-muted transition-colors shadow-sm"
          >
            <FileBarChart2 size={16} className="text-primary" />
            Summary
          </button>
        </>,
        headerEl
      )}

      <CustomBatchSummaryModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        tickets={tickets}
      />
    </>
  );
}
