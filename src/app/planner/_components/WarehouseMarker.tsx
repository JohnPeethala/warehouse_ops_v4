"use client";

import { Marker } from '@vis.gl/react-google-maps';
import { WAREHOUSE_COORDS } from './mapConfig';

export function WarehouseMarker() {
  const warehouseSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80">
      <!-- Circle background -->
      <circle cx="60" cy="30" r="20" fill="white" stroke="#2563eb" stroke-width="4"/>
      <!-- Icon -->
      <g transform="translate(48, 18)" stroke="#2563eb" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </g>
      <!-- Label Background -->
      <rect x="20" y="55" width="80" height="20" rx="4" fill="#2563eb"/>
      <!-- Text -->
      <text x="60" y="69" font-family="sans-serif" font-size="9" font-weight="bold" fill="white" text-anchor="middle" letter-spacing="1">WAREHOUSE</text>
    </svg>
  `;

  const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(warehouseSvg)}`;

  return (
    <Marker 
      position={WAREHOUSE_COORDS} 
      zIndex={50}
      icon={{
        url,
        anchor: typeof google !== 'undefined' ? new google.maps.Point(60, 40) : undefined,
      }}
    />
  );
}
