"use client";

import React, { useState } from "react";
import { addLookup, updateLookup, deleteLookup, updateLookupsOrder } from "@/app/actions/settings";
import { Save } from "lucide-react";
import { AddLookupStatusForm } from "./AddLookupStatusForm";
import { LookupStatusTable } from "./LookupStatusTable";

export interface LookupStatus {
  id: string;
  domain: string;
  status: string;
  sub_status: string | null;
  status_color: string;
  sub_status_color: string;
  is_terminal: boolean;
  order_idx: number;
  is_active: boolean;
}

const colorOptions = [
  { value: "zinc", label: "Zinc (Default)" },
  { value: "red", label: "Red (Failed/Not Done)" },
  { value: "emerald", label: "Emerald (Success/Done)" },
  { value: "amber", label: "Amber (Pending)" },
  { value: "blue", label: "Blue (Info/Cx)" },
  { value: "purple", label: "Purple" },
  { value: "orange", label: "Orange" }
];

const STATUS_COLORS: Record<string, string> = {
  zinc: "bg-zinc-100 text-zinc-800 border-zinc-200",
  red: "bg-red-50 text-red-700 border-red-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
};

export function LookupStatusManager({ initialData }: { initialData: LookupStatus[] }) {
  const [entries, setEntries] = useState<LookupStatus[]>(initialData);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editSubStatus, setEditSubStatus] = useState("");
  const [editStatusColor, setEditStatusColor] = useState("zinc");
  const [editSubStatusColor, setEditSubStatusColor] = useState("zinc");
  const [editIsActive, setEditIsActive] = useState(true);

  const handleAdd = async (status: string, statusColor: string, subStatus: string, subStatusColor: string, isActive: boolean) => {
    const autoTerminal = status.trim().toLowerCase() !== 'pending';
    const res = await addLookup(
      "TICKET",
      status,
      subStatus,
      statusColor,
      subStatusColor,
      autoTerminal,
      entries.length,
      isActive
    );
    
    if (res.success) {
      setEntries([...entries, { 
        id: Date.now().toString(),
        domain: "TICKET", 
        status: status,
        sub_status: subStatus,
        status_color: statusColor,
        sub_status_color: subStatusColor,
        is_terminal: autoTerminal,
        order_idx: entries.length,
        is_active: isActive
      }]);
    } else {
      alert("Failed to add status: " + res.error);
    }
    return res;
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this status configuration?")) return;
    
    const res = await deleteLookup(id);
    if (res.success) {
      setEntries(entries.filter(e => e.id !== id));
    } else {
      alert("Failed to delete status: " + res.error);
    }
  };

  const handleSortChange = (id: string, newOrder: string) => {
    const parsed = parseInt(newOrder, 10);
    setEntries(entries.map(e => e.id === id ? { ...e, order_idx: isNaN(parsed) ? 0 : parsed } : e));
  };

  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    const updates = entries.map(e => ({ id: e.id, order_idx: e.order_idx || 0 }));
    const res = await updateLookupsOrder(updates);
    if (!res.success) alert("Failed to save sort order");
    setIsSavingOrder(false);
  };

  const startEdit = (entry: LookupStatus) => {
    setEditingId(entry.id);
    setEditStatus(entry.status);
    setEditSubStatus(entry.sub_status || "");
    setEditStatusColor(entry.status_color || "zinc");
    setEditSubStatusColor(entry.sub_status_color || "zinc");
    setEditIsActive(entry.is_active ?? true);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    if (!editStatus.trim()) return;
    const sStatus = editSubStatus.trim() ? editSubStatus.trim() : null;
    
    const res = await updateLookup(id, { 
      status: editStatus.trim(), 
      sub_status: sStatus,
      status_color: editStatusColor,
      sub_status_color: editSubStatusColor,
      is_active: editIsActive
    });

    if (res.success) {
      setEntries(entries.map(e => e.id === id ? { 
        ...e, 
        status: editStatus.trim(), 
        sub_status: sStatus,
        status_color: editStatusColor,
        sub_status_color: editSubStatusColor,
        is_active: editIsActive
      } : e));
      setEditingId(null);
    } else {
      alert("Failed to update status: " + res.error);
    }
  };

  const handleActiveToggle = async (id: string, currentActive: boolean) => {
    const res = await updateLookup(id, { is_active: !currentActive });
    if (res.success) {
      setEntries(entries.map(e => e.id === id ? { ...e, is_active: !currentActive } : e));
    } else {
      alert("Failed to update status visibility: " + res.error);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ticket Statuses</h2>
          <p className="text-sm text-foreground/60 mt-1">Configure hierarchical statuses (Status -{">"} Sub Status) and their colors.</p>
        </div>
        <button 
          onClick={handleSaveOrder}
          disabled={isSavingOrder}
          className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-secondary/80 transition-colors disabled:opacity-50"
        >
          <Save size={16} /> Save Sort Order
        </button>
      </div>
      
      <AddLookupStatusForm onAdd={handleAdd} colorOptions={colorOptions} />

      <LookupStatusTable
        entries={entries}
        editingId={editingId}
        editStatus={editStatus}
        editStatusColor={editStatusColor}
        editSubStatus={editSubStatus}
        editSubStatusColor={editSubStatusColor}
        editIsActive={editIsActive}
        onSortChange={handleSortChange}
        onEditStatusChange={setEditStatus}
        onEditStatusColorChange={setEditStatusColor}
        onEditSubStatusChange={setEditSubStatus}
        onEditSubStatusColorChange={setEditSubStatusColor}
        onEditIsActiveChange={setEditIsActive}
        onEdit={startEdit}
        onCancelEdit={cancelEdit}
        onSaveEdit={saveEdit}
        onActiveToggle={handleActiveToggle}
        onDelete={handleDelete}
        colorOptions={colorOptions}
        statusColors={STATUS_COLORS}
      />
    </div>
  );
}
