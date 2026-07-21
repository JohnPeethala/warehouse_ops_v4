'use client'

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Route,
  Ticket,
  Settings,
  Sun,
  Moon,
  LogOut,
  Radar,
  StickyNote,
  CalendarDays,
  Target,
  Warehouse,
  ClipboardList
} from "lucide-react"
import classNames from "classnames"
import { createClient } from "@/lib/supabase/client"
import { ManifestUploader } from "@/components/features/ManifestUploader"

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Active Tickets", href: "/active-tickets", icon: Ticket },
  { name: 'Schedule', icon: CalendarDays, href: '/schedule' },
  { name: 'Route Planner', icon: Route, href: '/planner' },
  { name: 'Live Tracker', icon: Radar, href: '/live' },
  { name: 'Custom Batch', icon: ClipboardList, href: '/custom-batch' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isHovered, setIsHovered] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [profile, setProfile] = useState<{name: string, role: string} | null>(null)
  const supabase = createClient()


  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('core_profiles').select('name, role').eq('id', user.id).single()
        
        const emailPrefix = user.email?.split('@')[0] || ''
        const isPhone = /^\+?[\d\s\-]+$/.test(emailPrefix)
        const fallbackName = user.user_metadata?.name || (isPhone ? 'User' : emailPrefix) || 'User'

        if (data) {
          setProfile({
            name: data.name || fallbackName,
            role: data.role || 'admin'
          })
        } else {
          setProfile({ name: fallbackName, role: 'admin' })
        }
      }
    }
    loadUser()
  }, [supabase])

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "dark" || (!savedTheme && document.documentElement.classList.contains("dark"))) {
      setIsDarkMode(true)
      document.documentElement.classList.add("dark")
    } else if (savedTheme === "light") {
      setIsDarkMode(false)
      document.documentElement.classList.remove("dark")
    }
  }, [])

  if (pathname === '/login') return null;

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
      setIsDarkMode(false)
    } else {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
      setIsDarkMode(true)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const showExpanded = isHovered

  // Only show advanced items for admins
  const displayItems = [...navItems]
  if (profile?.role === 'admin') {
    displayItems.push({ name: "Settings", href: "/settings", icon: Settings })
  }

  return (
    <aside
      className={classNames(
        "print:hidden hidden md:flex fixed left-0 top-0 z-50 flex-col justify-between transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] h-screen",
        // Sidebar is always dark (#171717)
        "bg-[#171717] text-neutral-50 border-r border-neutral-800 shadow-2xl shadow-black/20",
        showExpanded ? "w-64" : "w-16"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col h-full relative">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 dark:border-zinc-200 h-16 shrink-0">
          <div className="flex items-center justify-center min-w-[32px]">
            {/* Monochrome Logo */}
            <motion.div 
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5, ease: "anticipate" }}
              className="w-8 h-8 rounded-lg bg-neutral-800 text-neutral-100 border border-neutral-700 flex items-center justify-center font-bold text-lg"
            >
              W
            </motion.div>
          </div>
          <AnimatePresence>
            {showExpanded && (
              <motion.span 
                initial={{ opacity: 0, width: 0, x: -10 }}
                animate={{ opacity: 1, width: "auto", x: 0 }}
                exit={{ opacity: 0, width: 0, x: -10 }}
                transition={{ duration: 0.3 }}
                className="ml-3 font-semibold whitespace-nowrap overflow-hidden tracking-tight"
              >
                Warehouse Ops
              </motion.span>
            )}
          </AnimatePresence>
          <div className="flex-1" />
        </div>

        <nav className="flex-1 py-4 overflow-y-auto space-y-1 px-2 custom-scrollbar">
          {displayItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={classNames(
                  "flex items-center p-2 rounded-lg transition-all duration-200 group relative",
                  isActive
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-neutral-400 hover:bg-white/10 hover:text-white hover:translate-x-1"
                )}
                title={!showExpanded ? item.name : undefined}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeNavIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-neutral-100 rounded-r-full" 
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className="flex items-center justify-center min-w-[32px] transition-transform duration-200 group-hover:scale-110">
                  <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <AnimatePresence>
                  {showExpanded && (
                    <motion.span 
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      className="ml-3 text-sm font-medium whitespace-nowrap"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Profile and Actions */}
        <div className="p-3 border-t border-neutral-800 flex flex-col gap-1 shrink-0 bg-[#171717]">
          {profile && (
            <div className="flex items-center w-full p-2 mb-2 rounded-lg group transition-all duration-200 hover:bg-white/10 cursor-default">
              <div className="flex items-center justify-center min-w-[32px] w-8 h-8 rounded-full bg-neutral-800 text-neutral-100 font-bold text-sm shrink-0 border border-neutral-700 transition-transform duration-300 group-hover:scale-110">
                {profile.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <AnimatePresence>
                {showExpanded && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="ml-3 flex flex-col overflow-hidden whitespace-nowrap"
                  >
                    <span className="text-sm font-semibold truncate leading-tight text-neutral-100">{profile.name}</span>
                    <span className="text-[11px] text-neutral-400 truncate capitalize font-medium">{profile.role}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <ManifestUploader variant="sidebar" showExpanded={showExpanded} />

          <button
            onClick={toggleTheme}
            className="flex items-center w-full p-2 rounded-lg text-neutral-400 hover:bg-white/10 hover:text-white transition-colors group"
          >
            <div className="flex items-center justify-center min-w-[32px] group-hover:scale-110 transition-transform">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </div>
            <AnimatePresence>
              {showExpanded && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="ml-3 text-sm font-medium whitespace-nowrap">
                  {isDarkMode ? "Light Mode" : "Dark Mode"}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center w-full p-2 rounded-lg text-rose-500/90 hover:bg-rose-500/15 hover:text-rose-400 transition-colors group"
          >
            <div className="flex items-center justify-center min-w-[32px] group-hover:scale-110 transition-transform">
              <LogOut className="w-5 h-5" />
            </div>
            <AnimatePresence>
              {showExpanded && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="ml-3 text-sm font-medium whitespace-nowrap">
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </aside>
  )
}
