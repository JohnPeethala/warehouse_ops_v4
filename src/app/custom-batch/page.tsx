import { History, Edit } from "lucide-react";
import { Suspense } from "react";
import { CustomBatchData } from "./_components/CustomBatchData";
import { ActiveTicketsSkeleton } from "../active-tickets/_components/ActiveTicketsSkeleton";
import { UpdateBatchButton } from "./_components/UpdateBatchButton";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Custom batch | Warehouse Ops',
}

export const dynamic = "force-dynamic";

export default function CustomBatchPage() {
  return (
    <div className="space-y-4 h-[calc(100vh-88px)] md:h-[calc(100vh-32px)] flex flex-col overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <History className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">Custom batch</h1>
        </div>
        <div className="flex items-center gap-2" id="header-actions">
          <UpdateBatchButton />
        </div>
      </div>
      
      <div className="flex-1 min-h-0 relative">
        <Suspense fallback={<ActiveTicketsSkeleton />}>
          <CustomBatchData />
        </Suspense>
      </div>
    </div>
  )
}
