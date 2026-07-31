"use client";

import React, { useState, useEffect } from "react";
import { getRosterData, addGTMaster, toggleGTMasterActive, updateRosterEntry, dispatchGT } from "@/app/actions/roster";
import { Loader2, Plus, ArrowRight, CheckCircle2, UserX, Users } from "lucide-react";
import { toast } from "sonner";
import { format, subDays, addDays } from "date-fns";
import classNames from "classnames";

export function RosterView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [masterList, setMasterList] = useState<any[]>([]);
  const [rosterData, setRosterData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newGTName, setNewGTName] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    // Load last 7 days of data for the matrix
    const end = format(currentDate, "yyyy-MM-dd");
    const start = format(subDays(currentDate, 6), "yyyy-MM-dd");
    
    const { master, roster } = await getRosterData(start, end);
    console.log("Loaded Roster Data:", { master, roster });
    setMasterList(master);
    setRosterData(roster);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const handleAddGT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGTName.trim()) return;
    
    const res = await addGTMaster(newGTName.trim());
    if (res.success) {
      setNewGTName("");
      toast.success("GT added to master list");
      loadData();
    } else {
      toast.error(res.error || "Failed to add GT");
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    const res = await toggleGTMasterActive(id, !current);
    if (res.success) loadData();
  };

  const handleUpdateStatus = async (date: string, gtId: string, updates: any) => {
    const res = await updateRosterEntry(date, gtId, updates);
    if (res.success) loadData();
    else toast.error("Update failed");
  };

  const handleDispatch = async (gtId: string) => {
    const dateStr = format(currentDate, "yyyy-MM-dd");
    const res = await dispatchGT(dateStr, gtId);
    if (res.success) loadData();
    else toast.error("Dispatch failed");
  };

  const todayStr = format(currentDate, "yyyy-MM-dd");

  // Get active GTs for today's dispatch board
  const activeGTsForToday = masterList.filter(gt => gt.is_active).map(gt => {
    const log = rosterData.find(r => r.gt_id === gt.id && r.date === todayStr);
    return {
      ...gt,
      attendance: log?.attendance || null,
      duty: log?.duty || null,
      delivery_count: log?.delivery_count || 0,
      last_dispatched_at: log?.last_dispatched_at || null,
    };
  });

  const presentWaiting = activeGTsForToday.filter(gt => gt.attendance === 'Present' && (gt.duty === 'Waiting' || gt.duty === 'WH Duty'));
  const presentDelivery = activeGTsForToday.filter(gt => gt.attendance === 'Present' && gt.duty === 'Delivery');

  // Sort logic for best choice: lowest delivery count first, then oldest last_dispatched_at
  presentWaiting.sort((a, b) => {
    if (a.delivery_count !== b.delivery_count) {
      return a.delivery_count - b.delivery_count;
    }
    if (!a.last_dispatched_at) return -1;
    if (!b.last_dispatched_at) return 1;
    return new Date(a.last_dispatched_at).getTime() - new Date(b.last_dispatched_at).getTime();
  });

  const dates = Array.from({ length: 7 }, (_, i) => format(subDays(currentDate, i), "yyyy-MM-dd"));

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">GT Roster</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentDate(subDays(currentDate, 1))} className="px-3 py-1 bg-secondary rounded hover:bg-secondary/80">Prev</button>
          <span className="font-medium text-lg">{format(currentDate, "MMM dd, yyyy")}</span>
          <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="px-3 py-1 bg-secondary rounded hover:bg-secondary/80">Next</button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* SECTION A: DISPATCH BOARD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Waiting & WH Duty
              </h2>
              <div className="space-y-3">
                {presentWaiting.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No one is waiting.</p>
                ) : (
                  presentWaiting.map((gt, idx) => (
                    <div key={gt.id} className={classNames(
                      "flex items-center justify-between p-3 rounded-lg border transition-all",
                      idx === 0 ? "border-emerald-500/50 bg-emerald-500/10 shadow-sm" : "bg-background"
                    )}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{gt.gt_name}</span>
                          {idx === 0 && <span className="text-[10px] uppercase font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded">Best Choice</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Duty: {gt.duty || 'Waiting'} | Runs: {gt.delivery_count}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {gt.duty !== 'WH Duty' && (
                          <button 
                            onClick={() => handleUpdateStatus(todayStr, gt.id, { duty: 'WH Duty', attendance: 'Present' })}
                            className="text-xs px-2 py-1 bg-secondary hover:bg-secondary/80 rounded"
                          >
                            WH Duty
                          </button>
                        )}
                        <button 
                          onClick={() => handleDispatch(gt.id)}
                          className="text-xs px-3 py-1 bg-primary text-primary-foreground hover:opacity-90 rounded font-medium flex items-center gap-1"
                        >
                          Dispatch <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-card border rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-blue-500" />
                Out on Delivery
              </h2>
              <div className="space-y-3">
                {presentDelivery.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No one is currently out.</p>
                ) : (
                  presentDelivery.map((gt) => (
                    <div key={gt.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                      <div>
                        <div className="font-medium">{gt.gt_name}</div>
                        <div className="text-xs text-muted-foreground mt-1">Runs today: {gt.delivery_count}</div>
                      </div>
                      <button 
                        onClick={() => handleUpdateStatus(todayStr, gt.id, { duty: 'Waiting' })}
                        className="text-xs px-3 py-1 bg-secondary hover:bg-secondary/80 rounded"
                      >
                        Return to WH
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* SECTION B: ATTENDANCE MATRIX */}
          <div className="w-full flex-1 flex flex-col bg-card/60 backdrop-blur-xl border border-border shadow-sm rounded-xl overflow-hidden min-h-0 mt-4">
            <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/20 shrink-0">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Attendance Matrix</h2>
              <form onSubmit={handleAddGT} className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="New GT Name..."
                  value={newGTName}
                  onChange={(e) => setNewGTName(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-md border bg-background/50 focus:outline-none focus:ring-1 focus:ring-primary/20 w-48"
                />
                <button type="submit" className="bg-primary text-primary-foreground p-1.5 rounded-md hover:opacity-90">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
            
            <div className="overflow-y-scroll overflow-x-auto flex-1 custom-scrollbar">
              <table className="w-full text-left text-sm border-collapse table-fixed min-w-[800px]">
                <thead className="sticky top-0 bg-secondary/50 backdrop-blur-md z-10 text-xs font-semibold text-muted-foreground uppercase tracking-wider shadow-sm">
                  <tr className="border-b border-border/50">
                    <th className="p-3 w-48 truncate">GT Name</th>
                    {dates.map(d => (
                      <th key={d} className={classNames("p-3 w-32 truncate", d === todayStr ? "text-primary" : "")}>
                        {d === todayStr ? "Today" : format(new Date(d), "MMM dd")}
                      </th>
                    ))}
                    <th className="p-3 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {masterList.filter(gt => gt.is_active).map(gt => (
                    <tr key={gt.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="p-3 font-medium truncate text-foreground/90">
                        {gt.gt_name}
                      </td>
                      {dates.map(d => {
                        const log = rosterData.find(r => r.gt_id === gt.id && r.date === d);
                        const isPresent = log?.attendance === 'Present';
                        const isAbsent = log?.attendance === 'Absent';
                        return (
                          <td key={d} className="p-2">
                            <select 
                              value={log?.attendance || ""}
                              onChange={(e) => handleUpdateStatus(d, gt.id, { attendance: e.target.value })}
                              className={classNames(
                                "text-xs rounded-md px-2 py-1.5 border focus:outline-none w-full transition-colors cursor-pointer",
                                isPresent ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-medium" :
                                isAbsent ? "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400 font-medium" :
                                "bg-background/50 border-border/50 text-muted-foreground hover:bg-background"
                              )}
                            >
                              <option value="">-</option>
                              <option value="Present">Present</option>
                              <option value="Absent">Absent</option>
                            </select>
                          </td>
                        );
                      })}
                      <td className="p-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleToggleActive(gt.id, gt.is_active)}
                          className="text-muted-foreground hover:text-rose-500 p-1 rounded hover:bg-rose-500/10 transition-colors"
                          title="Mark Inactive"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {masterList.filter(gt => gt.is_active).length === 0 && (
                    <tr>
                      <td colSpan={dates.length + 2} className="p-12 text-center">
                         <div className="flex flex-col items-center justify-center text-muted-foreground">
                           <Users className="w-10 h-10 mb-3 opacity-20" />
                           <p className="text-sm">No active GTs found. Add one above.</p>
                         </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
