import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { DashboardFunnel } from "@/app/actions/dashboard";

const staggerContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 20, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" as const } },
};

function KpiCard({ title, value, icon: Icon, color, bg, href, trend }: { title: React.ReactNode, value: number | string, icon: any, color: string, bg: string, href?: string, trend?: { val: number, text: string } }) {
  // Extract text color from bg/color classes for the large icon
  const iconColorClass = color.replace('text-', 'text-');
  
  const content = (
    <motion.div
      className={`relative overflow-hidden rounded-2xl border border-border/50 bg-white/40 dark:bg-zinc-900/40 p-6 backdrop-blur-xl shadow-sm transition-all hover:shadow-md hover:bg-white/60 dark:hover:bg-zinc-900/60 group h-full flex flex-col justify-between ${href ? 'cursor-pointer' : ''}`}
      whileHover={href ? { y: -2 } : {}}
      whileTap={href ? { scale: 0.98 } : {}}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-20 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500 pointer-events-none">
        <Icon className={`w-32 h-32 ${iconColorClass} -mr-8 -mt-8`} />
      </div>
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-center gap-2 mb-4">
          <div className={`p-1.5 rounded-lg ${bg} ${color}`}>
            <Icon className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <h3 className="font-semibold text-sm tracking-widest uppercase text-muted-foreground mt-0.5">{title}</h3>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-4xl font-black text-foreground tracking-tight leading-none">{value}</span>
          {trend && (
            <span className={`text-[10px] font-bold flex items-center gap-0.5 px-2 py-1 rounded-md ${trend.val > 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
              {trend.val > 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
              {trend.text}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
  return href ? <Link href={href} className="block h-full">{content}</Link> : content;
}

export function KpiSection({ funnel }: { funnel: DashboardFunnel }) {
  return (
    <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" variants={staggerContainer}>
      <motion.div variants={staggerItem}>
        <KpiCard href="/dashboard" title="Total Tickets" value={funnel.totalTickets} icon={LucideIcons.Package} color="text-blue-500" bg="bg-blue-500/10" />
      </motion.div>
      <motion.div variants={staggerItem}>
        <KpiCard href="/dashboard" title="Scheduled Today" value={funnel.scheduledToday} icon={LucideIcons.Truck} color="text-emerald-500" bg="bg-emerald-500/10" />
      </motion.div>
      <motion.div variants={staggerItem}>
        <KpiCard href="/dashboard" title="Pending" value={funnel.pending} icon={LucideIcons.Timer} color="text-amber-500" bg="bg-amber-500/10" />
      </motion.div>
      <motion.div variants={staggerItem}>
        <KpiCard href="/dashboard" title="Backdated Active" value={funnel.backdatedActive} icon={LucideIcons.ShieldAlert} color="text-rose-500" bg="bg-rose-500/10" />
      </motion.div>
    </motion.div>
  );
}
