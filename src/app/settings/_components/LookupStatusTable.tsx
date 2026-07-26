import React from "react";
import { SettingsDropdown } from "./SettingsDropdown";
import { ActiveToggle } from "./ActiveToggle";
import { SettingsActionButtons } from "./SettingsActionButtons";
import { LookupStatus } from "./LookupStatusManager";

interface LookupStatusTableProps {
  entries: LookupStatus[];
  editingId: string | null;
  editStatus: string;
  editStatusColor: string;
  editSubStatus: string;
  editSubStatusColor: string;
  editIsActive: boolean;
  onSortChange: (id: string, newVal: string) => void;
  onEditStatusChange: (val: string) => void;
  onEditStatusColorChange: (val: string) => void;
  onEditSubStatusChange: (val: string) => void;
  onEditSubStatusColorChange: (val: string) => void;
  onEditIsActiveChange: (val: boolean) => void;
  onEdit: (entry: LookupStatus) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
  onActiveToggle: (id: string, currentActive: boolean) => void;
  onDelete: (id: string) => void;
  colorOptions: { value: string; label: string }[];
  statusColors: Record<string, string>;
}

export function LookupStatusTable({
  entries,
  editingId,
  editStatus,
  editStatusColor,
  editSubStatus,
  editSubStatusColor,
  editIsActive,
  onSortChange,
  onEditStatusChange,
  onEditStatusColorChange,
  onEditSubStatusChange,
  onEditSubStatusColorChange,
  onEditIsActiveChange,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onActiveToggle,
  onDelete,
  colorOptions,
  statusColors
}: LookupStatusTableProps) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-x-auto overflow-y-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-foreground/5 text-foreground/70 uppercase text-xs">
          <tr>
            <th className="px-6 py-3.5 font-semibold w-24">Sort</th>
            <th className="px-6 py-3.5 font-semibold">Status</th>
            <th className="px-6 py-3.5 font-semibold">Status Color</th>
            <th className="px-6 py-3.5 font-semibold">Sub Status</th>
            <th className="px-6 py-3.5 font-semibold">Sub Status Color</th>
            <th className="px-6 py-3.5 font-semibold">Active</th>
            <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {entries.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-foreground/50">No lookups configured.</td>
            </tr>
          ) : (
            entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-foreground/[0.02] transition-colors">
                <td className="px-6 py-3">
                  <input 
                    type="number" 
                    value={entry.order_idx ?? 0}
                    onChange={(e) => onSortChange(entry.id, e.target.value)}
                    className="w-16 bg-background border border-border rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </td>
                
                <td className="px-6 py-3 font-medium">
                  {editingId === entry.id ? (
                    <input 
                      type="text" 
                      value={editStatus}
                      onChange={(e) => onEditStatusChange(e.target.value)}
                      className="w-full bg-background border border-border rounded px-2 py-1 text-sm"
                    />
                  ) : (
                    entry.status
                  )}
                </td>
                
                <td className="px-6 py-3">
                  {editingId === entry.id ? (
                    <div className="w-[140px]">
                      <SettingsDropdown
                        value={editStatusColor}
                        onChange={onEditStatusColorChange}
                        options={colorOptions}
                      />
                    </div>
                  ) : (
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${statusColors[entry.status_color] || statusColors.zinc}`}>
                      {entry.status_color}
                    </span>
                  )}
                </td>

                <td className="px-6 py-3 font-medium text-foreground/80">
                  {editingId === entry.id ? (
                    <input 
                      type="text" 
                      value={editSubStatus}
                      onChange={(e) => onEditSubStatusChange(e.target.value)}
                      className="w-full bg-background border border-border rounded px-2 py-1 text-sm"
                      placeholder="None"
                    />
                  ) : (
                    entry.sub_status || <span className="italic text-foreground/40">None</span>
                  )}
                </td>

                <td className="px-6 py-3">
                  {editingId === entry.id ? (
                    <div className="w-[140px]">
                      <SettingsDropdown
                        value={editSubStatusColor}
                        onChange={onEditSubStatusColorChange}
                        options={colorOptions}
                      />
                    </div>
                  ) : (
                    entry.sub_status ? (
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${statusColors[entry.sub_status_color] || statusColors.zinc}`}>
                        {entry.sub_status_color}
                      </span>
                    ) : (
                      "-"
                    )
                  )}
                </td>

                <td className="px-6 py-3">
                  <ActiveToggle 
                    isActive={editingId === entry.id ? editIsActive : (entry.is_active !== false)} 
                    isEditing={editingId === entry.id} 
                    onToggle={(newVal) => {
                      if (editingId === entry.id) onEditIsActiveChange(newVal);
                      else onActiveToggle(entry.id, newVal);
                    }} 
                  />
                </td>

                <td className="px-6 py-3 text-right">
                  <SettingsActionButtons
                    isEditing={editingId === entry.id}
                    onEdit={() => onEdit(entry)}
                    onSave={() => onSaveEdit(entry.id)}
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
