import React from "react";
import { Check, X, Edit2, Trash2 } from "lucide-react";

interface SettingsActionButtonsProps {
  isEditing: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  isSaving?: boolean;
  saveLabel?: string;
}

export function SettingsActionButtons({
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  isSaving,
  saveLabel
}: SettingsActionButtonsProps) {
  if (isEditing) {
    // Some pages use a textual "Cancel" / "Save" vs icons. We'll support both via props.
    if (saveLabel) {
      return (
        <div className="flex items-center justify-end gap-3">
          <button 
            onClick={onCancel}
            className="text-xs text-foreground/50 hover:text-foreground font-semibold underline underline-offset-2 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onSave}
            disabled={isSaving}
            className="text-xs text-primary hover:bg-primary hover:text-primary-foreground font-bold bg-primary/10 px-4 py-2 rounded-lg transition-colors"
          >
            {saveLabel}
          </button>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-end gap-2">
        {onSave && (
          <button onClick={onSave} disabled={isSaving} className="p-1.5 bg-green-500/10 text-green-600 rounded-md hover:bg-green-500/20 transition-colors">
            <Check size={16} />
          </button>
        )}
        {onCancel && (
          <button onClick={onCancel} className="p-1.5 bg-foreground/5 text-foreground/70 rounded-md hover:bg-foreground/10 transition-colors">
            <X size={16} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-3">
      {onEdit && (
        <button onClick={onEdit} className="text-foreground/50 hover:text-primary transition-colors">
          <Edit2 size={16} />
        </button>
      )}
      {onDelete && (
        <button 
          onClick={onDelete} 
          disabled={isSaving}
          className="text-foreground/50 hover:text-red-500 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}
