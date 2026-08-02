"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Search, Loader2, AlertCircle, CheckCircle2, ChevronDown } from "lucide-react";
import { fetchTicketByIdForSchedule, addTicketsToSchedule } from "@/app/actions/schedule";
import { toast } from "sonner";
import { useSubCategorySettings } from "@/components/providers/SubCategoryProvider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { getCategoryDetails } from "@/lib/categoryUtils";
import { DatePicker } from "@/components/ui/date-picker";

const SubCategoryDropdown = ({ 
  value, 
  onChange, 
  options 
}: { 
  value: string; 
  onChange: (val: string) => void;
  options: any[];
}) => {
  const [open, setOpen] = useState(false);
  
  const { Icon: SelectedIcon, color: selectedColor } = value 
    ? getCategoryDetails(value, options) 
    : { Icon: null, color: "" };

  const selectedOption = options.find(o => o.name === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={`group relative flex items-center justify-between w-full h-8 bg-background hover:bg-muted/50 border transition-all rounded-md px-2 text-left outline-none shadow-sm ${open ? 'border-primary ring-1 ring-primary/20' : 'border-border'}`}>
        <div className="flex-1 truncate py-0.5 pr-2 flex items-center gap-2">
          {selectedOption && SelectedIcon ? (
            <>
              <SelectedIcon className="w-3.5 h-3.5 shrink-0" style={{ color: selectedColor }} />
              <span className="text-foreground truncate text-[11px] font-medium">{selectedOption.name}</span>
            </>
          ) : (
            <span className="text-[11px] text-muted-foreground font-medium">Select Ops...</span>
          )}
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search Ops..." className="h-8 text-xs" />
          <CommandList className="max-h-[200px] custom-scrollbar">
            <CommandEmpty className="py-2 px-2 text-xs text-center text-muted-foreground">No matching ops found.</CommandEmpty>
            <CommandGroup>
              {options.map(o => {
                const { Icon, color } = getCategoryDetails(o.name, options);
                return (
                  <CommandItem
                    key={o.name}
                    value={o.name}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 cursor-pointer text-xs"
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                    <span>{o.name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

type TicketEntry = {
  id: string; // The UI list ID, not the ticket ID
  ticketIdInput: string;
  loading: boolean;
  error?: string;
  isNewPrompt?: boolean;
  data?: any; // The fetched ticket data
  overrides: {
    contact_name?: string;
    location?: string;
    address1?: string;
    pincode?: string;
    notes?: string;
    remarks?: string;
    sub_category?: string;
  };
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onTicketsAdded: (newLogs: any[]) => void;
};

export function AddTicketsModal({ isOpen, onClose, onTicketsAdded }: Props) {
  const subCategories = useSubCategorySettings();
  const [entries, setEntries] = useState<TicketEntry[]>([
    { id: "1", ticketIdInput: "", loading: false, overrides: {} }
  ]);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date();
  const tzOffset = today.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(today.getTime() - tzOffset)).toISOString().slice(0, -1);
  const todayStr = localISOTime.split('T')[0];

  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setEntries([{ id: crypto.randomUUID(), ticketIdInput: "", loading: false, overrides: {} }]);
      setSelectedDate(todayStr);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (id: string, value: string) => {
    // Detect multi-line paste
    if (value.includes("\n") || value.includes(",")) {
      const parts = value.split(/[\n,]+/).map(p => p.trim()).filter(Boolean);
      if (parts.length > 0) {
        setEntries(prev => {
          const newEntries = [...prev];
          const targetIndex = newEntries.findIndex(e => e.id === id);
          if (targetIndex >= 0) {
            // Replace the current one with the first part
            newEntries[targetIndex] = { ...newEntries[targetIndex], ticketIdInput: parts[0] };
            // Add the rest
            const additional = parts.slice(1).map(p => ({
              id: crypto.randomUUID(),
              ticketIdInput: p,
              loading: false,
              overrides: {}
            }));
            newEntries.splice(targetIndex + 1, 0, ...additional);
          }
          return newEntries;
        });
        return;
      }
    }

    setEntries(prev => prev.map(e => e.id === id ? { ...e, ticketIdInput: value, error: undefined, data: undefined } : e));
  };

  const handleSearch = async (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (!entry || !entry.ticketIdInput.trim()) return;

    setEntries(prev => prev.map(e => e.id === id ? { ...e, loading: true, error: undefined, isNewPrompt: false } : e));

    const res = await fetchTicketByIdForSchedule(entry.ticketIdInput.trim(), selectedDate);
    
    setEntries(prev => prev.map(e => {
      if (e.id === id) {
        if (!res.success) {
          if (res.error === "Ticket not found") {
            return { 
              ...e, 
              loading: false, 
              error: undefined, 
              isNewPrompt: false,
              data: { ticket_id: e.ticketIdInput.trim(), isNew: true },
              overrides: {
                contact_name: "",
                location: "",
                address1: "",
                pincode: "",
                notes: "",
                remarks: "",
                sub_category: "",
              }
            };
          }
          return { ...e, loading: false, error: res.error, isNewPrompt: false };
        }
        return { 
          ...e, 
          loading: false, 
          isNewPrompt: false,
          data: res.data,
          overrides: {
            contact_name: res.data?.contact_name || "",
            location: res.data?.location || "",
            address1: res.data?.address1 || "",
            pincode: res.data?.pincode || "",
            notes: res.data?.notes || "",
            remarks: res.data?.remarks || "",
            sub_category: res.data?.sub_category || "",
          }
        };
      }
      return e;
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch(id);
    }
  };

  const handleOverrideChange = (id: string, field: string, value: string) => {
    setEntries(prev => prev.map(e => {
      if (e.id === id) {
        return { ...e, overrides: { ...e.overrides, [field]: value } };
      }
      return e;
    }));
  };



  const removeEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const addEmptyEntry = () => {
    setEntries(prev => [...prev, { id: crypto.randomUUID(), ticketIdInput: "", loading: false, overrides: {} }]);
  };

  const handleSubmit = async () => {
    const validEntries = entries.filter(e => e.data && !e.error);
    if (validEntries.length === 0) {
      toast.error("No valid tickets to add.");
      return;
    }

    setSubmitting(true);
    const ticketsPayload = validEntries.map(e => ({
      ...e.data,
      ...e.overrides
    }));

    try {
      const res = await addTicketsToSchedule(ticketsPayload, selectedDate);
      if (res.success) {
        toast.success(`Successfully added ${res.data?.length} tickets to schedule.`);
        onTicketsAdded(res.data || []);
        onClose();
      } else {
        toast.error(res.error || "Failed to add tickets");
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const validCount = entries.filter(e => e.data && !e.error).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-10 bg-background/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-card w-full max-w-2xl rounded-xl border border-border shadow-2xl flex flex-col my-auto relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20 shrink-0 sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Add Tickets to Schedule</h2>
            <p className="text-sm text-muted-foreground">Search by Ticket ID and verify data before adding.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-40">
              <DatePicker 
                value={selectedDate}
                onChange={setSelectedDate}
                showTicketCounts={false}
              />
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-4 overflow-y-auto max-h-[60vh]">
          {entries.map((entry, index) => (
            <div key={entry.id} className="flex flex-col gap-2 p-3 bg-muted/30 border border-border rounded-lg relative group">
              
              {/* Input Row */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Enter or Paste Ticket ID (e.g. TKT-1234)"
                    value={entry.ticketIdInput}
                    onChange={(e) => handleInputChange(entry.id, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, entry.id)}
                    className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <button
                  onClick={() => handleSearch(entry.id)}
                  disabled={entry.loading || !entry.ticketIdInput.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 disabled:opacity-50"
                >
                  {entry.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Search
                </button>
                {entries.length > 1 && (
                  <button
                    onClick={() => removeEntry(entry.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Error State */}
              {entry.error && (
                <div className="flex items-center gap-1.5 text-sm text-destructive mt-1 bg-destructive/10 px-2 py-1.5 rounded-md border border-destructive/20">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-medium">{entry.error}</span>
                </div>
              )}



              {/* Success / Preview State */}
              {entry.data && !entry.error && (
                <div className="mt-1 flex items-center gap-2 p-1.5 bg-background border border-border rounded-lg shadow-sm relative overflow-hidden pl-2">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/50"></div>
                  
                  <div className="flex items-center gap-1.5 shrink-0 w-[140px] pl-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    <span className="font-bold text-foreground text-xs truncate" title={entry.data.ticket_id}>
                      {entry.data.ticket_id}
                    </span>
                    {entry.data.isNew && (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 px-1 py-0.5 rounded leading-none flex items-center shrink-0">New</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-[120px]">
                    <SubCategoryDropdown
                      value={entry.overrides.sub_category || ""}
                      onChange={(val) => handleOverrideChange(entry.id, "sub_category", val)}
                      options={Object.values(subCategories)}
                    />
                  </div>

                  <div className="flex-[2] min-w-[150px]">
                    <input
                      type="text"
                      placeholder="Contact Name"
                      value={entry.overrides.contact_name || ""}
                      onChange={(e) => handleOverrideChange(entry.id, "contact_name", e.target.value)}
                      className="w-full h-8 bg-background hover:bg-muted/50 border border-border rounded-md px-2 text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-primary shadow-sm transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          <button
            onClick={addEmptyEntry}
            className="flex items-center justify-center gap-1.5 py-2.5 border-2 border-dashed border-border rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors mt-2"
          >
            <Plus className="w-4 h-4" />
            Add Another Ticket
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 bg-muted/20 flex items-center justify-between shrink-0 rounded-b-xl">
          <span className="text-sm font-medium text-muted-foreground">
            {validCount} ticket{validCount !== 1 ? 's' : ''} ready to add
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={validCount === 0 || submitting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Add to Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
