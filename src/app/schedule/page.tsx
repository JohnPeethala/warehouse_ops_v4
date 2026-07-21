import { CalendarDays } from "lucide-react";
import { Metadata } from "next";
import { Suspense } from "react";
import { ScheduleData } from "./_components/ScheduleData";
import { ScheduleSkeleton } from "./_components/ScheduleSkeleton";
import { DateSelector } from "./_components/DateSelector";

export const dynamic = "force-dynamic";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const dateParam = typeof params.date === 'string' ? params.date : undefined;
  return (
    <div className="space-y-4 h-[calc(100vh-88px)] md:h-[calc(100vh-32px)] flex flex-col overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <CalendarDays className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">Schedule</h1>
        </div>
        <div className="flex items-center gap-2" id="schedule-header-actions">
          <DateSelector />
        </div>
      </div>
      
      <div className="flex-1 min-h-0 relative">
        <Suspense fallback={<ScheduleSkeleton />}>
          <ScheduleData date={dateParam} />
        </Suspense>
      </div>
    </div>
  )
}
