"use client";

import React from "react";
import { format } from "date-fns";
import { Copy, CalendarCheck, History, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { cva } from "class-variance-authority";
import { InteractiveTagInput, AutoResizeTextarea } from "./TableCells";
import { LocationCombobox } from "./LocationCombobox";
import { LucideIcon } from "lucide-react";
import type { EnrichedTicket, TicketAnnotation, GeoZone } from "./types";

const safeDateParse = (dateString: string) => {
  if (!dateString || dateString === "-" || dateString.startsWith("1970-01-01")) return null;
  const parts = dateString.split("T")[0].split("-");
  if (parts.length === 3) {
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }
  return new Date(dateString);
};

const getTagColor = (tag: string) => {
  const colors = [
    "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
    "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
    "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400",
    "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
    "bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-400",
    "bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-400",
    "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
  ];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const renderTags = (tagsStr: string | null) => {
  if (!tagsStr || tagsStr.trim() == "-") return null;
  const tags = tagsStr.split(",").map((t: string) => t.trim()).filter((t: string) => t && t !== "-");
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag: string) => (
        <span
          key={tag}
          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border truncate max-w-[90px] ${getTagColor(tag)}`}
          title={tag}
        >
          {tag}
        </span>
      ))}
    </div>
  );
};

const rowVariants = cva(
  "cursor-pointer transition-colors group divide-x divide-border/50 border-b border-border/50",
  {
    variants: {
      priority: {
        default: "hover:bg-muted/20",
        urgent: "bg-rose-200/70 dark:bg-rose-900/60 hover:bg-rose-300/80 dark:hover:bg-rose-900/80 divide-border/60 border-border/60",
        vip: "bg-violet-200/70 dark:bg-violet-900/60 hover:bg-violet-300/80 dark:hover:bg-violet-900/80 divide-border/60 border-border/60",
        scheduled: "bg-green-200/70 dark:bg-green-900/60 hover:bg-green-300/80 dark:hover:bg-green-900/80 divide-border/60 border-border/60",
        numbered: "bg-primary/5 hover:bg-primary/10",
      },
      selected: {
        true: "bg-zinc-200/80 dark:bg-zinc-800/80 hover:bg-zinc-300/80 dark:hover:bg-zinc-700/80 divide-border/60 border-border/60",
        false: "",
      },
    },
    defaultVariants: {
      priority: "default",
      selected: false,
    },
  }
);

type TicketTableRowProps = {
  ticket: EnrichedTicket;
  annotation: TicketAnnotation;
  isSelected: boolean;
  showCheckboxes: boolean;
  showScheduleStatus: boolean;
  toggleSelect: (id: string) => void;
  Icon: LucideIcon;
  color: string;
  geoZones: GeoZone[];
  nameCount: number;
  isNameFiltered: boolean;
  onNameFilterToggle: (name: string) => void;
  onPriorityUpdate: (val: string, isSelected: boolean) => void;
  onLocationUpdate: (area: string, pincode: string, isSelected: boolean) => void;
};

export function TicketTableRow({
  ticket,
  annotation,
  isSelected,
  showCheckboxes,
  showScheduleStatus,
  toggleSelect,
  Icon,
  color,
  geoZones,
  nameCount,
  isNameFiltered,
  onNameFilterToggle,
  onPriorityUpdate,
  onLocationUpdate,
}: TicketTableRowProps) {
  const displayName = annotation?.contact_name || ticket.contact_name || "Unknown";
  const displayAddress = ticket.address1 || "No address";
  const displayBasePincode = ticket.pincode || "";
  
  const prioTag = (annotation?.priority_tag || "").toLowerCase();
  
  let priorityVariant: "default" | "urgent" | "vip" | "scheduled" | "numbered" = "default";
  if (prioTag.includes('e')) priorityVariant = "urgent";
  else if (prioTag.includes('v')) priorityVariant = "vip";
  else if (prioTag.includes('s')) priorityVariant = "scheduled";
  else if (/[0-9]/.test(prioTag)) priorityVariant = "numbered";

  return (
    <tr 
      className={rowVariants({ priority: priorityVariant, selected: isSelected })}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button, input, textarea, a, select')) return;
        if (window.getSelection()?.toString().length) return;
        toggleSelect(ticket.id);
      }}
    >
      {showCheckboxes && (
        <td className={`px-2 py-1 align-middle sticky left-0 z-10 ${isSelected ? "bg-zinc-100 dark:bg-zinc-900 border-r dark:border-neutral-700" : "bg-white dark:bg-[#171717] border-r dark:border-neutral-800"} shadow-[4px_0_12px_-4px_rgba(0,0,0,0.3)] transition-colors w-[56px] min-w-[56px] max-w-[56px]`}>
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelect(ticket.id)}
              className="w-4 h-4 rounded border-border/80 text-blue-600 focus:ring-blue-600 accent-blue-600 dark:accent-blue-500 cursor-pointer transition-colors"
            />
          </div>
        </td>
      )}
      
      <td className="px-2 py-1 align-middle w-20 text-center">
        <InteractiveTagInput 
          ticketId={ticket.ticket_id} 
          stagedTicketId={ticket.id}
          initialValue={prioTag} 
          onUpdate={(val) => onPriorityUpdate(val, isSelected)}
        />
      </td>
      
      {showScheduleStatus && (
        <td className="px-2 py-1 align-middle whitespace-nowrap text-center">
          {(() => {
            if (!ticket.latest_schedule_date) return <span className="text-muted-foreground/30 text-xs">-</span>;
            const today = new Date();
            const tzOffset = today.getTimezoneOffset() * 60000;
            const todayStr = (new Date(today.getTime() - tzOffset)).toISOString().split('T')[0];
            
            if (ticket.latest_schedule_date === todayStr) {
              return <CalendarCheck className="w-4 h-4 text-emerald-500 mx-auto" title={`Scheduled for Today`} />;
            } else if (ticket.latest_schedule_date < todayStr) {
              return <History className="w-4 h-4 text-rose-500 mx-auto" title={`Scheduled in past: ${ticket.latest_schedule_date}`} />;
            } else {
              return <CalendarClock className="w-4 h-4 text-blue-500 mx-auto" title={`Scheduled for Future: ${ticket.latest_schedule_date}`} />;
            }
          })()}
        </td>
      )}
      
      <td className="px-2 py-1 align-middle whitespace-nowrap">
        <div className="text-xs font-mono font-medium text-foreground">
          {(() => {
            const parsedDate = safeDateParse(ticket.date);
            return parsedDate ? format(parsedDate, "MMM d, yyyy") : "-";
          })()}
        </div>
      </td>
      
      <td className="px-2 py-1 align-middle whitespace-nowrap">
        <div className="text-xs font-medium">
          {ticket.ticket_age ? (
            <span className={ticket.ticket_age > 3 ? "text-rose-500" : "text-muted-foreground"}>
              {ticket.ticket_age} {ticket.ticket_age === 1 ? 'day' : 'days'}
            </span>
          ) : (
            <span className="text-emerald-500">New</span>
          )}
        </div>
      </td>
      
      <td className="px-2 py-1 align-middle w-24 max-w-[120px]">
        {renderTags(ticket.raw_tags)}
      </td>
      
      <td className="px-2 py-1 align-middle whitespace-nowrap">
        <div className="flex items-center justify-center" style={{ color }} title={ticket.sub_category || "Uncategorized"}>
          <Icon className="w-5 h-5" />
        </div>
      </td>
      
      <td className="px-2 py-1 align-middle w-28">
        <div className="flex items-center gap-1.5 group/copy">
          <a 
            href={`https://desk.zoho.com/agent/cityfurnish1/support/all-modules/search?searchDept=currentDept&searchWord=${ticket.ticket_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {ticket.ticket_id}
          </a>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(ticket.ticket_id);
              toast.success(`Copied ${ticket.ticket_id}`);
            }}
            className="text-muted-foreground hover:text-primary transition-all cursor-pointer opacity-0 group-hover/copy:opacity-100 p-1 -m-1 rounded-sm hover:bg-muted"
            title="Copy ID"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
      
      <td className="px-2 py-1 align-middle min-w-[180px]">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-foreground line-clamp-2">{displayName}</span>
          {nameCount > 1 && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onNameFilterToggle((displayName || "").trim());
              }}
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm cursor-pointer transition-colors shrink-0 ${isNameFiltered ? 'bg-amber-500 text-white dark:bg-amber-600' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-500 hover:bg-amber-200 dark:hover:bg-amber-900/60'}`}
              title={isNameFiltered ? 'Clear filter' : `Filter to show these ${nameCount} tickets`}
            >
              {nameCount}x
            </button>
          )}
        </div>
      </td>

      <td className="px-2 py-1 align-middle min-w-[200px]">
        <LocationCombobox 
          ticketId={ticket.ticket_id}
          initialLocation={annotation?.location || ""}
          initialPincode={annotation?.pincode || ""}
          geoZones={geoZones}
          onUpdate={(area, pin) => onLocationUpdate(area, pin, isSelected)}
        />
      </td>
      
      <td className="px-2 py-1 align-middle min-w-[250px]">
        <AutoResizeTextarea
          ticketId={ticket.ticket_id}
          stagedTicketId={ticket.id}
          initialValue={annotation?.notes || ""}
        />
      </td>
      
      <td className="px-2 py-1 align-middle min-w-[180px]">
        <div className="text-xs text-muted-foreground line-clamp-2" title={`${displayAddress} ${displayBasePincode}`}>
          {displayAddress} {displayBasePincode ? `- ${displayBasePincode}` : ''}
        </div>
      </td>
    </tr>
  );
}
