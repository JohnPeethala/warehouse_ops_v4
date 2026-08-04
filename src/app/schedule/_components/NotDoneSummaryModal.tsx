import React, { useState, useRef, useEffect } from 'react';
import { X, AlertCircle, Camera, Loader2, Check } from 'lucide-react';
import { toBlob } from 'html-to-image';
import { getCategoryDetails } from "@/lib/categoryUtils";

interface NotDoneSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  tickets: any[]; // The tickets currently filtered for the day
  vehicles: any[];
  profiles: any[];
  subCategories: any[];
}

export function NotDoneSummaryModal({ isOpen, onClose, date, tickets, vehicles, profiles, subCategories }: NotDoneSummaryModalProps) {
  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isGrouped, setIsGrouped] = useState(false);
  const [summaryTitle, setSummaryTitle] = useState("NOT DONE SUMMARY");
  const spreadsheetRef = useRef<HTMLDivElement>(null);

  // Filter for only Not Done tickets
  const notDoneTickets = tickets.filter(t => t.status === 'Not Done');
  const totalNotDone = notDoneTickets.length;
  
  // Ops breakdown for Flat List
  const opsBreakdown: Record<string, number> = {};
  notDoneTickets.forEach(t => {
    const cat = t.sub_category || 'Unknown';
    opsBreakdown[cat] = (opsBreakdown[cat] || 0) + 1;
  });
  const sortedOpsBreakdown = Object.entries(opsBreakdown).sort((a, b) => b[1] - a[1]);
  
  // Pending
  const totalPending = tickets.filter(t => t.status === 'Pending').length;

  const driverVehicleIssues = notDoneTickets.filter(t => 
    t.sub_status === 'Driver Refused' || t.sub_status === 'Vehicle Issue'
  );

  // Group by driver and GTs (Only for Driver/Vehicle issues)
  const groupedData = driverVehicleIssues.reduce((acc, t) => {
    const session = t.ops_route_sessions || {};
    const vehicle = vehicles.find(v => v.id === session.vehicle_id);
    const gt1 = profiles.find(p => p.id === session.gt1_id);
    const gt2 = profiles.find(p => p.id === session.gt2_id);

    const driverName = vehicle ? vehicle.driver_name : 'Unassigned Driver';
    const gtNames = [gt1?.name, gt2?.name].filter(Boolean).join(' & ');
    
    // stable key
    const key = `${session.vehicle_id || 'no-veh'}_${session.gt1_id || 'no-gt1'}_${session.gt2_id || 'no-gt2'}`;
    
    if (!acc[key]) {
      acc[key] = {
        driverName,
        gtNames,
        tickets: []
      };
    }
    acc[key].tickets.push(t);
    return acc;
  }, {} as Record<string, { driverName: string, gtNames: string, tickets: any[] }>);

  // Sort alphabetically by driver
  const sortedGroups = Object.values(groupedData).sort((a, b) => a.driverName.localeCompare(b.driverName));

  const formattedDate = date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No Date Selected';

  const handleCopyImage = async () => {
    if (!spreadsheetRef.current || isCopying) return;
    try {
      setIsCopying(true);
      
      await new Promise(resolve => setTimeout(resolve, 50)); 
      
      const blob = await toBlob(spreadsheetRef.current, {
        backgroundColor: '#1e293b', 
        style: { margin: '0' },
        pixelRatio: 2 
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
      <div className="bg-card w-full max-w-[560px] rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-4 text-primary font-semibold">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              <span>Not Done Report</span>
            </div>
            
            {totalNotDone > 0 && (
              <div className="h-4 w-px bg-border hidden sm:block"></div>
            )}
            {totalNotDone > 0 && (
              <button
                onClick={() => setIsGrouped(!isGrouped)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md border transition-colors ${isGrouped ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-background border-border text-muted-foreground hover:text-foreground'}`}
              >
                {isGrouped ? 'Grouped by Driver' : 'Flat List'}
              </button>
            )}
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
            className="w-[480px] flex flex-col font-sans border border-gray-300 bg-[#1e293b]"
          >
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
            <div className="bg-white px-6 py-5 text-[#111827]">
              
              {(isGrouped ? driverVehicleIssues.length : totalNotDone) === 0 ? (
                <div className="text-center py-6 text-gray-500 font-medium italic">
                  {isGrouped ? 'No driver or vehicle not done reported.' : 'No not done tickets today. Great job!'}
                </div>
              ) : (
                <div className="space-y-6">
                  {!isGrouped ? (
                    <div className="space-y-4">
                      {sortedOpsBreakdown.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {sortedOpsBreakdown.map(([cat, count]) => {
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
                    sortedGroups.map((group, idx) => (
                      <div key={idx}>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <div className="bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200 flex items-center shadow-sm">
                             <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mr-2 border-r border-gray-300 pr-2">Driver</span>
                             <span className="text-sm font-bold text-gray-800">{group.driverName}</span>
                          </div>
                        </div>
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
                              {group.tickets.map((t, tIdx) => {
                                const isCx = (t.sub_status || '').toLowerCase().includes('cx');
                                return (
                                  <tr key={t.id || tIdx} className="hover:bg-gray-50">
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
                                    <td className="px-2 py-2 font-medium text-gray-800 truncate max-w-[100px]" title={t.contact_name}>{t.contact_name}</td>
                                    <td className="px-2 py-2 text-gray-600">{t.sub_category || '-'}</td>
                                    <td className={`px-2 py-2 font-bold ${isCx ? 'text-blue-600' : 'text-red-600'}`}>{t.sub_status || 'Not Done'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Footer Summary */}
            <div className="bg-[#1e293b] text-white px-6 py-5 flex justify-between items-center">
              <span className="text-xs text-gray-300 font-bold uppercase tracking-widest">
                {isGrouped ? 'Driver & Vehicle Not Done' : 'Total Not Done'}
              </span>
              <span className="text-3xl font-black text-red-400 leading-none">
                {isGrouped ? driverVehicleIssues.length : totalNotDone}
              </span>
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
