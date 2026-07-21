import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getGeoZones } from "@/app/actions/geo";

export function useRealtimeGeoZones() {
  const [geoZones, setGeoZones] = useState<any[]>([]);

  useEffect(() => {
    // Initial fetch
    getGeoZones().then(zones => setGeoZones(zones));
    
    // Realtime subscription
    const supabase = createClient();
    const geoChannel = supabase.channel('realtime_geozones')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cfg_geo_zones' }, () => {
        getGeoZones().then(zones => setGeoZones(zones));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(geoChannel);
    };
  }, []);

  return { geoZones, setGeoZones };
}
