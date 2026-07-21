import { Radar } from "lucide-react";
import { Metadata } from "next";
import { Suspense } from "react";
import { DateSelector } from "@/app/schedule/_components/DateSelector";
import { LiveTrackerClient } from "./LiveTrackerClient";
import { getLiveTrackerData } from "@/app/actions/live";

export const dynamic = "force-dynamic";



export default async function LiveTrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const dateParam = typeof params.date === 'string' ? params.date : undefined;
  
  // Fetch initial server data
  const { tickets, lookups, categories, isAuth, error } = await getLiveTrackerData(dateParam);

  return (
    <div className="space-y-4 h-[calc(100vh-88px)] md:h-[calc(100vh-32px)] flex flex-col overflow-hidden p-8 pt-0">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <Radar className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">Live Tracker</h1>
        </div>
        <div className="flex items-center gap-2">
          <DateSelector />
        </div>
      </div>
      
      <div className="flex-1 min-h-0 relative">
        <LiveTrackerClient 
          initialTickets={tickets || []} 
          lookups={lookups || []} 
          categories={categories || []}
          targetDate={dateParam || new Date().toLocaleDateString('en-CA')}
          isAuth={isAuth}
          error={error}
        />
      </div>
    </div>
  );
}
