export function ScheduleSkeleton() {
  return (
    <div className="w-full h-full flex flex-col gap-4 animate-pulse">
      <div className="flex flex-col gap-3">
        {/* Stats Summary Bar Skeleton */}
        <div className="h-[46px] bg-card/40 border border-border rounded-lg w-full"></div>
        
        {/* Active Filters Bar Skeleton (empty space placeholder) */}
        <div className="h-8"></div>

        {/* Filters and Search Bar Skeleton */}
        <div className="flex justify-between items-center px-1">
          <div className="h-9 bg-card/60 border border-border rounded-lg w-64"></div>
          <div className="flex gap-3">
            <div className="h-9 bg-card/60 border border-border rounded-lg w-48"></div>
            <div className="h-9 bg-card/60 border border-border rounded-lg w-32"></div>
          </div>
        </div>
      </div>

      {/* Main Table Skeleton */}
      <div className="flex-1 bg-card rounded-xl border border-border shadow-sm"></div>
    </div>
  );
}
