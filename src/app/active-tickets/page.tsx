import { Ticket } from "lucide-react";
import { Metadata } from "next";
import { Suspense } from "react";
import { ActiveTicketsData } from "./_components/ActiveTicketsData";
import { ActiveTicketsSkeleton } from "./_components/ActiveTicketsSkeleton";

export const dynamic = "force-dynamic";



export default function ActiveTicketsPage() {
  return (
    <div className="space-y-4 h-[calc(100vh-88px)] md:h-[calc(100vh-32px)] flex flex-col overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <Ticket className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">Active Tickets</h1>
        </div>
        <div className="flex items-center gap-2" id="header-actions">
        </div>
      </div>
      
      <div className="flex-1 min-h-0 relative">
        <Suspense fallback={<ActiveTicketsSkeleton />}>
          <ActiveTicketsData />
        </Suspense>
      </div>
    </div>
  )
}
