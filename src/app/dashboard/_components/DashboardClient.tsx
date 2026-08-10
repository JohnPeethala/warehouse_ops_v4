"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, Camera, ChevronDown, Download, Copy } from "lucide-react";
import type { DashboardFunnel, SubCategorySplit } from "@/app/actions/dashboard";
import { KpiSection } from "./KpiSection";
import { TicketCompositionChart } from "./TicketCompositionChart";
import { TrendChart } from "./TrendChart";
import { DailyCrewCarousel } from "./DailyCrewCarousel";
import { HistoricalTrendChart } from "./HistoricalTrendChart";
import { TeamTab } from "./TeamTab";

import { toPng, toBlob } from "html-to-image";
import { toast } from "sonner";

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
  dailyCrewSummary,
  historicalCompletion
}: { 
  funnel: DashboardFunnel; 
  subCategorySplit: SubCategorySplit[]; 
  futureSchedule: any[];
  dailyCrewSummary: any[];
  historicalCompletion: any[];
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "team">("overview");
  const [isTakingSnapshot, setIsTakingSnapshot] = useState(false);
  const [showSnapshotMenu, setShowSnapshotMenu] = useState(false);

  const handleSnapshot = async (action: 'download' | 'copy') => {
    setShowSnapshotMenu(false);
    const element = document.getElementById("dashboard-snapshot-area");
    if (!element) return;
    
    setIsTakingSnapshot(true);
    const loadingToast = toast.loading(`Generating snapshot for ${action}...`);
    
    try {
      // Small delay to ensure any layout shifts are settled
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const bgColor = window.getComputedStyle(document.body).backgroundColor;
      const opts = { 
        cacheBust: true,
        backgroundColor: bgColor || "#09090b",
        width: element.scrollWidth + 32,
        height: element.scrollHeight + 32,
        style: { margin: "0", padding: "16px" }
      };

      if (action === 'download') {
        const dataUrl = await toPng(element, opts);
        const link = document.createElement("a");
        link.download = `dashboard-snapshot-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = dataUrl;
        link.click();
        toast.success("Snapshot downloaded!", { id: loadingToast });
      } else {
        const blob = await toBlob(element, opts);
        if (!blob) throw new Error("Failed to create blob");
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ]);
        toast.success("Snapshot copied to clipboard!", { id: loadingToast });
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${action} snapshot`, { id: loadingToast });
    } finally {
      setIsTakingSnapshot(false);
    }
  };

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
            <div className="relative">
              <button 
                onClick={() => setShowSnapshotMenu(!showSnapshotMenu)}
                disabled={isTakingSnapshot}
                className="flex items-center gap-2 px-4 py-2 font-bold rounded-lg transition-colors text-sm bg-primary/10 hover:bg-primary/20 text-primary disabled:opacity-50"
              >
                <Camera size={16} /> {isTakingSnapshot ? "Capturing..." : "Snapshot"} <ChevronDown size={14} />
              </button>
              
              {showSnapshotMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSnapshotMenu(false)} />
                  <div className="absolute top-full left-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden flex flex-col p-1">
                    <button onClick={() => handleSnapshot('copy')} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg hover:bg-muted transition-colors text-left w-full text-foreground">
                      <Copy size={16} /> Copy to Clipboard
                    </button>
                    <button onClick={() => handleSnapshot('download')} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg hover:bg-muted transition-colors text-left w-full text-foreground">
                      <Download size={16} /> Download PNG
                    </button>
                  </div>
                </>
              )}
            </div>

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
            <motion.div id="dashboard-snapshot-area" className="space-y-6" variants={staggerContainer} initial="initial" animate="animate">
              <KpiSection funnel={funnel} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <TicketCompositionChart subCategorySplit={subCategorySplit} />
                <TrendChart futureSchedule={futureSchedule} subCategorySplit={subCategorySplit} />
              </div>
            </motion.div>
          )}

          {activeTab === "team" && (
            <motion.div variants={staggerContainer} initial="initial" animate="animate">
              <TeamTab />
            </motion.div>
          )}

          {activeTab === "overview" && dailyCrewSummary && dailyCrewSummary.length > 0 && (
            <motion.div {...fadeUp(0.2)} className="mt-6">
              <DailyCrewCarousel days={dailyCrewSummary} />
            </motion.div>
          )}

          {activeTab === "overview" && historicalCompletion && historicalCompletion.length > 0 && (
            <motion.div {...fadeUp(0.25)}>
              <HistoricalTrendChart historicalCompletion={historicalCompletion} />
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
