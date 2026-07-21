"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, ListPlus } from "lucide-react";
import { toast } from "sonner";
import { updateCustomBatchIds, getCustomBatchIds } from "@/app/actions/custom_batch";
import { useRouter } from "next/navigation";

export function UpdateBatchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const router = useRouter();

  // Load existing IDs when modal opens
  useEffect(() => {
    if (isOpen) {
      setFetching(true);
      getCustomBatchIds().then(res => {
        if (res.success && res.data && res.data.ticket_ids) {
          setInputText(res.data.ticket_ids.join("\n"));
        } else {
          setInputText("");
        }
        setFetching(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    
    // Parse the input text: split by newline, comma, or tab
    const rawIds = inputText.split(/[\n,\t]+/);
    
    // Clean, trim, filter out empty strings, and remove duplicates
    const cleanedIds = Array.from(new Set(
      rawIds
        .map(id => id.trim())
        .filter(id => id.length > 0)
    ));

    try {
      const res = await updateCustomBatchIds(cleanedIds);
      if (!res.success) {
        toast.error(res.error || "Failed to update custom batch");
        return;
      }

      toast.success(`Custom batch updated with ${cleanedIds.length} tickets`);
      onClose();
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-lg rounded-xl border border-border shadow-2xl flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <ListPlus className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Update Custom Batch</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Paste a list of Ticket IDs from Excel or a text file. You can separate them using newlines, commas, or tabs. Duplicates and empty lines will be automatically removed.
          </p>
          
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase text-muted-foreground">Ticket IDs</label>
              {fetching && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={fetching}
              className="w-full bg-background border border-border rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-sm h-64 resize-none font-mono placeholder:text-muted-foreground/50"
              placeholder="e.g.&#10;TKT-001&#10;TKT-002&#10;TKT-003"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 bg-muted/20 flex justify-end gap-2 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || fetching}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Batch
          </button>
        </div>
      </div>
    </div>
  );
}
