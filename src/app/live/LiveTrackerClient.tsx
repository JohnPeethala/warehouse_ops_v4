"use client";

import React, { useEffect, useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { CheckCircle2, Clock, Ticket, AlertCircle, XCircle } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { GroundTeamCard } from "./_components/GroundTeamCard";

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
  ops_route_sessions?: {
    id: string;
    core_vehicles?: {
      vehicle_no?: string;
      driver_name?: string;
    };
    driver_profile?: {
      name?: string;
    };
    gt2_profile?: {
      name?: string;
    };
  };
}

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

interface Props {
  initialTickets: Ticket[];
  lookups: Lookup[];
  categories: Category[];
  targetDate: string;
  isAuth: boolean;
  error?: string;
}

export function LiveTrackerClient({ initialTickets, lookups, categories, targetDate, isAuth, error }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);

  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

  useEffect(() => {
    // If not authenticated, we could fall back to polling, but for now we'll just show the initial load.
    // The user requested realtime, so we'll set up the Supabase channel.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const channel = supabase
      .channel('live-tracker-kpis')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ops_dispatch_log',
          filter: `scheduled_date=eq.${targetDate}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTickets((prev) => [...prev, payload.new as Ticket]);
          } else if (payload.eventType === 'UPDATE') {
            setTickets((prev) => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t));
          } else if (payload.eventType === 'DELETE') {
            setTickets((prev) => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetDate]);

  const kpis = useMemo(() => {
    let done = 0;
    let pending = 0;
    let notDone = 0;
    
    const totalGroups: Record<string, number> = {};
    const doneGroups: Record<string, number> = {};
    const pendingGroups: Record<string, number> = {};
    const notDoneGroups: Record<string, number> = {};

    tickets.forEach(ticket => {
      const status = ticket.status || 'Pending';
      const statusLower = status.toLowerCase();
      const group = ticket.sub_category || 'Other';

      // Increment total group
      totalGroups[group] = (totalGroups[group] || 0) + 1;

      if (statusLower === 'done' || statusLower === 'delivered' || statusLower === 'completed') {
        done++;
        doneGroups[group] = (doneGroups[group] || 0) + 1;
      } else if (statusLower === 'not done') {
        notDone++;
        notDoneGroups[group] = (notDoneGroups[group] || 0) + 1;
      } else {
        pending++;
        pendingGroups[group] = (pendingGroups[group] || 0) + 1;
      }
    });

    return {
      total: tickets.length,
      done,
      pending,
      notDone,
      totalGroups,
      doneGroups,
      pendingGroups,
      notDoneGroups
    };
  }, [tickets, lookups]);

  const renderBreakdown = (groups: Record<string, number>) => {
    const entries = Object.entries(groups).filter(([_, count]) => count > 0);
    if (entries.length === 0) return null;

    return (
      <div className="flex flex-wrap overflow-hidden gap-2 mt-4 pt-4 border-t border-border/50 text-xs font-medium text-muted-foreground">
        {entries.map(([group, count]) => {
          const cat = categories.find(c => c.name.toLowerCase() === group.toLowerCase());
          const IconComponent = cat?.icon_name ? (LucideIcons as any)[cat.icon_name] || LucideIcons.Square : LucideIcons.Square;
          const color = cat?.color || "#94a3b8";
          return (
            <span key={group} className="flex items-center gap-1.5 whitespace-nowrap" title={group}>
              <IconComponent size={16} style={{ color }} /> {count}
            </span>
          );
        })}
      </div>
    );
  };

  const gtData = useMemo(() => {
    // Group tickets by GT Name
    const map = new Map<string, Ticket[]>();

    tickets.forEach(t => {

      const gt1 = t.ops_route_sessions?.driver_profile?.name || '';
      const gt2 = t.ops_route_sessions?.gt2_profile?.name || '';
      const gtName = gt2 ? `${gt1} & ${gt2}` : (gt1 || 'Unassigned');
      if (!map.has(gtName)) map.set(gtName, []);
      map.get(gtName)!.push(t);
    });

    return Array.from(map.entries()).map(([name, teamTickets]) => {
      // Sort tickets: sub_category (Delivery -> Pickup -> Others), then alphabetically
      teamTickets.sort((a, b) => {
        const aType = (a.sub_category || "").toLowerCase();
        const bType = (b.sub_category || "").toLowerCase();
        
        const getRank = (type: string) => {
          if (type.includes('delivery')) return 1;
          if (type.includes('pickup')) return 2;
          return 3;
        };

        const rankDiff = getRank(aType) - getRank(bType);
        if (rankDiff !== 0) return rankDiff;
        return aType.localeCompare(bType);
      });

      const drivers = teamTickets.map(t => t.ops_route_sessions?.core_vehicles?.driver_name).filter(Boolean);
      const uniqueDrivers = Array.from(new Set(drivers));
      const driver = uniqueDrivers.length > 0 ? uniqueDrivers.join(', ') : '';

      let done = 0;
      let pending = 0;
      let notDone = 0;
      
      const subStats: Record<string, number> = {};

      teamTickets.forEach(t => {
        const statusLower = (t.status || '').toLowerCase();
        const group = t.sub_category || 'Other';
        subStats[group] = (subStats[group] || 0) + 1;

        if (statusLower === 'done' || statusLower === 'delivered' || statusLower === 'completed') {
          done++;
        } else if (statusLower === 'not done') {
          notDone++;
        } else {
          pending++;
        }
      });

      return {
        name,
        driver,
        tickets: teamTickets,
        subStats,
        total: teamTickets.length,
        done,
        pending,
        notDone
      };
    }).sort((a, b) => b.total - a.total);
  }, [tickets]);

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
        <AlertCircle size={16} />
        <p>{error}</p>
      </div>
    );
  }

  const activeGTs = gtData.filter(gt => gt.pending > 0 || gt.total === 0);
  const completedGTs = gtData.filter(gt => gt.pending === 0 && gt.total > 0);

  return (
    <>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
      {/* Total Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-white/40 dark:bg-zinc-900/40 p-6 backdrop-blur-xl shadow-sm transition-all hover:shadow-md hover:bg-white/60 dark:hover:bg-zinc-900/60 group">
        <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-20 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">
          <Ticket className="w-32 h-32 text-blue-500 -mr-8 -mt-8" />
        </div>
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex items-center gap-2 mb-4">
            <Ticket className="w-6 h-6 text-blue-500" />
            <h3 className="font-semibold text-sm tracking-widest uppercase text-muted-foreground mt-0.5">Total</h3>
          </div>
          <div>
            <span className="text-5xl font-extrabold tracking-tighter text-foreground drop-shadow-sm">{kpis.total}</span>
          </div>
        </div>
      </div>

      {/* Done Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-white/40 dark:bg-zinc-900/40 p-6 backdrop-blur-xl shadow-sm transition-all hover:shadow-md hover:bg-white/60 dark:hover:bg-zinc-900/60 group">
        <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-20 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">
          <CheckCircle2 className="w-32 h-32 text-green-500 -mr-8 -mt-8" />
        </div>
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            <h3 className="font-semibold text-sm tracking-widest uppercase text-muted-foreground mt-0.5">Done</h3>
          </div>
          <div>
            <span className="text-5xl font-extrabold tracking-tighter text-foreground drop-shadow-sm">{kpis.done}</span>
          </div>
        </div>
      </div>

      {/* Pending Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-white/40 dark:bg-zinc-900/40 p-6 backdrop-blur-xl shadow-sm transition-all hover:shadow-md hover:bg-white/60 dark:hover:bg-zinc-900/60 group">
        <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-20 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">
          <Clock className="w-32 h-32 text-amber-500 -mr-8 -mt-8" />
        </div>
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-6 h-6 text-amber-500" />
            <h3 className="font-semibold text-sm tracking-widest uppercase text-muted-foreground mt-0.5">Pending</h3>
          </div>
          <div>
            <span className="text-5xl font-extrabold tracking-tighter text-foreground drop-shadow-sm">{kpis.pending}</span>
          </div>
        </div>
      </div>

      {/* Not Done Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-white/40 dark:bg-zinc-900/40 p-6 backdrop-blur-xl shadow-sm transition-all hover:shadow-md hover:bg-white/60 dark:hover:bg-zinc-900/60 group">
        <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-20 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">
          <XCircle className="w-32 h-32 text-red-500 -mr-8 -mt-8" />
        </div>
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-6 h-6 text-red-500" />
            <h3 className="font-semibold text-sm tracking-widest uppercase text-muted-foreground mt-0.5">Not Done</h3>
          </div>
          <div>
            <span className="text-5xl font-extrabold tracking-tighter text-foreground drop-shadow-sm">{kpis.notDone}</span>
          </div>
        </div>
      </div>
    </div>
    
    {isAuth && (
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Ground Team Activity</h2>
          <span className="text-xs font-semibold px-2 py-1 bg-muted text-muted-foreground rounded-md">
            {gtData.length} Teams Active
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-1">
          {activeGTs.map((gt, i) => (
            <GroundTeamCard key={`active-${i}`} gt={gt} categories={categories} lookups={lookups} />
          ))}

          {completedGTs.length > 0 && (
            <div className="col-span-full mt-4 mb-2 flex items-center gap-4">
              <div className="h-px bg-border/50 flex-1"></div>
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-green-500" />
                Completed Teams
              </span>
              <div className="h-px bg-border/50 flex-1"></div>
            </div>
          )}

          {completedGTs.map((gt, i) => (
            <GroundTeamCard key={`completed-${i}`} gt={gt} categories={categories} lookups={lookups} />
          ))}

          {gtData.length === 0 && (
            <div className="col-span-full py-12 text-center bg-muted/20 border border-border border-dashed rounded-2xl">
              <p className="text-muted-foreground font-medium mb-1">No active teams for today.</p>
            </div>
          )}
        </div>
      </div>
    )}
    </>
  );
}
