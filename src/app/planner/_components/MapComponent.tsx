"use client";

import { useEffect, useState } from 'react';
import { APIProvider, Map } from '@vis.gl/react-google-maps';
import { HYDERABAD_COORDS, DARK_STYLES, LIGHT_STYLES } from "./mapConfig";
import { WarehouseMarker } from "./WarehouseMarker";
import { MapEngine } from "./MapEngine";
import { MapTools } from "./MapTools";
import { RouteStats } from "./RouteStats";
import { useRoutePlanner } from './RoutePlannerContext';

export function MapComponent() {
  const { groups, city } = useRoutePlanner();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const trigger = (type: 'pan' | 'in' | 'out') => {
    window.dispatchEvent(new CustomEvent('planner-map-action', { detail: type }));
  };

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
      <div className="h-full w-full relative transition-colors duration-300 bg-background">
        
        <Map
          defaultCenter={HYDERABAD_COORDS}
          defaultZoom={12}
          gestureHandling={'greedy'}
          disableDefaultUI={true} 
          styles={isDarkMode ? DARK_STYLES : LIGHT_STYLES}
          padding={{ right: 400 }}
        >
          <MapEngine />
          <WarehouseMarker />
        </Map>

        {/* Route Stats over the map */}
        <div className="absolute top-4 left-4 md:left-24 z-10">
          <RouteStats />
        </div>

        <MapTools 
          onZoomIn={() => trigger('in')} 
          onZoomOut={() => trigger('out')} 
          onPan={() => trigger('pan')} 
        />
      </div>
      
      <style jsx global>{`
        .shadow-google {
          box-shadow: 0 1px 4px -1px rgba(0,0,0,0.3);
        }
        /* Custom scrollbar for stats */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f46; 
          border-radius: 4px;
        }
      `}</style>
    </APIProvider>
  );
}
