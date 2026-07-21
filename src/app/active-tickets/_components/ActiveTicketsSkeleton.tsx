import { Search, Loader2 } from "lucide-react";

export function ActiveTicketsSkeleton() {
  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* Dispatch Readiness Board Skeleton */}
      <div className="flex flex-wrap items-center gap-3 mb-1 p-3 bg-card/60 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-xl shadow-sm">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-2">Schedule Done:</span>
        <div className="flex items-center gap-4 flex-wrap">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-24 h-8 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>

      {/* Search Header Skeleton */}
      <div className="flex items-center px-1 justify-between gap-4">
        <div className="relative w-full max-w-sm flex items-center">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none" />
          <div className="w-full h-9 bg-card/60 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-sm rounded-lg animate-pulse" />
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-24 h-9 bg-muted rounded-lg animate-pulse" />
          <div className="w-40 h-9 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Active Filters Row Skeleton */}
      <div className="flex flex-wrap items-center gap-2 mb-3 min-h-[32px] px-1">
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-1">Active Filters:</span>
          <div className="w-32 h-5 bg-muted rounded-full animate-pulse" />
        </div>
      </div>

      {/* Table Card */}
      <div className="w-full flex-1 flex flex-col bg-card/60 backdrop-blur-xl border border-border shadow-sm rounded-xl overflow-hidden min-h-0 relative">
        {/* Indeterminate Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary/20 overflow-hidden z-50">
          <div className="h-full bg-primary w-1/3 animate-[progress_1s_ease-in-out_infinite]" />
        </div>
        
        <div className="overflow-hidden flex-1 p-0">
          <table className="w-full text-left border-collapse min-w-[2000px]">
            <thead className="bg-white dark:bg-[#171717] divide-x divide-border border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left w-12 sticky left-0 z-40 bg-white dark:bg-[#171717] border-r dark:border-neutral-800 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.3)]">
                  <div className="w-4 h-4 bg-muted rounded animate-pulse mx-auto" />
                </th>
                <th className="px-4 py-3 text-left w-12"><div className="w-6 h-4 bg-muted rounded animate-pulse" /></th>
                <th className="px-4 py-3 text-left w-20"><div className="w-10 h-4 bg-muted rounded animate-pulse" /></th>
                <th className="px-4 py-3 text-left"><div className="w-16 h-4 bg-muted rounded animate-pulse" /></th>
                <th className="px-4 py-3 text-left"><div className="w-16 h-4 bg-muted rounded animate-pulse" /></th>
                <th className="px-4 py-3 text-left w-32"><div className="w-20 h-4 bg-muted rounded animate-pulse" /></th>
                <th className="px-4 py-3 text-left"><div className="w-16 h-4 bg-muted rounded animate-pulse" /></th>
                <th className="px-4 py-3 text-left"><div className="w-24 h-4 bg-muted rounded animate-pulse" /></th>
                <th className="px-4 py-3 text-left"><div className="w-24 h-4 bg-muted rounded animate-pulse" /></th>
                <th className="px-4 py-3 text-left"><div className="w-20 h-4 bg-muted rounded animate-pulse" /></th>
                <th className="px-4 py-3 text-left min-w-[200px]"><div className="w-32 h-4 bg-muted rounded animate-pulse" /></th>
                <th className="px-4 py-3 text-left min-w-[180px]"><div className="w-32 h-4 bg-muted rounded animate-pulse" /></th>
              </tr>
              <tr className="bg-muted/50 backdrop-blur-xl divide-x divide-border h-8">
                <th className="p-0 sticky left-0 z-40 bg-muted dark:bg-[#171717] align-top relative border-r dark:border-neutral-800 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.3)]"></th>
                {Array.from({ length: 11 }).map((_, i) => (
                  <th key={i} className="p-0 align-top relative"></th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {Array.from({ length: 15 }).map((_, i) => (
                <tr key={i} className="divide-x divide-border">
                  <td className="px-4 py-3 sticky left-0 z-10 bg-white dark:bg-[#171717] border-r dark:border-neutral-800 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.3)]">
                    <div className="w-4 h-4 bg-muted/50 rounded animate-pulse mx-auto" />
                  </td>
                  {Array.from({ length: 11 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="w-full h-4 bg-muted/50 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}} />
    </div>
  );
}
