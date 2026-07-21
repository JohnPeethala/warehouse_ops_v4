import React, { useState } from "react";
import { Plus, Loader2 } from "lucide-react";

interface AddVehicleFormProps {
  onAdd: (vehicleNo: string, driverName: string, isActive: boolean) => Promise<{ success: boolean; error?: string }>;
}

export function AddVehicleForm({ onAdd }: AddVehicleFormProps) {
  const [vehicleNo, setVehicleNo] = useState("");
  const [driverName, setDriverName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNo.trim()) return;
    setIsAdding(true);
    
    const res = await onAdd(vehicleNo.trim(), driverName.trim(), isActive);
    
    if (res.success) {
      setVehicleNo("");
      setDriverName("");
      setIsActive(true);
    }
    
    setIsAdding(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row gap-4 items-end">
      <div className="flex-1 w-full">
        <label className="text-xs font-semibold text-foreground/60 mb-1.5 block uppercase tracking-wider">Vehicle No</label>
        <input 
          type="text" 
          placeholder="e.g. DL-1-AB-1234" 
          value={vehicleNo}
          onChange={e => setVehicleNo(e.target.value)}
          className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary/50"
          required
        />
      </div>
      <div className="flex-1 w-full">
        <label className="text-xs font-semibold text-foreground/60 mb-1.5 block uppercase tracking-wider">Driver Name</label>
        <input 
          type="text" 
          placeholder="e.g. John Doe" 
          value={driverName}
          onChange={e => setDriverName(e.target.value)}
          className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary/50"
        />
      </div>
      <div className="flex items-center gap-2 mb-2 w-[100px] shrink-0">
        <input 
          type="checkbox" 
          id="vIsActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
        />
        <label htmlFor="vIsActive" className="text-xs font-semibold uppercase text-foreground/60 cursor-pointer">Active</label>
      </div>
      <button 
        type="submit"
        disabled={isAdding || !vehicleNo.trim()}
        className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors h-[38px] shrink-0"
      >
        {isAdding ? "Adding..." : <><Plus className="w-4 h-4" /> Add Vehicle</>}
      </button>
    </form>
  );
}
