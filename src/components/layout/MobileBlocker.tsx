"use client";

import { useEffect, useState } from "react";
import { MonitorSmartphone, Monitor } from "lucide-react";

export function MobileBlocker({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint (Tailwind default is 1024px)
    };
    
    // Initial check
    checkMobile();
    
    // Listen for resize
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Avoid hydration mismatch by rendering nothing until we know the screen size
  if (isMobile === null) return null;

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[1000] bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 shadow-sm">
          <MonitorSmartphone size={40} strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-3">
          Desktop Required
        </h1>
        <p className="text-base text-muted-foreground max-w-sm mb-8 leading-relaxed">
          The Warehouse Operations Admin Dashboard is designed for large screens to handle complex tables and data density.
        </p>
        <div className="flex items-center gap-3 px-6 py-4 bg-muted/30 border border-border rounded-xl">
          <Monitor size={24} className="text-muted-foreground" />
          <span className="text-sm font-medium text-foreground text-left">
            Please switch to a laptop or desktop computer to access this panel.
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
