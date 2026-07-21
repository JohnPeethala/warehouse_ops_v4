"use client";

import React, { useEffect, useState } from "react";
import { Package, Truck, Activity } from "lucide-react";

export default function LoaderDemoPage() {
  const [progress, setProgress] = useState(0);

  // Simulate a progress bar loading over time
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0; // reset for demo purposes
        return prev + Math.random() * 15;
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold mb-2">Loading State Demonstrations</h1>
        <p className="text-muted-foreground">Compare these modern alternatives to a standard loading spinner.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 1. Skeleton Table Rows */}
        <div className="bg-card/60 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-primary" />
            1. Skeleton Loaders (Data Table)
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            The industry standard. We trace the shape of the data using our built-in shimmer effect. The brain perceives the table as already rendered.
          </p>

          <div className="border border-border/50 rounded-lg overflow-hidden">
            {/* Fake Table Header */}
            <div className="bg-muted/30 border-b border-border/50 p-3 grid grid-cols-4 gap-4">
              <div className="h-4 bg-muted/50 rounded w-1/2"></div>
              <div className="h-4 bg-muted/50 rounded w-3/4"></div>
              <div className="h-4 bg-muted/50 rounded w-full"></div>
              <div className="h-4 bg-muted/50 rounded w-1/3"></div>
            </div>
            
            {/* Fake Table Rows (Shimmering) */}
            <div className="divide-y divide-border/50 bg-card/40">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 grid grid-cols-4 gap-6 items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full skeleton shrink-0"></div>
                    <div className="h-4 skeleton w-full max-w-[120px] rounded"></div>
                  </div>
                  <div className="h-4 skeleton w-3/4 rounded"></div>
                  <div className="h-4 skeleton w-full rounded"></div>
                  <div className="h-6 skeleton w-16 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* 2. Top-Edge Progress Bar */}
          <div className="bg-card/60 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-xl p-6 shadow-sm relative overflow-hidden">
            {/* The actual progress bar */}
            <div 
              className="absolute top-0 left-0 h-1 bg-primary transition-all duration-300 ease-out z-10"
              style={{ width: `${Math.min(100, progress)}%` }}
            >
              <div className="absolute top-0 right-0 h-full w-20 bg-white/40 blur-[2px]"></div>
            </div>
            
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 mt-2">
              <Truck className="w-5 h-5 text-primary" />
              2. Top-Edge Progress Bar
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              A microscopic, glowing bar shoots across the top edge. It keeps the UI completely unblocked while signaling background activity (like YouTube or GitHub).
            </p>
            
            <div className="flex justify-between items-center bg-muted/20 p-4 rounded-lg border border-border/30">
              <span className="text-sm font-medium">Fetching 2,500 manifests...</span>
              <span className="text-sm text-primary font-mono">{Math.min(100, Math.round(progress))}%</span>
            </div>
          </div>

          {/* 3. Glassmorphic Pulse */}
          <div className="bg-card/60 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-primary" />
              3. Glassmorphic Pulse
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Instead of spinning, an icon gently pulses and breathes. Great for smaller components or buttons where a skeleton doesn't make sense.
            </p>
            
            <div className="flex justify-center items-center py-8">
              <div className="relative">
                {/* Pulsing ring */}
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                {/* Static center */}
                <div className="relative bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                  <Package className="w-8 h-8 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
