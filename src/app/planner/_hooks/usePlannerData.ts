import { useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LocationGroup, Category, Ticket } from '../_components/RoutePlannerContext';

export function usePlannerData(date: string) {
  const [city, setCityState] = useState("Hyderabad");
  const [groups, setGroups] = useState<LocationGroup[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [routes, setRoutes] = useState<string[]>([]);
  const [groupRoutes, setGroupRoutes] = useState<Record<string, string>>({});
  const [ticketRoutes, setTicketRoutes] = useState<Record<string, string>>({});

  const supabase = useMemo(() => createClient(), []);

  const fetchStateFromDB = useCallback(async () => {
    // 1. Fetch dispatch logs (tickets)
    const { data: ticketsData, error: ticketsError } = await supabase
      .from('ops_dispatch_log')
      .select('*')
      .eq('scheduled_date', date);

    if (ticketsError || !ticketsData) {
      console.error("Error fetching tickets:", ticketsError);
      return;
    }

    // 2. Fetch all geo zones for the city
    const { data: geoData } = await supabase
      .from('cfg_geo_zones')
      .select('*');
      
    const geoMap = new Map<string, string>();
    geoData?.forEach(g => {
       const key = `${g.area}::${g.pincode}`.toLowerCase();
       if (g.lat && g.lng) {
         geoMap.set(key, `${g.lat}, ${g.lng}`);
       }
    });

    // 3. Fetch categories
    const { data: catData } = await supabase
      .from('cfg_ticket_categories')
      .select('*')
      .eq('is_active', true);
      
    if (catData) {
      setCategories(catData as Category[]);
    }

    const parsedGroups: Record<string, LocationGroup> = {};
    const gRoutesMap: Record<string, string> = {};
    const tRoutesMap: Record<string, string> = {};

    ticketsData.forEach(t => {
      const locationVal = t.location || 'UNKNOWN';
      const sanitizedArea = locationVal.toUpperCase().trim();
      const sanitizedPincode = (t.pincode || '000000').trim();
      const groupId = `${sanitizedArea}-${sanitizedPincode}`;
      
      if (!parsedGroups[groupId]) {
        const cacheKey = `${locationVal.trim()}::${sanitizedPincode}`.toLowerCase();
        parsedGroups[groupId] = {
          id: groupId,
          serial: 0,
          originalArea: locationVal.toUpperCase().trim(),
          sanitizedArea,
          pincode: sanitizedPincode,
          tickets: [],
          coords: geoMap.get(cacheKey) || "",
        };
      }
      
      const ticketObj: Ticket = {
        id: t.id, 
        ticket_id: t.ticket_id, 
        name: t.contact_name || t.ticket_id,
        location: locationVal,
        pincode: t.pincode,
        sub_category: t.sub_category || "GENERAL",
        route_name: t.route
      };
      
      parsedGroups[groupId].tickets.push(ticketObj);
      
      if (t.route) {
        tRoutesMap[`${groupId}::${t.id}`] = t.route;
      }
    });

    const groupsArray = Object.values(parsedGroups).map((g, idx) => {
      let groupRoute = "";
      if (g.tickets.length > 0) {
        const firstR = tRoutesMap[`${g.id}::${g.tickets[0].id}`];
        const allSame = g.tickets.every(tk => tRoutesMap[`${g.id}::${tk.id}`] === firstR);
        if (allSame && firstR) {
          groupRoute = firstR;
        } else if (!allSame) {
          const hasAny = g.tickets.some(tk => tRoutesMap[`${g.id}::${tk.id}`]);
          if (hasAny) groupRoute = "MIXED";
        }
      }
      if (groupRoute) gRoutesMap[g.id] = groupRoute;

      return { ...g, serial: idx + 1 };
    });

    setGroups(groupsArray);
    setGroupRoutes(gRoutesMap);
    setTicketRoutes(tRoutesMap);

    // Extract dynamic active routes
    const activeRoutes = new Set<string>();
    Object.values(tRoutesMap).forEach(r => r && activeRoutes.add(r));
    setRoutes(Array.from(activeRoutes).sort());
  }, [date, supabase]);

  const updateCoords = async (groupId: string, coords: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, coords } : g));

    const [latStr, lngStr] = coords.split(',');
    if (latStr && lngStr) {
      const lat = parseFloat(latStr.trim());
      const lng = parseFloat(lngStr.trim());
      
      const { data: existing } = await supabase
        .from('cfg_geo_zones')
        .select('id')
        .eq('area', group.originalArea)
        .eq('pincode', group.pincode)
        .single();
        
      if (existing) {
        await supabase.from('cfg_geo_zones').update({ lat, lng }).eq('id', existing.id);
      } else {
        await supabase.from('cfg_geo_zones').insert({
          area: group.originalArea,
          pincode: group.pincode,
          lat, lng,
          is_active: true
        });
      }
    }
  };

  return {
    city, setCity: setCityState,
    groups, setGroups,
    categories, setCategories,
    routes, setRoutes,
    groupRoutes, setGroupRoutes,
    ticketRoutes, setTicketRoutes,
    fetchStateFromDB,
    updateCoords
  };
}
