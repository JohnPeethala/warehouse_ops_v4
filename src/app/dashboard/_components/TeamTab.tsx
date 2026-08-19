"use client";

import React, { useState, useEffect } from "react";
import { Truck, AlertCircle, Copy, Download, Loader2 } from "lucide-react";
import { getDriverMatrixData, getGtMatrixData } from "@/app/actions/teamFleet";
import type { DriverMatrixRow, GtMatrixRow } from "@/app/actions/teamFleet";
import { exportFormattedRouteSessions } from "@/app/actions/reports";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export function TeamTab() {
  const [data, setData] = useState<DriverMatrixRow[]>([]);
  const [gtData, setGtData] = useState<GtMatrixRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getExportData = async () => {
    if (!selectedMonth) return null;
    setExporting(true);
    const [y, m] = selectedMonth.split("-");
    const startDate = `${y}-${m}-01`;
    const d = new Date(Number(y), Number(m), 0);
    const endDate = `${y}-${m}-${String(d.getDate()).padStart(2, '0')}`;
    
    try {
      const res = await exportFormattedRouteSessions(startDate, endDate);
      if (!res.success || !res.data) throw new Error(res.error || "Failed to fetch data");
      return res.data;
    } catch (e: any) {
      toast.error(e.message || "Export failed");
      return null;
    } finally {
      setExporting(false);
    }
  };

  const handleCopy = async () => {
    const exportData = await getExportData();
    if (!exportData) return;
    const formattedRows = exportData.rows.map((row: any[]) => 
      row.map(cell => {
        const cellStr = String(cell || "");
        if (cellStr.includes("\t") || cellStr.includes("\n") || cellStr.includes("\"")) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join("\t")
    );
    const tsvContent = [exportData.headers.join("\t"), ...formattedRows].join("\n");
    await navigator.clipboard.writeText(tsvContent);
    toast.success("Copied report data to clipboard!");
  };

  const handleDownload = async () => {
    const exportData = await getExportData();
    if (!exportData) return;
    const worksheet = XLSX.utils.aoa_to_sheet([exportData.headers, ...exportData.rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `Route_Sessions_${selectedMonth}.xlsx`);
    toast.success(`Downloaded Route_Sessions_${selectedMonth}.xlsx`);
  };

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    
    async function fetchData() {
      try {
        const [driverRes, gtRes] = await Promise.all([
          getDriverMatrixData(selectedMonth),
          getGtMatrixData(selectedMonth)
        ]);
        
        if (!mounted) return;
        
        if (driverRes.success && gtRes.success) {
          setData(driverRes.data || []);
          setGtData(gtRes.data || []);
          setError(null);
        } else {
          setError(driverRes.error || gtRes.error || "Failed to load performance data");
        }
      } catch (err: any) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    
    fetchData();

    return () => { mounted = false; };
  }, [selectedMonth]);

  // Generate all days in the selected month
  const monthDaysHeaders: { dateStr: string; label: string; isToday: boolean }[] = [];
  if (selectedMonth) {
    const [y, m] = selectedMonth.split("-");
    const d = new Date(Number(y), Number(m), 0); // last day of month
    let startDay = d.getDate();
    const todayStr = now.toISOString().split("T")[0];
    
    // If selected month is the current month, only show up to yesterday
    if (Number(y) === now.getFullYear() && Number(m) === now.getMonth() + 1) {
      startDay = now.getDate() - 1;
    }
    
    for (let i = startDay; i >= 1; i--) {
      const dateStr = `${y}-${m}-${String(i).padStart(2, '0')}`;
      const loopDate = new Date(Number(y), Number(m) - 1, i);
      const label = loopDate.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });
      monthDaysHeaders.push({ dateStr, label, isToday: dateStr === todayStr });
    }
  }

  const formatMonthLabel = (yyyyMm: string) => {
    const [y, m] = yyyyMm.split("-");
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  };

  const generateMonthOptions = () => {
    const options = [];
    const d = new Date();
    for (let i = 0; i < 12; i++) {
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
      options.push({ value: val, label });
      d.setMonth(d.getMonth() - 1);
    }
    return options;
  };

  const driverTotals = {
    count: data.length,
    daysArrived: data.reduce((acc, r) => acc + r.daysArrived, 0),
    totalTickets: data.reduce((acc, r) => acc + r.totalTickets, 0),
    tasksDone: data.reduce((acc, r) => acc + r.tasksDone, 0),
    notDoneVehDrvr: data.reduce((acc, r) => acc + r.notDoneVehDrvr, 0),
    totalKm: data.reduce((acc, r) => acc + r.totalKm, 0),
  };
  const driverDailyCounts: Record<string, number> = {};
  monthDaysHeaders.forEach(h => {
    driverDailyCounts[h.dateStr] = data.filter(r => r.dailyData[h.dateStr] && r.dailyData[h.dateStr].total > 0).length;
  });

  const gtTotals = {
    count: gtData.length,
    daysArrived: gtData.reduce((acc, r) => acc + r.daysArrived, 0),
    totalTickets: gtData.reduce((acc, r) => acc + r.totalTickets, 0),
    tasksDone: gtData.reduce((acc, r) => acc + r.tasksDone, 0),
    notDoneTotal: gtData.reduce((acc, r) => acc + r.notDoneTotal, 0),
    totalKm: gtData.reduce((acc, r) => acc + r.totalKm, 0),
  };
  const gtDailyCounts: Record<string, { regular: number; adhoc: number }> = {};
  monthDaysHeaders.forEach(h => {
    const activeGts = gtData.filter(r => r.dailyData[h.dateStr] && (r.dailyData[h.dateStr].total > 0 || r.dailyData[h.dateStr].km > 0));
    const regular = activeGts.filter(r => !r.isAdhoc).length;
    const adhoc = activeGts.filter(r => r.isAdhoc).length;
    gtDailyCounts[h.dateStr] = { regular, adhoc };
  });

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-gradient-to-r from-muted/30 to-transparent">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Truck className="text-primary" size={20} />
              Driver Performance Matrix
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Track daily and monthly metrics per driver.</p>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={handleCopy} disabled={exporting} title="Copy Route Sessions" className="bg-background border border-border text-foreground p-2 rounded-lg hover:bg-muted transition-all">
              {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Copy className="w-5 h-5" />}
            </button>
            <button onClick={handleDownload} disabled={exporting} title="Download Route Sessions" className="bg-background border border-border text-foreground p-2 rounded-lg hover:bg-muted transition-all">
              {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            </button>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-background border border-border text-foreground text-sm rounded-lg px-4 py-2 font-medium shadow-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:bg-muted/10 cursor-pointer"
            >
              {generateMonthOptions().map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="p-0 overflow-auto custom-scrollbar relative">
          {loading ? (
            <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
              <p className="font-medium">Syncing telemetry data...</p>
            </div>
          ) : error ? (
            <div className="p-16 text-center text-rose-500 flex flex-col items-center gap-3 min-h-[300px]">
              <AlertCircle size={40} className="text-rose-500/50" />
              <p className="font-medium text-lg">{error}</p>
              <button onClick={() => window.location.reload()} className="mt-2 text-sm text-rose-600 hover:underline">Retry</button>
            </div>
          ) : data.length === 0 ? (
            <div className="p-16 text-center text-muted-foreground min-h-[300px] flex flex-col items-center justify-center">
              <Truck size={40} className="text-muted-foreground/30 mb-4" />
              <p className="text-lg font-medium">No driver data found</p>
              <p className="text-sm">There are no records for {formatMonthLabel(selectedMonth)}.</p>
            </div>
          ) : (
            <div className="flex border-t border-border">
              {/* Left Frozen Pane */}
              <div className="shrink-0 relative z-20 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] bg-card border-r border-border">
                <table className="w-full text-[12px] text-left border-collapse">
                  <thead className="bg-muted/50 h-[36px]">
                    <tr>
                      <th className="px-2 py-1 font-semibold text-foreground border-b border-r border-border min-w-[150px]">Driver</th>
                      <th className="px-1 py-1 min-w-[50px] font-semibold text-center text-foreground border-b border-r border-border" title="Days Arrived">Days</th>
                      <th className="px-1 py-1 min-w-[50px] font-semibold text-center text-foreground border-b border-r border-border" title="Total Tickets">Total</th>
                      <th className="px-1 py-1 min-w-[50px] font-semibold text-center text-emerald-600 dark:text-emerald-500 border-b border-r border-border" title="Done">Done</th>
                      <th className="px-1 py-1 min-w-[50px] font-semibold text-center text-destructive border-b border-r border-border" title="Veh/Drvr ND">ND</th>
                      <th className="px-1 py-1 min-w-[90px] font-semibold text-center text-primary border-b border-border">KM</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card">
                    {data.map((row) => (
                      <tr key={row.driver} className="h-[36px] hover:bg-muted/30">
                        <td className="px-2 py-1 font-medium text-foreground border-b border-r border-border truncate max-w-[150px]">{row.driver}</td>
                        <td className="px-1 py-1 text-center border-b border-r border-border font-medium">{row.daysArrived}</td>
                        <td className="px-1 py-1 text-center border-b border-r border-border font-medium text-muted-foreground">{row.totalTickets}</td>
                        <td className="px-1 py-1 text-center border-b border-r border-border font-semibold text-emerald-600 dark:text-emerald-500">{row.tasksDone}</td>
                        <td className={`px-1 py-1 text-center border-b border-r border-border font-semibold ${row.notDoneVehDrvr > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {row.notDoneVehDrvr > 0 ? row.notDoneVehDrvr : "-"}
                        </td>
                        <td className="px-1 py-1 text-center border-b border-border text-primary font-semibold">{row.totalKm} km</td>
                      </tr>
                    ))}
                    {data.length > 0 && (
                      <tr className="bg-muted/30 font-bold sticky bottom-0 z-10 border-t-2 border-border shadow-[0_-2px_4px_rgba(0,0,0,0.02)]">
                        <td className="px-3 py-2 border-r border-border text-left">Totals ({driverTotals.count} Drivers)</td>
                        <td className="px-1 py-2 text-center border-r border-border">{driverTotals.daysArrived}</td>
                        <td className="px-1 py-2 text-center border-r border-border">{driverTotals.totalTickets}</td>
                        <td className="px-1 py-2 text-center border-r border-border text-emerald-600 dark:text-emerald-500">{driverTotals.tasksDone}</td>
                        <td className={`px-1 py-2 text-center border-r border-border ${driverTotals.notDoneVehDrvr > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{driverTotals.notDoneVehDrvr}</td>
                        <td className="px-1 py-2 text-center border-border text-primary">{driverTotals.totalKm} km</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Right Scrollable Pane */}
              <div className="overflow-x-auto flex-1 custom-scrollbar pb-2">
                <table className="w-full text-[12px] text-left border-collapse bg-card">
                  <thead className="bg-muted/50 h-[36px]">
                    <tr>
                      {monthDaysHeaders.map(h => (
                        <th key={h.dateStr} className={`px-2 py-1 font-semibold text-center border-b border-r border-border min-w-[100px] ${h.isToday ? 'bg-primary/10 text-primary' : 'text-foreground'}`}>
                          <span className="whitespace-nowrap">{h.label}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-card">
                    {data.map((row) => (
                      <tr key={row.driver} className="h-[36px] hover:bg-muted/30 transition-none">
                        {monthDaysHeaders.map(h => {
                          const stats = row.dailyData[h.dateStr];
                          if (!stats || (stats.total === 0 && stats.km === 0)) {
                            return <td key={h.dateStr} className={`px-2 py-1 text-center border-b border-r border-border text-muted-foreground/30 ${h.isToday ? 'bg-primary/5' : ''}`}>-</td>;
                          }
                          
                          const hoverNamesStr = stats.hoverNames.length > 0 ? `\nGT: ${stats.hoverNames.join(', ')}` : '\nNo GT assigned';
                          const hoverText = `Total: ${stats.total}\nDone: ${stats.done}\nNot Done: ${stats.nd}\nKM: ${stats.km}${hoverNamesStr}`;
                          const hasND = stats.nd > 0;
                          const isHighKM = Number(stats.km) > 100;
                          
                          return (
                            <td 
                              key={h.dateStr} 
                              title={hoverText}
                              className={`relative px-2 py-1 text-center border-b border-r border-border cursor-help transition-colors
                                ${isHighKM ? 'bg-destructive/10 hover:bg-destructive/20' : (h.isToday ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50')}
                              `}
                            >
                              <div className="flex items-center justify-center text-[12px] font-semibold">
                                <span className={isHighKM ? 'text-destructive' : 'text-foreground'}>{stats.km} km</span>
                                {hasND && (
                                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 shadow-sm" />
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {data.length > 0 && (
                      <tr className="bg-muted/30 font-bold sticky bottom-0 z-10 border-t-2 border-border shadow-[0_-2px_4px_rgba(0,0,0,0.02)]">
                        {monthDaysHeaders.map(h => (
                          <td key={`total-${h.dateStr}`} className="px-1 py-2 text-center border-r border-border text-foreground">
                            {driverDailyCounts[h.dateStr] > 0 ? `${driverDailyCounts[h.dateStr]} v` : '-'}
                          </td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col mt-6">
        <div className="p-4 border-b border-border flex justify-between items-center bg-gradient-to-r from-muted/30 to-transparent">
          <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
            <Truck className="text-primary" size={20} />
            Ground Team Performance Matrix
          </h2>
        </div>
        
        <div className="p-0 overflow-auto custom-scrollbar relative">
          {loading ? (
            <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
              <p className="font-medium">Syncing GT telemetry data...</p>
            </div>
          ) : error ? (
            <div className="p-16 text-center text-rose-500 flex flex-col items-center gap-3 min-h-[300px]">
              <AlertCircle size={40} className="text-rose-500/50" />
              <p className="font-medium text-lg">{error}</p>
            </div>
          ) : gtData.length === 0 ? (
            <div className="p-16 text-center text-muted-foreground min-h-[300px] flex flex-col items-center justify-center">
              <Truck size={40} className="text-muted-foreground/30 mb-4" />
              <p className="text-lg font-medium">No GT data found</p>
              <p className="text-sm">There are no records for {formatMonthLabel(selectedMonth)}.</p>
            </div>
          ) : (
            <div className="flex border-t border-border">
              {/* Left Frozen Pane */}
              <div className="shrink-0 relative z-20 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] bg-card border-r border-border">
                <table className="w-full text-[12px] text-left border-collapse">
                  <thead className="bg-muted/50 h-[36px]">
                    <tr>
                      <th className="px-2 py-1 font-semibold text-foreground border-b border-r border-border min-w-[150px]">Ground Team</th>
                      <th className="px-1 py-1 min-w-[50px] font-semibold text-center text-foreground border-b border-r border-border" title="Days Arrived">Days</th>
                      <th className="px-1 py-1 min-w-[50px] font-semibold text-center text-foreground border-b border-r border-border" title="Total Tickets">Total</th>
                      <th className="px-1 py-1 min-w-[50px] font-semibold text-center text-emerald-600 dark:text-emerald-500 border-b border-r border-border" title="Done">Done</th>
                      <th className="px-1 py-1 min-w-[50px] font-semibold text-center text-destructive border-b border-r border-border" title="Total ND">ND</th>
                      <th className="px-1 py-1 min-w-[90px] font-semibold text-center text-primary border-b border-border">KM</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card">
                    {gtData.map((row) => (
                      <tr key={row.gtName} className="h-[36px] hover:bg-muted/30">
                        <td className={`px-2 py-1 font-medium text-foreground border-b border-r border-border truncate max-w-[150px] ${row.isAdhoc ? 'bg-blue-500/10' : ''}`}>
                          {row.gtName}
                        </td>
                        <td className={`px-1 py-1 text-center border-b border-r border-border font-medium ${row.isAdhoc ? 'bg-blue-500/10' : ''}`}>{row.daysArrived}</td>
                        <td className={`px-1 py-1 text-center border-b border-r border-border font-medium text-muted-foreground ${row.isAdhoc ? 'bg-blue-500/10' : ''}`}>{row.totalTickets}</td>
                        <td className={`px-1 py-1 text-center border-b border-r border-border font-semibold text-emerald-600 dark:text-emerald-500 ${row.isAdhoc ? 'bg-blue-500/10' : ''}`}>{row.tasksDone}</td>
                        <td className={`px-1 py-1 text-center border-b border-r border-border font-semibold ${row.notDoneTotal > 0 ? 'text-destructive' : 'text-muted-foreground'} ${row.isAdhoc ? 'bg-blue-500/10' : ''}`}>
                          {row.notDoneTotal > 0 ? row.notDoneTotal : "-"}
                        </td>
                        <td className={`px-1 py-1 text-center border-b border-border font-semibold text-primary ${row.isAdhoc ? 'bg-blue-500/10' : ''}`}>{row.totalKm} km</td>
                      </tr>
                    ))}
                    {gtData.length > 0 && (
                      <tr className="bg-muted/30 font-bold sticky bottom-0 z-10 border-t-2 border-border shadow-[0_-2px_4px_rgba(0,0,0,0.02)]">
                        <td className="px-3 py-2 border-r border-border text-left">Totals ({gtTotals.count} Teams)</td>
                        <td className="px-1 py-2 text-center border-r border-border">{gtTotals.daysArrived}</td>
                        <td className="px-1 py-2 text-center border-r border-border">{gtTotals.totalTickets}</td>
                        <td className="px-1 py-2 text-center border-r border-border text-emerald-600 dark:text-emerald-500">{gtTotals.tasksDone}</td>
                        <td className={`px-1 py-2 text-center border-r border-border ${gtTotals.notDoneTotal > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{gtTotals.notDoneTotal}</td>
                        <td className="px-1 py-2 text-center border-border text-primary">{gtTotals.totalKm} km</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Right Scrollable Pane */}
              <div className="overflow-x-auto flex-1 custom-scrollbar pb-2">
                <table className="w-full text-[12px] text-left border-collapse bg-card">
                  <thead className="bg-muted/50 h-[36px]">
                    <tr>
                      {monthDaysHeaders.map(h => (
                        <th key={h.dateStr} className={`px-2 py-1 font-semibold text-center border-b border-r border-border min-w-[100px] ${h.isToday ? 'bg-primary/10 text-primary' : 'text-foreground'}`}>
                          <span className="whitespace-nowrap">{h.label}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-card">
                    {gtData.map((row) => (
                      <tr key={row.gtName} className="h-[36px] hover:bg-muted/30 transition-none">
                        {monthDaysHeaders.map(h => {
                          const stats = row.dailyData[h.dateStr];
                          if (!stats || (stats.total === 0 && stats.km === 0)) {
                            return <td key={h.dateStr} className={`px-2 py-1 text-center border-b border-r border-border text-muted-foreground/30 ${h.isToday ? 'bg-primary/5' : ''}`}>-</td>;
                          }
                          
                          const hoverNamesStr = stats.hoverNames.length > 0 ? `\nDriver: ${stats.hoverNames.join(', ')}` : '\nNo driver assigned';
                          const hoverText = `Total: ${stats.total}\nDone: ${stats.done}\nNot Done: ${stats.nd}\nKM: ${stats.km}${hoverNamesStr}`;
                          const isHighKM = stats.km > 85;
                          const hasND = stats.nd > 0;
                          const bgClass = isHighKM ? 'bg-destructive/10 hover:bg-destructive/20' : (h.isToday ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50');
                            
                          return (
                            <td 
                              key={h.dateStr} 
                              title={hoverText}
                              className={`relative px-2 py-1 text-center border-b border-r border-border cursor-help transition-colors
                                ${bgClass}
                              `}
                            >
                              {row.isAdhoc && (
                                <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-blue-500 ring-1 ring-background shadow-sm" />
                              )}
                              {hasND && (
                                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 ring-1 ring-background shadow-sm" />
                              )}
                              <div className="flex flex-col items-center justify-center text-[11px] leading-tight">
                                <div className="font-semibold mb-0.5">
                                  <span className="text-emerald-600 dark:text-emerald-500">{stats.done}</span>
                                  <span className="text-muted-foreground mx-0.5">/</span>
                                  <span className="text-destructive">{stats.nd}</span>
                                </div>
                                <span className={isHighKM ? 'text-destructive font-semibold text-[10px]' : 'text-muted-foreground text-[10px]'}>
                                  {stats.km} km
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {gtData.length > 0 && (
                      <tr className="bg-muted/30 font-bold sticky bottom-0 z-10 border-t-2 border-border shadow-[0_-2px_4px_rgba(0,0,0,0.02)]">
                          {monthDaysHeaders.map(h => {
                            const counts = gtDailyCounts[h.dateStr];
                            const showPipe = counts && counts.adhoc > 0;
                            const totalBgClass = showPipe ? 'bg-blue-500/10' : '';
                            
                            return (
                              <td key={`total-gt-${h.dateStr}`} className={`px-1 py-2 text-center border-r border-border text-foreground text-[11px] ${totalBgClass}`}>
                                {(counts && (counts.regular > 0 || counts.adhoc > 0)) ? (
                                  <div className="flex items-center justify-center gap-1 opacity-80">
                                    <span>{counts.regular}</span>
                                    {showPipe && (
                                      <>
                                        <span className="text-muted-foreground/50">|</span>
                                        <span className="text-blue-600 dark:text-blue-500">{counts.adhoc}</span>
                                      </>
                                    )}
                                  </div>
                                ) : '-'}
                              </td>
                            );
                          })}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
