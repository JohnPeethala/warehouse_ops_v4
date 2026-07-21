import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Camera, Truck } from "lucide-react";

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
      className="flex-none w-[390px] rounded-xl border border-border bg-card shadow-sm overflow-hidden"
    >
      {/* Card Header */}
      <div className="px-5 py-3 flex items-center justify-between bg-muted/40 border-b border-border">
        <p className="text-sm font-black tracking-tight text-foreground">{day.dateLabel}</p>
        <button title="Capture card" className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Camera size={13} />
        </button>
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
          <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Done / Pend / ND</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-emerald-600 leading-tight">{done}</span>
            <span className="text-muted-foreground/40 text-sm">/</span>
            <span className="text-xl font-black text-amber-500 leading-tight">{pending}</span>
            <span className="text-muted-foreground/40 text-sm">/</span>
            <span className="text-xl font-black text-rose-500 leading-tight">{notDone}</span>
          </div>
        </div>
      </div>

      {/* Crew Rows */}
      <div className="divide-y divide-border/40">
        {day.crews.map((crew: any, ci: number) => (
          <div key={ci} className="px-5 py-3 hover:bg-muted/20 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <Truck size={12} className="text-muted-foreground shrink-0" />
                  <span className="text-xs font-black text-foreground truncate">{crew.vehicle}</span>
                  {crew.km > 0 && (
                    <span className="ml-auto text-xs font-bold text-muted-foreground shrink-0">{crew.km} km</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-muted-foreground leading-snug">
                  <span className="truncate col-span-2"><span className="font-semibold text-foreground/80">Driver:</span> {crew.driver || "—"}</span>
                  <span className="truncate col-span-2">
                    <span className="font-semibold text-foreground/80">GT:</span>{" "}
                    {[crew.gt1, crew.gt2].filter(Boolean).join(" · ") || "—"}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-sm font-black text-foreground">{crew.total}</span>
                <div className="flex gap-1 text-xs font-bold">
                  <span className="text-emerald-500">{crew.done}</span>
                  <span className="text-muted-foreground/30">/</span>
                  <span className="text-amber-500">{crew.pending}</span>
                  {crew.notDone > 0 && <><span className="text-muted-foreground/30">/</span><span className="text-rose-500">{crew.notDone}</span></>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
