"use client";

import { Users, Truck, FileText, Settings, MapPin } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "team";

  return (
    <div className="space-y-4 h-[calc(100vh-88px)] md:h-[calc(100vh-32px)] flex flex-col overflow-hidden w-full">
      {/* Top Header & Tabs */}
      <div className="shrink-0 flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">System Configuration</h1>
        </div>
        
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar border-b border-border pb-1">
          <TabItem icon={<Users className="w-4 h-4" />} label="Team & Roles" tabId="team" activeTab={activeTab} />
          <TabItem icon={<Truck className="w-4 h-4" />} label="Vehicles" tabId="vehicles" activeTab={activeTab} />
          <TabItem icon={<FileText className="w-4 h-4" />} label="Ticket Statuses" tabId="lookups" activeTab={activeTab} />
          <TabItem icon={<MapPin className="w-4 h-4" />} label="Locations" tabId="locations" activeTab={activeTab} />
          <TabItem icon={<FileText className="w-4 h-4" />} label="Reports Download" tabId="reports" activeTab={activeTab} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 relative overflow-y-auto w-full pb-10">
        {children}
      </div>
    </div>
  );
}

function TabItem({ icon, label, tabId, activeTab }: { icon: React.ReactNode, label: string, tabId: string, activeTab: string }) {
  const isActive = activeTab === tabId;
  return (
    <Link
      href={`?tab=${tabId}`}
      className={`flex items-center gap-2 pb-3 border-b-2 text-sm transition-colors whitespace-nowrap ${
        isActive 
          ? "border-primary text-primary font-bold" 
          : "border-transparent text-foreground/60 hover:text-foreground hover:border-border"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
