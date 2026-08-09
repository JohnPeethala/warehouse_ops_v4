import React, { useState, useRef, useEffect } from 'react';
import { X, FileBarChart2, Camera, Loader2, Check, AlertTriangle, List, Truck } from 'lucide-react';
import { toBlob } from 'html-to-image';
import { getCategoryDetails } from "@/lib/categoryUtils";

interface ProgressSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  tickets: any[]; // The tickets currently filtered for the day
  vehicles: any[];
  profiles: any[];
  subCategories: any[];
}

export function ProgressSummaryModal({ isOpen, onClose, date, tickets, vehicles, profiles, subCategories }: ProgressSummaryModalProps) {
  const [isCopyingProgress, setIsCopyingProgress] = useState(false);
  const [copyProgressSuccess, setCopyProgressSuccess] = useState(false);
  const [isCopyingIssues, setIsCopyingIssues] = useState(false);
  const [copyIssuesSuccess, setCopyIssuesSuccess] = useState(false);
  
  // Toggle: 'flat' for All Not Done tickets | 'vendor' for Escalations
  const [issueView, setIssueView] = useState<'flat' | 'vendor'>('flat');
  
  const progressRef = useRef<HTMLDivElement>(null);
  const issuesRef = useRef<HTMLDivElement>(null);

  // --- PROGRESS MATRIX LOGIC ---
  const baseTotalTickets = tickets.length;
  const matrix: Record<string, { total: number; delivered: number; notDone: number }> = {};
  
  let totalDelivered = 0;
  let totalPending = 0;
  let totalIssues = 0;

  tickets.forEach(t => {
    const sub = t.sub_category || "Other";
    const s = t.status || "Pending";
    
    if (!matrix[sub]) {
      matrix[sub] = { total: 0, delivered: 0, notDone: 0 };
    }
    
    matrix[sub].total++;
    
    if (s === 'Done') {
      matrix[sub].delivered++;
      totalDelivered++;
    } else if (s === 'Pending') {
      totalPending++;
    } else {
      matrix[sub].notDone++;
      totalIssues++;
    }
  });

  const completionRate = baseTotalTickets > 0 ? Math.round((totalDelivered / baseTotalTickets) * 100) : 0;
  const uniqueVehicles = new Set(tickets.map(t => t.ops_route_sessions?.vehicle_id).filter(Boolean)).size;
  const tasksPerVehicle = uniqueVehicles > 0 ? (totalDelivered / uniqueVehicles).toFixed(1) : '0.0';

  const sortedMatrix = Object.entries(matrix).sort((a, b) => {
    const aName = a[0].toLowerCase();
    const bName = b[0].toLowerCase();
    const getRank = (name: string) => {
      if (name.includes('delivery')) return 1;
      if (name.includes('pickup')) return 2;
      return 3;
    };
    const rankDiff = getRank(aName) - getRank(bName);
    if (rankDiff !== 0) return rankDiff;
    return b[1].total - a[1].total; // sort by total descending for rest
  });

  // --- ISSUES LOGIC ---
  const notDoneTickets = tickets.filter(t => t.status === 'Not Done');
  const baseTotalNotDone = notDoneTickets.length;
  
  const notDoneOpsBreakdown: Record<string, number> = {};
  notDoneTickets.forEach(t => {
    const cat = t.sub_category || 'Unknown';
    notDoneOpsBreakdown[cat] = (notDoneOpsBreakdown[cat] || 0) + 1;
  });
  const sortedNotDoneOpsBreakdown = Object.entries(notDoneOpsBreakdown).sort((a, b) => b[1] - a[1]);
  
  const driverVehicleIssues = notDoneTickets.filter(t => 
    t.sub_status === 'Driver Refused' || t.sub_status === 'Vehicle Issue'
  );

  const vendorGroups = driverVehicleIssues.reduce((acc, t) => {
    const session = t.ops_route_sessions || {};
    const vehicle = vehicles.find(v => v.id === session.vehicle_id);
    const driverName = session.adhoc_vehicle ? session.adhoc_vehicle : (vehicle ? vehicle.driver_name : 'Unassigned Driver');
    const vehicleNo = session.adhoc_vehicle ? 'Temp Vehicle' : (vehicle ? vehicle.vehicle_no : 'Unknown Vehicle');
    
    // stable key
    const key = session.adhoc_vehicle ? `adhoc-${session.adhoc_vehicle}` : `${session.vehicle_id || 'no-veh'}`;
    
    if (!acc[key]) {
      acc[key] = {
        driverName,
        vehicleNo,
        tickets: []
      };
    }
    acc[key].tickets.push(t);
    return acc;
  }, {} as Record<string, { driverName: string, vehicleNo: string, tickets: any[] }>);

  const sortedVendorGroups = Object.values(vendorGroups).sort((a, b) => a.driverName.localeCompare(b.driverName));

  const formattedDate = date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No Date Selected';

  const copyContainer = async (
    ref: React.RefObject<HTMLDivElement | null>, 
    setLoading: (v: boolean) => void, 
    setSuccess: (v: boolean) => void
  ) => {
    if (!ref.current) return;
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 200)); // wait for active styles
      
      const blob = await toBlob(ref.current, {
        backgroundColor: '#1e293b', 
        style: { margin: '0' },
        pixelRatio: 2 
      });
      
      if (blob) {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy image', err);
      alert('Failed to generate image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-[1100px] rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-4 text-primary font-semibold">
            <div className="flex items-center gap-2">
              <FileBarChart2 size={18} />
              <span>Dashboard Reports</span>
            </div>
            
            <div className="h-4 w-px bg-border hidden sm:block"></div>
            
            <div className="flex bg-muted rounded-md border border-border p-0.5">
              <button
                onClick={() => setIssueView('flat')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-sm transition-colors ${issueView === 'flat' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <List size={14} /> Flat List
              </button>
              <button
                onClick={() => setIssueView('vendor')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-sm transition-colors ${issueView === 'vendor' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Truck size={14} /> Vendor Escalations
              </button>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content (Side by Side) */}
        <div className="p-6 overflow-y-auto shrink-0 bg-background flex flex-col lg:flex-row items-start justify-center gap-8">
          
          {/* ================= LEFT PANEL: PROGRESS ================= */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold uppercase tracking-widest text-muted-foreground text-xs">Progress Summary</h3>
              <button 
                onClick={() => copyContainer(progressRef, setIsCopyingProgress, setCopyProgressSuccess)}
                disabled={isCopyingProgress}
                className={`flex items-center gap-1.5 px-3 py-1.5 font-bold text-xs uppercase tracking-widest rounded-md transition-all shadow-sm ${copyProgressSuccess ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-primary text-primary-foreground hover:bg-primary/90'} disabled:opacity-70`}
              >
                {isCopyingProgress ? <Loader2 size={14} className="animate-spin" /> : (copyProgressSuccess ? <Check size={14} /> : <Camera size={14} />)}
                {copyProgressSuccess ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div 
              ref={progressRef} 
              className="flex flex-col font-sans border border-gray-300 bg-[#1e293b] w-[420px]"
            >
              {/* Warning Alert if Pending exists */}
              {totalPending > 0 && (
                <div className="bg-red-50 text-red-700 px-6 py-2 border-b border-red-200 flex items-center gap-2 justify-center">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {totalPending} Ticket{totalPending !== 1 ? 's' : ''} Still Pending
                  </span>
                </div>
              )}

              {/* PROGRESS REPORT HEADER */}
              <div className="bg-gray-50 px-6 py-5 border-b border-gray-200 flex justify-between items-center text-[#111827]">
                  <div className="flex flex-col gap-1 w-full max-w-[260px]">
                    <h2 className="text-xl font-extrabold tracking-tight text-gray-900 m-0">CITYFURNISH HYD</h2>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 m-0">TASK SUMMARY</h3>
                  </div>
                <p className="text-xs font-semibold text-gray-500 m-0 uppercase tracking-widest whitespace-nowrap ml-4">{formattedDate}</p>
              </div>

              {/* PROGRESS MAIN BODY */}
              <div className="bg-white px-6 py-5 space-y-6 text-[#111827]">
                <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase tracking-wider font-extrabold text-gray-500">
                      <tr>
                        <th className="px-3 py-2.5">Category</th>
                        <th className="px-2 py-2.5 text-center text-gray-900">Total</th>
                        <th className="px-2 py-2.5 text-center text-green-600">Done</th>
                        <th className="px-2 py-2.5 text-center text-red-600">Not Done</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedMatrix.map(([cat, stats]) => (
                          <tr key={cat} className="border-b border-gray-100 last:border-b-0">
                            <td className="px-3 py-2.5 font-bold text-gray-700 truncate max-w-[120px]" title={cat}>{cat}</td>
                            <td className="px-2 py-2.5 text-center bg-gray-50/50">
                              <span className="font-black text-gray-900">{stats.total}</span>
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              <span className="font-bold text-green-600">{stats.delivered}</span>
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              <span className="font-bold text-red-600">{stats.notDone}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-100 border-t-2 border-gray-200">
                        <tr>
                          <td className="px-3 py-3 text-gray-900 font-black tracking-widest text-xs">TOTAL</td>
                          <td className="px-2 py-3 text-center">
                            <span className="text-gray-900 font-black text-lg leading-none">{baseTotalTickets}</span>
                          </td>
                          <td className="px-2 py-3 text-center">
                            <span className="text-green-600 font-black text-lg leading-none">{totalDelivered}</span>
                          </td>
                          <td className="px-2 py-3 text-center">
                            <span className="text-red-600 font-black text-lg leading-none">{totalIssues}</span>
                          </td>
                        </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* PROGRESS FOOTER */}
              <div className="bg-[#1e293b] text-white px-6 py-5 flex justify-between items-center">
                <div>
                  <span className="block text-xs text-gray-300 font-bold uppercase tracking-widest">Completion Rate</span>
                  <span className="block text-3xl font-black text-green-400 leading-none mt-1">{completionRate}%</span>
                </div>
                <div className="text-right">
                  <span className="block text-xs text-gray-300 font-bold uppercase tracking-widest">Done / Vehicle</span>
                  <span className="block text-3xl font-black text-blue-400 leading-none mt-1">{tasksPerVehicle}</span>
                </div>
              </div>
            </div>
          </div>


          {/* ================= RIGHT PANEL: ISSUES ================= */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold uppercase tracking-widest text-muted-foreground text-xs">{issueView === 'flat' ? 'Not Done List' : 'Vendor Escalations'}</h3>
              <button 
                onClick={() => copyContainer(issuesRef, setIsCopyingIssues, setCopyIssuesSuccess)}
                disabled={isCopyingIssues || notDoneTickets.length === 0}
                className={`flex items-center gap-1.5 px-3 py-1.5 font-bold text-xs uppercase tracking-widest rounded-md transition-all shadow-sm ${copyIssuesSuccess ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-primary text-primary-foreground hover:bg-primary/90'} disabled:opacity-70`}
              >
                {isCopyingIssues ? <Loader2 size={14} className="animate-spin" /> : (copyIssuesSuccess ? <Check size={14} /> : <Camera size={14} />)}
                {copyIssuesSuccess ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div 
              ref={issuesRef} 
              className={`flex flex-col font-sans border border-gray-300 bg-[#1e293b] ${issueView === 'vendor' ? 'w-[480px]' : 'w-[420px]'}`}
            >
              {/* NOT DONE HEADER */}
              <div className="bg-gray-50 px-6 py-5 border-b border-gray-200 flex justify-between items-center text-[#111827]">
                  <div className="flex flex-col gap-1 w-full max-w-[260px]">
                    <h2 className="text-xl font-extrabold tracking-tight text-gray-900 m-0">CITYFURNISH HYD</h2>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 m-0">NOT DONE SUMMARY</h3>
                  </div>
                <p className="text-xs font-semibold text-gray-500 m-0 uppercase tracking-widest whitespace-nowrap ml-4">{formattedDate}</p>
              </div>

              {/* NOT DONE MAIN BODY */}
              <div className="bg-white px-6 py-5 text-[#111827]">
                {(issueView === 'vendor' ? sortedVendorGroups.length : baseTotalNotDone) === 0 ? (
                  <div className="text-center py-6 text-gray-500 font-medium italic">
                    {issueView === 'vendor' ? 'No driver or vehicle not done reported.' : 'No not done tickets today. Great job!'}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {issueView === 'flat' ? (
                      <div className="space-y-4">
                        {sortedNotDoneOpsBreakdown.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {sortedNotDoneOpsBreakdown.map(([cat, count]) => {
                              const { Icon, color } = getCategoryDetails(cat, subCategories);
                              
                              return (
                                <div key={cat} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border shadow-sm border-gray-200 bg-gray-50">
                                  <Icon size={12} className="shrink-0" style={{ color }} />
                                  <span className="font-bold uppercase tracking-widest text-[10px] text-gray-700">{cat}</span>
                                  <span className="font-black text-sm ml-1 text-gray-900">{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <div className="overflow-hidden rounded-md border border-gray-200">
                          <table className="w-full text-xs text-left">
                          <thead className="bg-gray-50 border-b border-gray-200 uppercase tracking-wider font-bold text-gray-500">
                            <tr>
                              <th className="px-2 py-2">ID</th>
                              <th className="px-2 py-2">Name</th>
                              <th className="px-2 py-2">Ops</th>
                              <th className="px-2 py-2">Reason</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {notDoneTickets.map((t, idx) => {
                              const isCx = (t.sub_status || '').toLowerCase().includes('cx');
                              return (
                                <tr key={t.id || idx} className="hover:bg-gray-50">
                                  <td className="px-2 py-2 whitespace-nowrap">
                                    <a 
                                      href={`https://desk.zoho.com/agent/cityfurnish1/support/all-modules/search?searchDept=currentDept&searchWord=${t.ticket_id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline hover:text-blue-800 transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {t.ticket_id}
                                    </a>
                                  </td>
                                  <td className="px-2 py-2 font-medium text-gray-800 truncate max-w-[120px]" title={t.contact_name}>{t.contact_name}</td>
                                  <td className="px-2 py-2 text-gray-600">{t.sub_category || '-'}</td>
                                  <td className={`px-2 py-2 font-bold ${isCx ? 'text-blue-600' : 'text-red-600'}`}>{t.sub_status || 'Not Done'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    ) : (
                      sortedVendorGroups.map((group, idx) => (
                        <div key={idx} className="mb-4 last:mb-0 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                          <div className="bg-gray-100 px-3 py-2 border-b border-gray-200 flex justify-between items-center">
                            <div className="font-bold text-xs uppercase tracking-wide text-gray-800">
                              Driver: {group.driverName} <span className="text-gray-500 font-medium normal-case">({group.vehicleNo})</span>
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                              {group.tickets.length} Issues
                            </div>
                          </div>
                          <div className="p-3">
                            <ul className="space-y-2">
                              {group.tickets.map(t => {
                                const isCx = (t.sub_status || '').toLowerCase().includes('cx');
                                const cleanedRemarks = (t.remarks || '')
                                  .replace(/\[.*?\]\s*[-:]?\s*/g, '') // Catch "[Name - Date] -" format
                                  .replace(/<[^>]*>?/gm, '')     // Remove HTML
                                  .replace(/^:\s*/, '')          // Remove stray leading colons
                                  .trim();
                                return (
                                <li key={t.id} className="text-xs flex items-start gap-2">
                                  <span className="font-semibold text-gray-700 w-16 shrink-0">{t.ticket_id}</span>
                                  <span className={`font-bold shrink-0 ${isCx ? 'text-blue-600' : 'text-red-600'}`}>{t.sub_status}</span>
                                  <div className="flex-1 min-w-0 text-right">
                                    <span className="text-gray-900 font-medium break-words">{cleanedRemarks || 'No remarks provided'}</span>
                                  </div>
                                </li>
                                )
                              })}
                            </ul>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* NOT DONE FOOTER */}
              {issueView === 'flat' && (
                <div className="bg-[#1e293b] text-white px-6 py-5 flex justify-between items-center">
                  <span className="block text-xs text-gray-300 font-bold uppercase tracking-widest">Total Not Done</span>
                  <span className="block text-3xl font-black text-red-400 leading-none">{baseTotalNotDone}</span>
                </div>
              )}
              
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
