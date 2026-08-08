import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Truck, Users } from "lucide-react";

export function DailyCrewCarousel({ days }: { days: any[] }) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -410 : 410, behavior: "smooth" });
  };

  if (!days || days.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <p className="text-sm text-muted-foreground italic text-center py-4">No crew data available for the last 7 days.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">Daily Crew Summary</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Per-vehicle crew breakdown · yesterday and earlier</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => scroll("left")} className="p-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => scroll("right")} className="p-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-4 overflow-x-auto custom-scrollbar pb-2 scroll-smooth">
        {days.map((day, i) => {
          const total = day.crews.reduce((s: number, c: any) => s + c.total, 0);
          const done = day.crews.reduce((s: number, c: any) => s + c.done, 0);
          const pending = day.crews.reduce((s: number, c: any) => s + c.pending, 0);
          const notDone = day.crews.reduce((s: number, c: any) => s + c.notDone, 0);
          const donePerVehicle = day.crews.length > 0 ? parseFloat((done / day.crews.length).toFixed(1)) : 0;

          return <CrewDayCard key={day.date} day={day} i={i} total={total} done={done} pending={pending} notDone={notDone} donePerVehicle={donePerVehicle} />;
        })}
      </div>
    </div>
  );
}

function CrewDayCard({ day, i, total, done, pending, notDone, donePerVehicle }: {
  day: any;
  i: number; total: number; done: number; pending: number; notDone: number; donePerVehicle: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0, transition: { delay: i * 0.06, duration: 0.35 } }}
      className="flex-none w-[390px] flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden"
    >
      {/* Card Header */}
      <div className="px-5 py-3 flex items-center justify-between bg-muted/40 border-b border-border">
        <p className="text-sm font-black tracking-tight text-foreground">{day.dateLabel}</p>
        {day.relativeLabel && (
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold uppercase tracking-widest">
            {day.relativeLabel}
          </span>
        )}
      </div>
      {/* Stats Row */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border bg-muted/20">
        <div className="px-4 py-2.5 flex flex-col">
          <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Total</span>
          <span className="text-xl font-black text-foreground leading-tight">{total}</span>
        </div>
        <div className="px-4 py-2.5 flex flex-col">
          <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Done/Veh</span>
          <span className="text-xl font-black text-emerald-600 leading-tight">{donePerVehicle}</span>
        </div>
        <div className="px-4 py-2.5 flex flex-col">
          <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Done / Not Done</span>
          <div className="flex items-baseline gap-1 mt-0.5 uppercase">
            <span className="text-xl font-black text-emerald-600 leading-tight">{done}</span>
            <span className="text-muted-foreground/40 text-sm">/</span>
            <span className="text-xl font-black text-rose-500 leading-tight">{notDone}</span>
          </div>
        </div>
      </div>

      {/* Crew Rows */}
      <div className="divide-y divide-border/40 flex-1 overflow-y-auto custom-scrollbar">
        {day.crews.map((crew: any, ci: number) => (
          <div key={ci} className="px-5 py-3 hover:bg-muted/20 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <Users size={12} className="text-muted-foreground shrink-0" />
                  <span className="text-xs font-black text-foreground truncate">
                    {[crew.gt1, crew.gt2].filter(Boolean).join(" · ") || "—"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-muted-foreground leading-snug">
                  <span className="truncate col-span-2"><span className="font-semibold text-foreground/80">Driver:</span> {crew.driver || "—"}</span>
                  <span className="truncate col-span-2">
                    <span className="font-semibold text-foreground/80">Vehicle:</span> {crew.vehicle || "—"}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-sm font-black text-foreground">{crew.total}</span>
                <div className="flex gap-1 text-xs font-bold uppercase">
                  <span className="text-emerald-500">{crew.done}</span>
                  <span className="text-muted-foreground/30">/</span>
                  <span className="text-rose-500">{crew.notDone}</span>
                </div>
                {crew.km > 0 ? (
                  <span className={`mt-1 px-2 py-0.5 rounded-full border text-[9px] uppercase tracking-wider font-bold ${
                    crew.km > 100
                      ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                      : "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
                  }`}>
                    {crew.km} km
                  </span>
                ) : (
                  <span className="mt-1 px-2 py-0.5 rounded-full border border-border bg-muted/30 text-[9px] uppercase tracking-wider font-bold text-muted-foreground opacity-0">
                    — km
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
