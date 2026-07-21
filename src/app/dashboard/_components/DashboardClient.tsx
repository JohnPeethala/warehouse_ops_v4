"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, Camera } from "lucide-react";
import type { DashboardFunnel, SubCategorySplit } from "@/app/actions/dashboard";
import { KpiSection } from "./KpiSection";
import { TicketCompositionChart } from "./TicketCompositionChart";
import { TrendChart } from "./TrendChart";
import { DailyCrewCarousel } from "./DailyCrewCarousel";

const staggerContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const fadeUp = (delay: number = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { delay, duration: 0.4 } }
});

export function DashboardClient({ 
  funnel, 
  subCategorySplit, 
  futureSchedule,
  dailyCrewSummary 
}: { 
  funnel: DashboardFunnel; 
  subCategorySplit: SubCategorySplit[]; 
  futureSchedule: any[];
  dailyCrewSummary: any[];
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "team">("overview");

  return (
    <div className="w-full p-2 md:p-6">
      <div className="w-full mx-auto space-y-6 pb-24">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <LayoutDashboard className="text-primary" />
              Dashboard
            </h1>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 font-bold rounded-lg transition-colors text-sm bg-primary/10 hover:bg-primary/20 text-primary">
              <Camera size={16} /> Snapshot
            </button>

            <div className="flex bg-muted/50 p-1 rounded-xl w-fit">
              <button 
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "overview" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab("team")}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "team" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Team & Fleet
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Content */}
        <div className="w-full">
          {activeTab === "overview" && (
            <motion.div className="space-y-6 pb-12" variants={staggerContainer} initial="initial" animate="animate">
              <KpiSection funnel={funnel} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <TicketCompositionChart subCategorySplit={subCategorySplit} />
                <TrendChart futureSchedule={futureSchedule} subCategorySplit={subCategorySplit} />
              </div>
            </motion.div>
          )}

          {activeTab === "team" && (
            <div className="bg-card border border-border border-dashed rounded-xl p-12 shadow-sm h-48 flex items-center justify-center text-muted-foreground">
              Team & Fleet performance data will go here
            </div>
          )}

          {activeTab === "overview" && dailyCrewSummary && dailyCrewSummary.length > 0 && (
            <motion.div {...fadeUp(0.2)} className="mt-6">
              <DailyCrewCarousel days={dailyCrewSummary} />
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
