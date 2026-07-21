"use client";

import React from 'react';
import { RoutePlannerProvider } from './_components/RoutePlannerContext';
import { MapComponent } from './_components/MapComponent';
import { DispatchConsole } from './_components/DispatchConsole';

export default function PlannerPage() {
  return (
    <RoutePlannerProvider>
      <div className="fixed inset-0 overflow-hidden bg-background z-0">
        <div className="absolute inset-0 z-0">
          <MapComponent />
        </div>
        <DispatchConsole />
      </div>
    </RoutePlannerProvider>
  );
}
