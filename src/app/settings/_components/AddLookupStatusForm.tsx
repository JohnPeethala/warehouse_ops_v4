import React, { useState } from "react";
import { Plus } from "lucide-react";
import { SettingsDropdown } from "./SettingsDropdown";

interface AddLookupStatusFormProps {
  onAdd: (status: string, statusColor: string, subStatus: string, subStatusColor: string, isActive: boolean) => Promise<{ success: boolean; error?: string }>;
  colorOptions: { value: string; label: string }[];
}

export function AddLookupStatusForm({ onAdd, colorOptions }: AddLookupStatusFormProps) {
  const [status, setStatus] = useState("");
  const [statusColor, setStatusColor] = useState("zinc");
  const [subStatus, setSubStatus] = useState("");
  const [subStatusColor, setSubStatusColor] = useState("zinc");
  const [isActive, setIsActive] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status.trim()) return;
    setIsAdding(true);
    
    const res = await onAdd(status.trim(), statusColor, subStatus.trim(), subStatusColor, isActive);
    
    if (res.success) {
      setStatus("");
      setStatusColor("zinc");
      setSubStatus("");
      setSubStatusColor("zinc");
      setIsActive(true);
    }
    
    setIsAdding(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col lg:flex-row gap-4 items-end">
      <div className="flex-1 min-w-[200px]">
        <label className="text-xs font-semibold text-foreground/60 mb-1.5 block uppercase tracking-wider">Status</label>
        <input 
          type="text" 
          value={status} 
          onChange={(e) => setStatus(e.target.value)} 
          placeholder="e.g. Not Done" 
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-foreground/30"
          required
        />
      </div>
      <div className="w-[180px] shrink-0">
        <label className="text-xs font-semibold text-foreground/60 mb-1.5 block uppercase tracking-wider">Status Color</label>
        <SettingsDropdown
          value={statusColor}
          onChange={setStatusColor}
          options={colorOptions}
        />
      </div>

      <div className="flex-1 min-w-[200px]">
        <label className="text-xs font-semibold text-foreground/60 mb-1.5 block uppercase tracking-wider">Sub Status (Optional)</label>
        <input 
          type="text" 
          value={subStatus} 
          onChange={(e) => setSubStatus(e.target.value)} 
          placeholder="e.g. Customer Rescheduled" 
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-foreground/30"
        />
      </div>
      <div className="w-[180px] shrink-0">
        <label className="text-xs font-semibold text-foreground/60 mb-1.5 block uppercase tracking-wider">Sub Status Color</label>
        <SettingsDropdown
          value={subStatusColor}
          onChange={setSubStatusColor}
          options={colorOptions}
        />
      </div>

      <div className="flex items-center gap-2 mb-2">
        <input 
          type="checkbox" 
          id="isSActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="rounded border-border text-primary focus:ring-primary cursor-pointer"
        />
        <label htmlFor="isSActive" className="text-xs font-semibold uppercase text-foreground/60 cursor-pointer">Active</label>
      </div>

      <button 
        type="submit"
        disabled={isAdding || !status.trim()}
        className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors h-[38px] shrink-0"
      >
        {isAdding ? "Adding..." : <><Plus className="w-4 h-4" /> Add</>}
      </button>
    </form>
  );
}
