import React, { useState, useRef, useEffect } from 'react';
import { X, FileBarChart2, Camera, Loader2, Check, AlertTriangle } from 'lucide-react';
import { toBlob } from 'html-to-image';

interface ProgressSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  tickets: any[]; // The tickets currently filtered for the day
}

export function ProgressSummaryModal({ isOpen, onClose, date, tickets }: ProgressSummaryModalProps) {
  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [summaryTitle, setSummaryTitle] = useState("TASK SUMMARY");
  const spreadsheetRef = useRef<HTMLDivElement>(null);

  // Overrides for editing
  const [opsOverrides, setOpsOverrides] = useState<Record<string, { total?: string, delivered?: string, notDone?: string }>>({});
  const [totalOverrides, setTotalOverrides] = useState<{ total?: string, delivered?: string, issues?: string }>({});

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

  const activeTotalTickets = totalOverrides.total !== undefined && totalOverrides.total !== "" ? Number(totalOverrides.total) : baseTotalTickets;
  const activeTotalDelivered = totalOverrides.delivered !== undefined && totalOverrides.delivered !== "" ? Number(totalOverrides.delivered) : totalDelivered;
  const activeTotalIssues = totalOverrides.issues !== undefined && totalOverrides.issues !== "" ? Number(totalOverrides.issues) : totalIssues;

  const completionRate = activeTotalTickets > 0 ? Math.round((activeTotalDelivered / activeTotalTickets) * 100) : 0;

  // Count unique vehicles
  const uniqueVehicles = new Set(tickets.map(t => t.ops_route_sessions?.vehicle_id).filter(Boolean)).size;
  const tasksPerVehicle = uniqueVehicles > 0 ? (activeTotalDelivered / uniqueVehicles).toFixed(1) : '0.0';

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

  const formattedDate = date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No Date Selected';

  const handleCopyImage = async () => {
    if (!spreadsheetRef.current || isCopying) return;
    try {
      setIsCopying(true);
      
      // Let React render the inputs as spans before capturing
      await new Promise(resolve => setTimeout(resolve, 50)); 
      
      const blob = await toBlob(spreadsheetRef.current, {
        backgroundColor: '#1e293b', // Match footer color to hide any fractional bottom gap
        style: { margin: '0' },
        pixelRatio: 2 // High resolution
      });
      
      if (blob) {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy image', err);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsCopying(false);
    }
  };

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleCopyImage();
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [isOpen, onClose, isCopying]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-[460px] rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <FileBarChart2 size={18} />
            <span>End of Day Summary</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto shrink-0 bg-background flex flex-col items-center justify-center">
          
          {/* Capture Container */}
          <div 
            ref={spreadsheetRef} 
            className="w-[380px] flex flex-col font-sans border border-gray-300 bg-[#1e293b]"
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

            {/* Report Header */}
            <div className="bg-gray-50 px-6 py-5 border-b border-gray-200 flex justify-between items-center text-[#111827]">
                <div className="flex flex-col gap-1 w-full max-w-[300px]">
                  <h2 className="text-xl font-extrabold tracking-tight text-gray-900 m-0">CITYFURNISH HYD</h2>
                  <input 
                    type="text"
                    value={summaryTitle}
                    onChange={(e) => setSummaryTitle(e.target.value)}
                    className="text-xs font-bold uppercase tracking-widest text-gray-500 bg-transparent border-none outline-none p-0 m-0 focus:ring-0 w-full"
                  />
                </div>
              <p className="text-sm font-semibold text-gray-500 m-0 uppercase tracking-widest whitespace-nowrap ml-4">{formattedDate}</p>
            </div>

            {/* Main Body */}
            <div className="bg-white px-6 py-5 space-y-6 text-[#111827]">
              
              {/* Matrix Section */}
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
                      {sortedMatrix.map(([cat, stats]) => {
                        const activeTotal = opsOverrides[cat]?.total !== undefined && opsOverrides[cat]?.total !== "" ? Number(opsOverrides[cat]?.total) : stats.total;
                        const activeDelivered = opsOverrides[cat]?.delivered !== undefined && opsOverrides[cat]?.delivered !== "" ? Number(opsOverrides[cat]?.delivered) : stats.delivered;
                        const activeNotDone = opsOverrides[cat]?.notDone !== undefined && opsOverrides[cat]?.notDone !== "" ? Number(opsOverrides[cat]?.notDone) : stats.notDone;

                        return (
                        <tr key={cat} className="border-b border-gray-100 last:border-b-0">
                          <td className="px-3 py-2.5 font-bold text-gray-700 truncate max-w-[120px]" title={cat}>{cat}</td>
                          <td className="px-2 py-2.5 text-center bg-gray-50/50">
                            {isCopying ? (
                              <span className="font-black text-gray-900">{activeTotal}</span>
                            ) : (
                              <input 
                                type="number"
                                className="w-12 text-center bg-transparent font-black text-gray-900 border-b border-dashed border-gray-300 focus:border-blue-500 focus:outline-none hide-spinners p-0 m-0 h-5"
                                value={opsOverrides[cat]?.total !== undefined ? opsOverrides[cat].total : stats.total}
                                onChange={(e) => setOpsOverrides(prev => ({ ...prev, [cat]: { ...prev[cat], total: e.target.value } }))}
                              />
                            )}
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            {isCopying ? (
                              <span className="font-bold text-green-600">{activeDelivered}</span>
                            ) : (
                              <input 
                                type="number"
                                className="w-12 text-center bg-transparent font-bold text-green-600 border-b border-dashed border-gray-300 focus:border-green-500 focus:outline-none hide-spinners p-0 m-0 h-5"
                                value={opsOverrides[cat]?.delivered !== undefined ? opsOverrides[cat].delivered : stats.delivered}
                                onChange={(e) => setOpsOverrides(prev => ({ ...prev, [cat]: { ...prev[cat], delivered: e.target.value } }))}
                              />
                            )}
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            {isCopying ? (
                              <span className="font-bold text-red-600">{activeNotDone}</span>
                            ) : (
                              <input 
                                type="number"
                                className="w-12 text-center bg-transparent font-bold text-red-600 border-b border-dashed border-gray-300 focus:border-red-500 focus:outline-none hide-spinners p-0 m-0 h-5"
                                value={opsOverrides[cat]?.notDone !== undefined ? opsOverrides[cat].notDone : stats.notDone}
                                onChange={(e) => setOpsOverrides(prev => ({ ...prev, [cat]: { ...prev[cat], notDone: e.target.value } }))}
                              />
                            )}
                          </td>
                        </tr>
                      )})}
                    </tbody>
                    <tfoot className="bg-gray-100 border-t-2 border-gray-200">
                      <tr>
                        <td className="px-3 py-3 text-gray-900 font-black tracking-widest text-xs">TOTAL</td>
                        <td className="px-2 py-3 text-center">
                          {isCopying ? (
                            <span className="text-gray-900 font-black text-lg leading-none">{activeTotalTickets}</span>
                          ) : (
                            <input 
                              type="number"
                              className="w-14 text-center bg-transparent text-gray-900 font-black text-lg border-b border-dashed border-gray-400 focus:border-blue-500 focus:outline-none hide-spinners p-0 m-0 h-6"
                              value={totalOverrides.total !== undefined ? totalOverrides.total : baseTotalTickets}
                              onChange={(e) => setTotalOverrides(prev => ({ ...prev, total: e.target.value }))}
                            />
                          )}
                        </td>
                        <td className="px-2 py-3 text-center">
                          {isCopying ? (
                            <span className="text-green-600 font-black text-lg leading-none">{activeTotalDelivered}</span>
                          ) : (
                            <input 
                              type="number"
                              className="w-14 text-center bg-transparent text-green-600 font-black text-lg border-b border-dashed border-gray-400 focus:border-green-500 focus:outline-none hide-spinners p-0 m-0 h-6"
                              value={totalOverrides.delivered !== undefined ? totalOverrides.delivered : totalDelivered}
                              onChange={(e) => setTotalOverrides(prev => ({ ...prev, delivered: e.target.value }))}
                            />
                          )}
                        </td>
                        <td className="px-2 py-3 text-center">
                          {isCopying ? (
                            <span className="text-red-600 font-black text-lg leading-none">{activeTotalIssues}</span>
                          ) : (
                            <input 
                              type="number"
                              className="w-14 text-center bg-transparent text-red-600 font-black text-lg border-b border-dashed border-gray-400 focus:border-red-500 focus:outline-none hide-spinners p-0 m-0 h-6"
                              value={totalOverrides.issues !== undefined ? totalOverrides.issues : totalIssues}
                              onChange={(e) => setTotalOverrides(prev => ({ ...prev, issues: e.target.value }))}
                            />
                          )}
                        </td>
                      </tr>
                  </tfoot>
                </table>
              </div>

            </div>

            {/* Footer Summary */}
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
        
        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/10 flex justify-between items-center shrink-0">
          <button 
            onClick={handleCopyImage}
            disabled={isCopying}
            className={`flex items-center gap-2 px-5 py-2 font-semibold text-sm rounded-lg transition-all shadow-sm ${copySuccess ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-primary text-primary-foreground hover:bg-primary/90'} disabled:opacity-70`}
          >
            {isCopying ? <Loader2 size={16} className="animate-spin" /> : (copySuccess ? <Check size={16} /> : <Camera size={16} />)}
            {isCopying ? 'Capturing...' : (copySuccess ? 'Copied to Clipboard!' : 'Copy for WhatsApp (Enter)')}
          </button>
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-background border border-border text-foreground font-semibold text-sm rounded-lg hover:bg-muted transition-colors shadow-sm"
          >
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
