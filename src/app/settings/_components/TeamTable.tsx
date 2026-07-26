import React from "react";
import { SettingsDropdown } from "./SettingsDropdown";
import { ActiveToggle } from "./ActiveToggle";
import { Profile } from "./TeamManager";
import { Trash2 } from "lucide-react";

interface TeamTableProps {
  entries: Profile[];
  editingId: string | null;
  isSaving: boolean;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
  onRoleChange: (id: string, newRole: string) => void;
  onActiveToggle: (id: string, currentActive: boolean) => void;
  onDelete: (id: string) => void;
  getRoleIcon: (role: string) => React.ReactNode;
  roleOptions: { value: string; label: string; icon?: React.ReactNode }[];
}

export function TeamTable({
  entries,
  editingId,
  isSaving,
  onEdit,
  onCancelEdit,
  onRoleChange,
  onActiveToggle,
  onDelete,
  getRoleIcon,
  roleOptions
}: TeamTableProps) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-visible">
      <table className="w-full text-sm text-left">
        <thead className="bg-foreground/5 text-foreground/70 uppercase text-xs">
          <tr>
            <th className="px-6 py-3.5 font-semibold">Name</th>
            <th className="px-6 py-3.5 font-semibold">Phone</th>
            <th className="px-6 py-3.5 font-semibold">Role</th>
            <th className="px-6 py-3.5 font-semibold">Active</th>
            <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {entries.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-foreground/50">
                No users found in the system.
              </td>
            </tr>
          ) : (
            entries.map((user) => (
              <tr key={user.id} className={`hover:bg-foreground/[0.02] transition-colors relative ${editingId === user.id ? 'z-20' : 'z-0'}`}>
                <td className="px-6 py-3.5 font-medium flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center uppercase font-bold text-sm">
                    {user.name ? user.name.substring(0, 2) : "U"}
                  </div>
                  <span className="text-sm">{user.name || "Unknown User"}</span>
                </td>
                <td className="px-6 py-3.5 text-foreground/70 font-mono text-xs">
                  {user.phone || "-"}
                </td>
                <td className="px-6 py-3.5">
                  {editingId === user.id ? (
                    <div className="w-[180px]">
                      <SettingsDropdown
                        value={user.role}
                        onChange={(val) => {
                          if (val !== user.role) {
                            onRoleChange(user.id, val);
                          }
                        }}
                        options={roleOptions}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 capitalize font-medium text-foreground/80">
                      {getRoleIcon(user.role)}
                      {user.role}
                    </div>
                  )}
                </td>
                <td className="px-6 py-3.5">
                  <ActiveToggle 
                    isActive={user.is_active !== false} 
                    isEditing={editingId === user.id} 
                    onToggle={() => onActiveToggle(user.id, user.is_active !== false)} 
                  />
                </td>
                <td className="px-6 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {editingId === user.id ? (
                      <button 
                        onClick={onCancelEdit}
                        className="text-xs text-foreground/50 hover:text-foreground font-semibold underline underline-offset-2 transition-colors"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button 
                        onClick={() => onEdit(user.id)}
                        className="text-xs text-primary hover:bg-primary hover:text-primary-foreground font-bold bg-primary/10 px-4 py-2 rounded-lg transition-colors"
                      >
                        Change Role
                      </button>
                    )}
                    

                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
