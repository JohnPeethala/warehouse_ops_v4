import React from "react";

interface ActiveToggleProps {
  isActive: boolean;
  isEditing?: boolean;
  onToggle?: (newVal: boolean) => void;
}

export function ActiveToggle({ isActive, isEditing, onToggle }: ActiveToggleProps) {
  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input 
          type="checkbox" 
          checked={isActive !== false}
          onChange={(e) => onToggle && onToggle(e.target.checked)}
          className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
        />
        <span className="text-xs text-foreground/60 font-semibold uppercase cursor-pointer" onClick={() => onToggle && onToggle(!isActive)}>
          Active
        </span>
      </div>
    );
  }

  return isActive !== false ? (
    <span className="text-emerald-500 font-bold text-xs bg-emerald-50 px-2 py-1 rounded">Active</span>
  ) : (
    <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-1 rounded">Inactive</span>
  );
}
