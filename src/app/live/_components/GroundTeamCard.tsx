import React from "react";
import * as LucideIcons from "lucide-react";

interface Category {
  name: string;
  icon_name: string;
  color: string;
}

interface Lookup {
  domain: string;
  status: string;
  sub_status?: string;
  status_color?: string;
  sub_status_color?: string;
  is_terminal: boolean;
}

interface Ticket {
  id: string;
  ticket_id: string;
  scheduled_date: string;
  status: string;
  sub_status?: string;
  sub_category?: string;
  contact_name?: string;
  location?: string;
  gt_trip_id?: string;
}

interface GroundTeamData {
  name: string;
  driver: string;
  tickets: Ticket[];
  subStats: Record<string, number>;
  total: number;
  done: number;
  pending: number;
  notDone: number;
}

interface GroundTeamCardProps {
  gt: GroundTeamData;
  categories: Category[];
  lookups: Lookup[];
}

export function GroundTeamCard({ gt, categories, lookups }: GroundTeamCardProps) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green': return "text-green-600 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20";
      case 'red': return "text-red-600 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20";
      case 'amber': return "text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20";
      case 'blue': return "text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20";
      case 'purple': return "text-purple-600 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20";
      default: return "text-zinc-600 bg-zinc-50 dark:bg-zinc-500/10 border-zinc-200 dark:border-zinc-500/20";
    }
  };

  const getStatusBadge = (status: string, subStatus?: string) => {
    // Find matching lookup
    const lookup = lookups.find(l => 
      l.status.toLowerCase() === status.toLowerCase() && 
      (!l.sub_status || !subStatus || l.sub_status.toLowerCase() === subStatus.toLowerCase())
    );
    
    // Fallback logic
    const statusColor = lookup?.status_color || 'zinc';
    const classes = getColorClasses(statusColor);

    return <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${classes}`}>{status}</span>;
  };

  const getSubStatusBadge = (status: string, subStatus?: string) => {
    // If no sub status, fallback to status badge logic
    if (!subStatus) {
      return getStatusBadge(status);
    }
    
    // Find matching lookup
    const lookup = lookups.find(l => 
      l.status.toLowerCase() === status.toLowerCase() && 
      l.sub_status?.toLowerCase() === subStatus.toLowerCase()
    );
    
    // Fallback logic
    const subColor = lookup?.sub_status_color || 'zinc';
    const classes = getColorClasses(subColor);

    return <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${classes}`}>{subStatus}</span>;
  };

  const isCompleted = gt.total > 0 && gt.pending === 0;
  const cardBorderClass = isCompleted 
    ? "border-2 border-green-500/50 shadow-green-500/10 shadow-md ring-1 ring-inset ring-green-500/50 bg-green-50/50 dark:bg-green-900/10" 
    : "border border-border/50 bg-card shadow-sm";

  return (
    <div className={`rounded-2xl overflow-hidden flex flex-col transition-all ${cardBorderClass}`}>
      {/* GT Header */}
      <div className="p-4 bg-muted/30 border-b border-border/50 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            {isCompleted && (
              <LucideIcons.CheckCircle2 size={18} className="text-green-500" />
            )}
            <span className="text-sm font-bold text-foreground uppercase tracking-wider">
              {gt.name}
            </span>
            {gt.driver && (
              <span className="text-[10px] font-medium text-muted-foreground flex items-center before:content-['•'] before:mr-2 before:opacity-50">
                {gt.driver}
              </span>
            )}
          </div>
          <div className="flex items-center flex-wrap gap-4 mt-2 text-xs font-semibold text-muted-foreground">
            {Object.entries(gt.subStats).map(([group, count]) => {
              if (count <= 0) return null;
              const cat = categories.find(c => c.name.toLowerCase() === group.toLowerCase());
              const IconComponent = cat?.icon_name ? (LucideIcons as any)[cat.icon_name] || LucideIcons.Square : LucideIcons.Square;
              const color = cat?.color || "#94a3b8";
              return (
                <span key={group} className="flex items-center gap-1.5 font-medium" title={group}>
                  <IconComponent size={20} style={{ color }} /> <span className="text-foreground">{count}</span>
                </span>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4 text-right pr-2">
          {/* GT Stats */}
          <div className="flex items-stretch py-1">
            <div className="flex flex-col items-center justify-between mr-5 pr-5 border-r-2 border-border/70" title="Total Tasks">
              <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-1.5">Total</span>
              <span className="text-[15px] font-black text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-500/20 leading-none shadow-sm">{gt.total}</span>
            </div>
            <div className="flex flex-col items-center justify-between">
              <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-1.5">Breakdown</span>
              <div className="flex gap-4 items-center h-full">
                <div className="text-center" title="Done"><p className="text-[15px] font-bold text-green-600 leading-none">{gt.done}</p></div>
                <div className="text-center" title="Pending"><p className="text-[15px] font-bold text-amber-500 leading-none">{gt.pending}</p></div>
                <div className="text-center" title="Not Done"><p className="text-[15px] font-bold text-red-600 leading-none">{gt.notDone}</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


