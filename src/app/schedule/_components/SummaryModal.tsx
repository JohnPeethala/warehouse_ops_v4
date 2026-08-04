import React, { useState, useRef, useEffect } from 'react';
import { X, FileBarChart2, Camera, Loader2, Check } from 'lucide-react';
import { toBlob } from 'html-to-image';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  tickets: any[]; // The tickets currently filtered for the day
}

export function SummaryModal({ isOpen, onClose, date, tickets }: SummaryModalProps) {
  const [regularCount, setRegularCount] = useState<number | ''>('');
  const [adhocCount, setAdhocCount] = useState<number | ''>('');
  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [summaryTitle, setSummaryTitle] = useState("SUMMARY");
  const spreadsheetRef = useRef<HTMLDivElement>(null);

  const totalVehicles = (Number(regularCount) || 0) + (Number(adhocCount) || 0);
  const totalTickets = tickets.length;
  const ticketsPerVehicle = totalVehicles > 0 ? (totalTickets / totalVehicles).toFixed(1) : '0.0';
  const totalPending = tickets.filter(t => t.status === 'Pending').length;

  // Dynamic category grouping with custom sorting
  const subCategoryCounts: Record<string, number> = {};
  tickets.forEach(t => {
    const sub = t.sub_category || "Other";
    subCategoryCounts[sub] = (subCategoryCounts[sub] || 0) + 1;
  });

  const sortedCategories = Object.entries(subCategoryCounts).sort((a, b) => {
    const aName = a[0].toLowerCase();
    const bName = b[0].toLowerCase();
    const getRank = (name: string) => {
      if (name.includes('delivery')) return 1;
      if (name.includes('pickup')) return 2;
      return 3;
    };
    const rankDiff = getRank(aName) - getRank(bName);
    if (rankDiff !== 0) return rankDiff;
    return b[1] - a[1]; // sort by count descending for rest
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
            <span>Schedule Summary Report</span>
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
              <p className="text-sm font-semibold text-gray-500 m-0 uppercase tracking-widest">{formattedDate}</p>
            </div>

            {/* Main Body */}
            <div className="bg-white px-6 py-5 space-y-6 text-[#111827]">
              
              {/* Tickets Section */}
              <div>
                <div className="flex justify-between items-end mb-3 pb-2 border-b border-gray-200">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Total Tickets</span>
                  <span className="text-2xl font-black text-gray-900 leading-none">{totalTickets}</span>
                </div>
                
                <div className="space-y-2.5 pt-1 pl-3 border-l border-gray-200 ml-1">
                  {sortedCategories.map(([cat, count]) => (
                    <div key={cat} className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-600">{cat}</span>
                      <span className="font-bold text-gray-800">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vehicles Section */}
              <div>
                <div className="flex justify-between items-end mb-3 pb-2 border-b border-gray-200">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Total Vehicles</span>
                  <span className="text-2xl font-black text-gray-900 leading-none">{totalVehicles}</span>
                </div>
                
                <div className="space-y-3 pt-1 pl-3 border-l border-gray-200 ml-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Regular Vehicles</span>
                    {isCopying ? (
                      <span className="w-16 text-right bg-transparent font-bold text-gray-900 py-0.5 inline-block">{regularCount || '0'}</span>
                    ) : (
                      <input 
                        type="number"
                        min="0"
                        value={regularCount}
                        onChange={e => setRegularCount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-16 text-right border-b-2 border-gray-300 focus:border-blue-500 outline-none bg-transparent font-bold text-gray-900 py-0.5 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0"
                      />
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Adhoc Vehicles</span>
                    {isCopying ? (
                      <span className="w-16 text-right bg-transparent font-bold text-gray-900 py-0.5 inline-block">{adhocCount || '0'}</span>
                    ) : (
                      <input 
                        type="number"
                        min="0"
                        value={adhocCount}
                        onChange={e => setAdhocCount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-16 text-right border-b-2 border-gray-300 focus:border-blue-500 outline-none bg-transparent font-bold text-gray-900 py-0.5 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0"
                      />
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Summary */}
            <div className="bg-[#1e293b] text-white px-6 py-5 flex justify-between items-center">
              <span className="block text-xs text-gray-300 font-bold uppercase tracking-widest">Tickets / Vehicle</span>
              <span className="block text-3xl font-black text-blue-400 leading-none">{ticketsPerVehicle}</span>
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
