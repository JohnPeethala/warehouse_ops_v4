import React, { useState, useRef, useEffect } from 'react';
import { X, FileBarChart2, Camera, Loader2, Check } from 'lucide-react';
import { toBlob } from 'html-to-image';
import type { EnrichedTicket } from "@/components/features/ticket-table/types";

interface CustomBatchSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: EnrichedTicket[];
}

export function CustomBatchSummaryModal({ isOpen, onClose, tickets }: CustomBatchSummaryModalProps) {
  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const spreadsheetRef = useRef<HTMLDivElement>(null);

  const matrix: Record<string, Record<string, number>> = {};
  const allOpsTypes = new Set<string>();
  let totalTickets = 0;

  const cleanNote = (note: string) => {
    // Remove the [Name - Date Time] - pattern
    return note.replace(/\[.*? - .*?\] - /g, '').trim() || "Blank";
  };

  tickets.forEach(t => {
    const rawNote = t.annotation?.notes || "";
    const note = cleanNote(rawNote);
    const opsType = t.sub_category?.trim() || "Other";
    allOpsTypes.add(opsType);

    if (!matrix[note]) matrix[note] = {};
    matrix[note][opsType] = (matrix[note][opsType] || 0) + 1;
    totalTickets++;
  });

  const opsCols = Array.from(allOpsTypes).sort();
  const rows = Object.keys(matrix).sort((a, b) => {
    if (a === "Blank") return 1;
    if (b === "Blank") return -1;
    return a.localeCompare(b);
  });

  const todayDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const handleCopyImage = async () => {
    if (!spreadsheetRef.current || isCopying) return;
    try {
      setIsCopying(true);
      
      // Let React render before capturing
      await new Promise(resolve => setTimeout(resolve, 50)); 
      
      const blob = await toBlob(spreadsheetRef.current, {
        backgroundColor: '#1e293b',
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-auto">
      <div className="bg-card w-max max-w-[95vw] rounded-2xl shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <FileBarChart2 size={18} />
            <span>Custom Batch Summary Report</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto overflow-x-auto shrink-0 bg-background flex flex-col items-start justify-start">
          
          {/* Capture Container */}
          <div 
            ref={spreadsheetRef} 
            className="w-max min-w-[400px] flex flex-col font-sans border border-gray-300 bg-[#1e293b]"
          >
            {/* Report Header */}
            <div className="bg-gray-50 px-6 py-5 border-b border-gray-200 flex justify-between items-center text-[#111827]">
              <div className="flex flex-col gap-1 w-full">
                <h2 className="text-xl font-extrabold tracking-tight text-gray-900 m-0">CITYFURNISH HYD</h2>
                <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Backdated Cases Summary
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-500 m-0 uppercase tracking-widest whitespace-nowrap ml-4">
                {todayDate}
              </p>
            </div>

            {/* Main Body */}
            <div className="bg-white p-4 text-[#111827]">
              <div className="overflow-x-auto border border-gray-200 rounded-md">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-700 uppercase font-semibold text-xs border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 border-r border-gray-200 min-w-[120px]">Notes</th>
                      {opsCols.map(col => (
                        <th key={col} className="px-3 py-2 text-center border-r border-gray-200 whitespace-nowrap">{col}</th>
                      ))}
                      <th className="px-3 py-2 text-center bg-gray-200">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {rows.map(note => {
                      const rowTotal = opsCols.reduce((sum, col) => sum + (matrix[note][col] || 0), 0);
                      if (rowTotal === 0) return null;
                      return (
                        <tr key={note} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-900 border-r border-gray-200 break-words line-clamp-2 max-w-[200px]" title={note}>{note}</td>
                          {opsCols.map(col => {
                            const val = matrix[note][col] || 0;
                            return (
                              <td key={col} className="px-3 py-2 text-center border-r border-gray-200 text-gray-600">
                                {val > 0 ? <span className="font-semibold text-gray-900">{val}</span> : '-'}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-center font-bold bg-gray-50 text-gray-900">{rowTotal}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-100 border-t border-gray-300 font-bold">
                    <tr>
                      <td className="px-3 py-2 border-r border-gray-300 uppercase text-xs text-gray-600">Grand Total</td>
                      {opsCols.map(col => {
                        const colTotal = rows.reduce((sum, row) => sum + (matrix[row][col] || 0), 0);
                        return (
                          <td key={col} className="px-3 py-2 text-center border-r border-gray-300 text-gray-900">{colTotal}</td>
                        );
                      })}
                      <td className="px-3 py-2 text-center bg-gray-200 text-blue-600">{totalTickets}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            
            {/* Footer Summary */}
            <div className="bg-[#1e293b] text-white px-6 py-5 flex justify-between items-center">
              <span className="text-xs text-gray-300 font-bold uppercase tracking-widest">Total Tickets</span>
              <span className="text-3xl font-black text-blue-400 leading-none">{totalTickets}</span>
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
