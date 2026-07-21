import { useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LocationGroup } from '../_components/RoutePlannerContext';

interface AssignmentsProps {
  groups: LocationGroup[];
  setGroupRoutes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setTicketRoutes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  selectedGroupIds: Set<string>;
  clearGroupSelection: () => void;
}

export function usePlannerAssignments({ 
  groups, 
  setGroupRoutes, 
  setTicketRoutes, 
  selectedGroupIds, 
  clearGroupSelection 
}: AssignmentsProps) {
  const supabase = useMemo(() => createClient(), []);

  const assignGroupRoute = async (groupId: string, routeName: string) => {
    setGroupRoutes(prev => ({ ...prev, [groupId]: routeName }));
    
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setTicketRoutes(prev => {
        const next = { ...prev };
        group.tickets.forEach(t => {
          const key = `${groupId}::${t.id}`;
          if (!routeName) delete next[key];
          else next[key] = routeName;
        });
        return next;
      });

      const ticketIds = group.tickets.map(t => t.id);
      const { error } = await supabase
        .from('ops_dispatch_log')
        .update({ route: routeName || null })
        .in('id', ticketIds);

      if (error) console.error("Failed to sync group assignment to DB:", error);
    }
  };

  const assignTicketRoute = async (groupId: string, ticketId: string, routeName: string) => {
    const key = `${groupId}::${ticketId}`;
    setTicketRoutes(prev => {
      const next = { ...prev };
      if (!routeName) delete next[key];
      else next[key] = routeName;
      return next;
    });

    const { error } = await supabase
      .from('ops_dispatch_log')
      .update({ route: routeName || null })
      .eq('id', ticketId);

    if (error) console.error("Failed to sync ticket assignment to DB:", error);

    // After updating a single ticket, we should re-evaluate the groupRoute status
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setTicketRoutes(prev => {
        const firstR = prev[`${groupId}::${group.tickets[0].id}`];
        const allSame = group.tickets.every(tk => prev[`${groupId}::${tk.id}`] === firstR);
        let groupRoute = "";
        if (allSame && firstR) {
          groupRoute = firstR;
        } else if (!allSame) {
          const hasAny = group.tickets.some(tk => prev[`${groupId}::${tk.id}`]);
          if (hasAny) groupRoute = "MIXED";
        }
        setGroupRoutes(gPrev => ({ ...gPrev, [groupId]: groupRoute }));
        return prev;
      });
    }
  };

  const bulkAssignGroupRoute = async (routeName: string) => {
    const ids = Array.from(selectedGroupIds);
    if (ids.length === 0) return;

    setGroupRoutes(prev => {
      const next = { ...prev };
      ids.forEach(id => {
        next[id] = routeName;
      });
      return next;
    });

    const ticketIds: string[] = [];
    setTicketRoutes(prev => {
      const next = { ...prev };
      ids.forEach(groupId => {
        const group = groups.find(g => g.id === groupId);
        if (group) {
          group.tickets.forEach(t => {
            ticketIds.push(t.id);
            const key = `${groupId}::${t.id}`;
            if (!routeName) delete next[key];
            else next[key] = routeName;
          });
        }
      });
      return next;
    });

    const { error } = await supabase
      .from('ops_dispatch_log')
      .update({ route: routeName || null })
      .in('id', ticketIds);

    if (error) console.error("Failed to sync bulk group assignment to DB:", error);
    
    clearGroupSelection();
  };

  return {
    assignGroupRoute,
    assignTicketRoute,
    bulkAssignGroupRoute
  };
}
