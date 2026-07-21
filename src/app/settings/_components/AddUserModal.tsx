import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { SettingsDropdown } from "./SettingsDropdown";

interface AddUserModalProps {
  onClose: () => void;
  onCreate: (name: string, phone: string, role: string, isActive: boolean) => Promise<{ success: boolean; error?: string }>;
  roleOptions: { value: string; label: string; icon?: React.ReactNode }[];
}

export function AddUserModal({ onClose, onCreate, roleOptions }: AddUserModalProps) {
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<string>("ground");
  const [newIsActive, setNewIsActive] = useState(true);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSaving(true);
    
    const res = await onCreate(newName, newPhone, newRole, newIsActive);
    
    if (res.success) {
      onClose();
    } else {
      setFormError(res.error || "Failed to create user.");
    }
    
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-md overflow-visible animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between rounded-t-xl">
          <h3 className="font-semibold text-lg">Add New User</h3>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {formError && (
            <div className="bg-red-500/10 text-red-500 text-sm px-4 py-2 rounded-lg">
              {formError}
            </div>
          )}
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground/70">Full Name</label>
            <input 
              type="text" 
              value={newName} 
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. John Doe"
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
              required
            />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input 
              type="checkbox" 
              id="newIsActive"
              checked={newIsActive}
              onChange={e => setNewIsActive(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
            />
            <label htmlFor="newIsActive" className="text-sm font-medium text-foreground/70 cursor-pointer">Active User</label>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground/70">Phone Number</label>
            <input 
              type="tel" 
              value={newPhone} 
              onChange={e => setNewPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground/70">Role</label>
            <SettingsDropdown
              value={newRole}
              onChange={setNewRole}
              options={roleOptions}
            />
          </div>

          <div className="flex items-center justify-end gap-3 mt-4">
            <button 
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-foreground/70 hover:text-foreground px-4 py-2"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium flex items-center justify-center min-w-[120px] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
