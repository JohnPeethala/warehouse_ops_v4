import React from "react";
import { ActiveToggle } from "./ActiveToggle";
import { SettingsActionButtons } from "./SettingsActionButtons";
import { Vehicle } from "./VehiclesManager";

interface VehiclesTableProps {
  entries: Vehicle[];
  editingId: string | null;
  editVehicleNo: string;
  editDriverName: string;
  editDriverPhone: string;
  editIsActive: boolean;
  onEditVehicleNoChange: (val: string) => void;
  onEditDriverNameChange: (val: string) => void;
  onEditDriverPhoneChange: (val: string) => void;
  onEditIsActiveChange: (val: boolean) => void;
  onEdit: (v: Vehicle) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
  onActiveToggle: (id: string, currentActive: boolean) => void;
  onDelete: (id: string) => void;
}

export function VehiclesTable({
  entries,
  editingId,
  editVehicleNo,
  editDriverName,
  editDriverPhone,
  editIsActive,
  onEditVehicleNoChange,
  onEditDriverNameChange,
  onEditDriverPhoneChange,
  onEditIsActiveChange,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onActiveToggle,
  onDelete
}: VehiclesTableProps) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-foreground/5 text-foreground/70 uppercase text-xs">
          <tr>
            <th className="px-6 py-3.5 font-semibold">Vehicle No</th>
            <th className="px-6 py-3.5 font-semibold">Driver Name</th>
            <th className="px-6 py-3.5 font-semibold">Driver Phone</th>
            <th className="px-6 py-3.5 font-semibold">Active</th>
            <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {entries.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-foreground/50">
                No vehicles configured yet.
              </td>
            </tr>
          ) : (
            entries.map((v) => (
              <tr key={v.id} className="hover:bg-foreground/[0.02] transition-colors">
                <td className="px-6 py-3 font-medium w-1/3">
                  {editingId === v.id ? (
                    <input 
                      type="text" 
                      value={editVehicleNo} 
                      onChange={e => onEditVehicleNoChange(e.target.value)}
                      className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:border-primary/50"
                    />
                  ) : (
                    v.vehicle_no
                  )}
                </td>
                <td className="px-6 py-3 w-1/4 text-foreground/80">
                  {editingId === v.id ? (
                    <input 
                      type="text" 
                      value={editDriverName} 
                      onChange={e => onEditDriverNameChange(e.target.value)}
                      className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:border-primary/50"
                    />
                  ) : (
                    v.driver_name || <span className="text-foreground/40 italic">Not Assigned</span>
                  )}
                </td>
                <td className="px-6 py-3 w-1/4 text-foreground/80">
                  {editingId === v.id ? (
                    <input 
                      type="text" 
                      value={editDriverPhone} 
                      onChange={e => onEditDriverPhoneChange(e.target.value)}
                      className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:border-primary/50"
                    />
                  ) : (
                    v.driver_phone || <span className="text-foreground/40 italic">No Phone</span>
                  )}
                </td>
                <td className="px-6 py-3 w-[100px]">
                  <ActiveToggle 
                    isActive={editingId === v.id ? editIsActive : (v.is_active !== false)} 
                    isEditing={editingId === v.id} 
                    onToggle={(newVal) => {
                      if (editingId === v.id) onEditIsActiveChange(newVal);
                      else onActiveToggle(v.id, newVal);
                    }} 
                  />
                </td>
                <td className="px-6 py-3 text-right">
                  <SettingsActionButtons
                    isEditing={editingId === v.id}
                    onEdit={() => onEdit(v)}
                    onSave={() => onSaveEdit(v.id)}
                    onCancel={onCancelEdit}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
