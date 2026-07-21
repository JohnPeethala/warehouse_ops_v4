import React from "react";
import { Copy, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useScheduleContext } from "./ScheduleContext";
import { getCategoryDetails } from "@/lib/categoryUtils";
import { RouteInput } from "./cells/RouteInput";
import { StatusDropdown } from "./cells/StatusDropdown";
import { LinkInput } from "./cells/LinkInput";
import { LocationCombobox } from "@/components/features/ticket-table/LocationCombobox";
import { AutoResizeTextarea } from "@/components/features/ticket-table/TableCells";
import { updateTicketLocation } from "@/app/actions/geo";

export function TicketRow({
  ticket,
  nameCount,
  statusOptions,
}: {
  ticket: any;
  nameCount: number;
  statusOptions: any[];
}) {
  const { 
    selectedIds, setSelectedIds, 
    subCategories, geoZones,
    handleFieldUpdate: onUpdateField, 
    handleFieldsUpdate: onUpdateFields, 
    handleDelete: onDelete, 
    setColFilters,
    annotationsMap
  } = useScheduleContext();

  const isSelected = selectedIds.has(ticket.id);
  
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const { Icon, color } = getCategoryDetails(ticket.sub_category, subCategories);
  
  const displayName = ticket.contact_name || "Unknown";
  const displayAddress = ticket.address || "No address";
  const displayBasePincode = ticket.pincode || "";
  
  const isDuplicateName = nameCount > 1;
  
  const activeAnnotation = annotationsMap[ticket.ticket_id] || ticket.annotation || {};
  const prioTag = (activeAnnotation?.priority_tag || "").toLowerCase();
  
  let rowBgClass = "hover:bg-muted/20 transition-colors group divide-x divide-border/50 border-b border-border/50";
  let stickyBgClass = "bg-white dark:bg-[#171717] border-r dark:border-neutral-800";

  if (prioTag.includes('e')) {
    rowBgClass = "bg-rose-200/70 dark:bg-rose-900/60 hover:bg-rose-300/80 dark:hover:bg-rose-900/80 transition-colors group divide-x divide-border/60 border-b border-border/60";
  } else if (prioTag.includes('v')) {
    rowBgClass = "bg-violet-200/70 dark:bg-violet-900/60 hover:bg-violet-300/80 dark:hover:bg-violet-900/80 transition-colors group divide-x divide-border/60 border-b border-border/60";
  } else if (prioTag.includes('s')) {
    rowBgClass = "bg-green-200/70 dark:bg-green-900/60 hover:bg-green-300/80 dark:hover:bg-green-900/80 transition-colors group divide-x divide-border/60 border-b border-border/60";
  } else if (/[0-9]/.test(prioTag)) {
    rowBgClass = "bg-primary/5 hover:bg-primary/10 transition-colors group divide-x divide-border/50 border-b border-border/50";
  }

  if (isSelected) {
    rowBgClass = "bg-zinc-200/80 dark:bg-zinc-800/80 hover:bg-zinc-300/80 dark:hover:bg-zinc-700/80 transition-colors group divide-x divide-border/60 border-b border-border/60";
    stickyBgClass = "bg-zinc-100 dark:bg-zinc-900 border-r dark:border-neutral-700";
  }

  return (
    <tr 
      className={`${rowBgClass} cursor-pointer`}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button, input, textarea, a, select, [role="combobox"]')) return;
        if (window.getSelection()?.toString().length) return;
        toggleSelect(ticket.id);
      }}
    >
      <td className={`px-2 py-1 align-middle sticky left-0 z-10 ${stickyBgClass} shadow-[4px_0_12px_-4px_rgba(0,0,0,0.3)] transition-colors w-[56px] min-w-[56px] max-w-[56px]`}>
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelect(ticket.id)}
            className="w-4 h-4 rounded border-border/80 text-blue-600 focus:ring-blue-600 accent-blue-600 dark:accent-blue-500 cursor-pointer transition-colors"
          />
        </div>
      </td>
      
      <td className="px-2 py-1 align-middle whitespace-nowrap">
        <div className="text-xs font-mono font-medium text-foreground">
          {ticket.scheduled_date ? format(new Date(ticket.scheduled_date), "MMM d, yyyy") : format(new Date(ticket.created_at), "MMM d, yyyy")}
        </div>
      </td>
      
      <td className="px-2 py-1 text-center w-16">
        <RouteInput
          value={ticket.route || ""}
          onChange={(val) => onUpdateField(ticket.id, "route", val)}
        />
      </td>

      <td className="px-2 py-1 min-w-[120px]">
        <StatusDropdown
          statusValue={ticket.status || ""}
          subStatusValue={ticket.sub_status || ""}
          onChange={(updates) => onUpdateFields && onUpdateFields(ticket.id, updates)}
          options={statusOptions}
        />
      </td>

      <td className="px-2 py-1 text-center w-16">
        <LinkInput
          value={ticket.gt_map || ""}
          onChange={(val) => onUpdateField(ticket.id, "gt_map", val)}
        />
      </td>

      <td className="px-2 py-1 align-middle whitespace-nowrap">
        <div className="flex items-center justify-center" style={{ color }} title={ticket.sub_category || "Uncategorized"}>
          <Icon className="w-5 h-5" />
        </div>
      </td>
      
      <td className="px-2 py-1 align-middle">
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
          {isDuplicateName && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setColFilters(prev => ({ ...prev, contactName: new Set([(displayName || "").trim()]) }));
              }}
              className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-500 shadow-sm hover:bg-amber-200 dark:hover:bg-amber-900/60 cursor-pointer transition-colors shrink-0"
              title={`Filter to show these ${nameCount} tickets`}
            >
              {nameCount}x
            </button>
          )}
        </div>
      </td>
      
      <td className="px-2 py-1 align-middle min-w-[200px]">
        <LocationCombobox 
          ticketId={ticket.ticket_id}
          stagedTicketId={ticket.id}
          initialLocation={ticket.location || ""}
          initialPincode={ticket.pincode || ""}
          geoZones={geoZones}
          onUpdate={async (area, pincode) => {
            if (onUpdateFields) {
              onUpdateFields(ticket.id, { location: area, pincode: pincode });
            } else {
              // Fallback if somehow onUpdateFields is missing
              onUpdateField(ticket.id, "location", area);
              onUpdateField(ticket.id, "pincode", pincode);
            }
            await updateTicketLocation(ticket.ticket_id, ticket.id, area, pincode);
          }}
        />
      </td>
      
      <td className="px-2 py-1 min-w-[250px]">
        <AutoResizeTextarea
          ticketId={ticket.ticket_id}
          stagedTicketId={ticket.id}
          initialValue={ticket.notes || ""}
          onUpdate={(val) => onUpdateField(ticket.id, "notes", val)}
        />
      </td>
      
      <td className="px-2 py-1 min-w-[250px]">
        <AutoResizeTextarea
          ticketId={ticket.ticket_id}
          stagedTicketId={ticket.id}
          initialValue={ticket.remarks || ""}
          onUpdate={(val) => onUpdateField(ticket.id, "remarks", val)}
        />
      </td>

      <td className="px-2 py-1 align-middle min-w-[180px]">
        <div className="text-xs text-muted-foreground line-clamp-2" title={`${displayAddress} ${displayBasePincode}`}>
          {displayAddress} {displayBasePincode ? `- ${displayBasePincode}` : ''}
        </div>
      </td>
      
      <td className="px-2 py-1 align-middle text-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(ticket.id);
          }}
          className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded transition-colors"
          title="Delete from Schedule"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}
