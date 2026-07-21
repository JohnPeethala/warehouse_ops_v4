"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { useRoutePlanner } from './RoutePlannerContext';
import { generateBarPinSVG } from "./mapUtils";
import { HYDERABAD_COORDS, WAREHOUSE_COORDS } from "./mapConfig";

export function MapEngine() {
  const { groups, city, groupRoutes, routes, categories, getRouteColor, selectedGroupIds, isMultiSelectMode, toggleGroupSelection } = useRoutePlanner();
  const map = useMap();
  
  // Note: Since we are using standard google.maps.Marker for advanced SVGs and clustering,
  // we keep refs to manually manage them.
  const markersRef = useRef<Record<string, google.maps.Marker>>({});
  const prevGroupsLenRef = useRef(0);

  const basePinColor = "#52525b"; // zinc-600
  const mixedColor = "#a855f7"; // purple-500



  const fitView = useCallback(() => {
    if (!map || typeof google === 'undefined') return;
    const bounds = new google.maps.LatLngBounds();
    
    bounds.extend(WAREHOUSE_COORDS);
    
    let hasValid = false;
    groups.forEach(g => {
      if (!g.coords) return;
      const parts = g.coords.split(',').map(p => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        bounds.extend({ lat: parts[0], lng: parts[1] });
        hasValid = true;
      }
    });

    if (hasValid) {
      map.fitBounds(bounds, { top: 100, right: 420, bottom: 100, left: 100 });
      if (map.getZoom()! > 15) map.setZoom(15);
    }
  }, [map, groups]);

  useEffect(() => {
    const handleAction = (e: any) => {
      if (!map) return;
      if (e.detail === 'pan') fitView();
      if (e.detail === 'in') map.setZoom((map.getZoom() || 12) + 1);
      if (e.detail === 'out') map.setZoom((map.getZoom() || 12) - 1);
      
      if (e.detail && e.detail.action === 'panToNode' && e.detail.coords) {
        const parts = e.detail.coords.split(',').map((p: string) => parseFloat(p.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          map.panTo({ lat: parts[0], lng: parts[1] });
          if ((map.getZoom() || 12) < 16) {
             map.setZoom(16);
          }
        }
      }
    };
    window.addEventListener('planner-map-action', handleAction);
    return () => window.removeEventListener('planner-map-action', handleAction);
  }, [map, fitView]);

  useEffect(() => {
    if (!map || typeof google === 'undefined') return;

    const currentGroups = new Set(groups.map(g => g.id));
    
    Object.keys(markersRef.current).forEach(id => {
      if (!currentGroups.has(id)) {
        markersRef.current[id].setMap(null);
        delete markersRef.current[id];
      }
    });

    groups.forEach((group) => {
      if (!group.coords) return;
      const parts = group.coords.split(',').map((p) => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const pos = { lat: parts[0], lng: parts[1] };
        
        const assignedRoute = groupRoutes[group.id] || '';
        const isMixed = assignedRoute === "MIXED";
        const vColor = (assignedRoute && !isMixed) ? getRouteColor(assignedRoute).hex : null;
        
        let pinColor = basePinColor;

        if (isMixed) {
          pinColor = mixedColor;
        } else if (vColor) {
          pinColor = vColor;
        }

        const isAssigned = pinColor !== basePinColor;
        const isSelected = selectedGroupIds.has(group.id);
        const pinData = generateBarPinSVG(group, pinColor, isAssigned, categories, isSelected);

        if (markersRef.current[group.id]) {
          const m = markersRef.current[group.id];
          const icon = m.getIcon() as google.maps.Icon;
          
          if (!icon || icon.url !== pinData.url) {
            m.setIcon({
              url: pinData.url,
              anchor: new google.maps.Point(pinData.anchorX, pinData.anchorY),
            });
            m.setLabel(null); 
          }
          // The event listener is attached once, so we need to update it?
          // Actually, Google Maps marker listeners capture the closure. We must rebind or use refs for latest context.
          // Since the listener captures group.id, but what about isMultiSelectMode?
          // It's better to clear listeners and re-attach, but Google Maps API v3 clearInstanceListeners clears ALL listeners.
          // To avoid closure issues, we can just attach it once, and let it dispatch an event, OR we can re-create the marker if we aren't careful, OR we can use the domEvent.shiftKey which works without closure dependencies, but we need isMultiSelectMode.
        } else {
          const marker = new google.maps.Marker({
            position: pos,
            map: map,
            icon: {
              url: pinData.url,
              anchor: new google.maps.Point(pinData.anchorX, pinData.anchorY),
            },
            title: `Node ${group.serial}: ${group.originalArea}`
          });

          markersRef.current[group.id] = marker;
        }
      }
    });

    // Instead of binding listener on creation (which captures stale closures), bind it in a way that always has fresh state.
    // Actually we can just use clearInstanceListeners on map load?
    // Let's attach a single map click listener? No, marker click.
    Object.keys(markersRef.current).forEach(id => {
       const m = markersRef.current[id];
       google.maps.event.clearInstanceListeners(m);
       m.addListener('click', (e: google.maps.MapMouseEvent) => {
         const isShift = e.domEvent?.shiftKey;
         if (isMultiSelectMode || isShift) {
           toggleGroupSelection(id, true);
         } else {
           const pos = m.getPosition();
           if(pos) map.panTo(pos);
           const currentZoom = map.getZoom() || 12;
           if (currentZoom < 14) map.setZoom(14);
           
           const el = document.getElementById(`node-group-${id}`);
           if (el) {
             el.scrollIntoView({ behavior: 'smooth', block: 'center' });
             el.classList.add('ring-2', 'ring-blue-500');
             setTimeout(() => el.classList.remove('ring-2', 'ring-blue-500'), 1500);
           }
         }
       });
    });

    if (groups.length > 0 && groups.length !== prevGroupsLenRef.current) {
      fitView();
      prevGroupsLenRef.current = groups.length;
    }
  }, [groups, map, groupRoutes, routes, categories, fitView, selectedGroupIds, isMultiSelectMode, toggleGroupSelection]);

  useEffect(() => {
    return () => {
      Object.values(markersRef.current).forEach((m) => m.setMap(null));
    };
  }, []);

  useEffect(() => {
    if (!map) return;
    map.panTo(HYDERABAD_COORDS);
  }, [city, map]);

  return null;
}
