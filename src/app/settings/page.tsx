import { createClient } from "@/lib/supabase/server";
import { SettingsLayout } from "./_components/SettingsLayout";
import { TeamManager } from "./_components/TeamManager";
import { VehiclesManager } from "./_components/VehiclesManager";
import { LookupStatusManager } from "./_components/LookupStatusManager";
import { GeoLocationsManager } from "./_components/GeoLocationsManager";
import { ReportsManager } from "./_components/ReportsManager";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const supabase = await createClient();
  const resolvedParams = await searchParams;
  const activeTab = resolvedParams.tab || "team";
  
  // Basic Auth Check (In a real app, use middleware or layout)
  // We check if there's any active session and user profile. If they aren't admin, redirect.
  // Assuming 'role' is part of some session state or we check it manually:
  // For now, we will simply load the data directly. Real role-based access control should be implemented via auth layer.

  let data: any = null;
  
  if (activeTab === "team") {
    const { data: teamData } = await supabase.from("core_profiles").select("*").order("created_at", { ascending: false });
    data = teamData;
  } else if (activeTab === "vehicles") {
    const { data: vehiclesData } = await supabase.from("core_vehicles").select("*").order("vehicle_no");
    data = vehiclesData;
  } else if (activeTab === "lookups") {
    const { data: lookupsData } = await supabase.from("cfg_lookups").select("*").eq("domain", "TICKET").order("order_idx").order("status");
    data = lookupsData;
  } else if (activeTab === "locations") {
    const { data: locationsData } = await supabase.from("cfg_geo_zones").select("*").order("area");
    data = locationsData;
  } else if (activeTab === "reports") {
    const { data: profiles } = await supabase.from("core_profiles").select("*");
    const { data: vehicles } = await supabase.from("core_vehicles").select("*");
    data = { profiles: profiles || [], vehicles: vehicles || [] };
  }

  return (
    <SettingsLayout>
      <div className="w-full">
        {activeTab === "team" && <TeamManager initialData={data || []} />}
        {activeTab === "vehicles" && <VehiclesManager initialData={data || []} />}
        {activeTab === "lookups" && <LookupStatusManager initialData={data || []} />}
        {activeTab === "locations" && <GeoLocationsManager initialData={data || []} />}
        {activeTab === "reports" && <ReportsManager initialData={data || { profiles: [], vehicles: [] }} />}
      </div>
    </SettingsLayout>
  )
}
