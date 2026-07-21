"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar as CalendarIcon, Loader2, Send } from "lucide-react";
import { pushToDispatchLog, getSchedulePushBreakdown } from "@/app/actions/dispatch";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { CountDatePicker } from "./CountDatePicker";

type BreakdownItem = {
  subCategory: string;
  count: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function PushToScheduleModal({ isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [pushing, setPushing] = useState(false);
  const [pushCount, setPushCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to tomorrow
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (isOpen) {
      loadBreakdown();
    }
  }, [isOpen]);

  const loadBreakdown = async () => {
    setLoading(true);
    try {
      const pushRes = await getSchedulePushBreakdown();
      if (pushRes.success && pushRes.data) {
        setPushCount(pushRes.data.reduce((acc: number, curr: BreakdownItem) => acc + curr.count, 0));
      } else {
        toast.error(pushRes.error || "Failed to load push count");
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePush = async () => {
    if (pushCount === 0) {
      toast.error("No 's' tagged tickets to push.");
      return;
    }
    
    setPushing(true);
    try {
      const res = await pushToDispatchLog(selectedDate);
      if (res.success) {
        toast.success(`Successfully pushed ${res.count} tickets to schedule for ${selectedDate}`);
        onClose();
      } else {
        toast.error(res.error || "Failed to push to schedule");
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred while pushing");
    } finally {
      setPushing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div 
        className="bg-card w-[420px] rounded-xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Push to Schedule</h2>
            <p className="text-sm text-muted-foreground">Select a date to schedule 's' tagged tickets</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-5">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Checking tickets...</span>
            </div>
          ) : pushCount === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-muted-foreground">
              <p>No active tickets found with the 's' tag.</p>
              <p className="text-sm mt-1 opacity-70">Tag tickets with 's' to schedule them.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Tickets to Schedule:</span>
                <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{pushCount}</span>
              </div>

              {/* Date Picker */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Selected Date</label>
                <CountDatePicker 
                  value={selectedDate} 
                  onChange={(val) => setSelectedDate(val)} 
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border/50 bg-muted/20 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePush}
            disabled={loading || pushing || pushCount === 0 || !selectedDate}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {pushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Confirm Push
          </button>
        </div>
      </div>
    </div>
  );
}
