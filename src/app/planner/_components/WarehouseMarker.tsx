"use client";

import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { WAREHOUSE_COORDS } from './mapConfig';

export function WarehouseMarker() {
  return (
    <AdvancedMarker position={WAREHOUSE_COORDS} zIndex={50}>
      <div className="relative group cursor-pointer">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-blue-600 relative z-10 transition-transform group-hover:scale-110">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Warehouse HQ
        </div>
      </div>
    </AdvancedMarker>
  );
}
