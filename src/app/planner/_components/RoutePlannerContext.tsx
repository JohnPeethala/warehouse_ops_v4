"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { usePlannerData } from '../_hooks/usePlannerData';
import { usePlannerSelection } from '../_hooks/usePlannerSelection';
import { usePlannerAssignments } from '../_hooks/usePlannerAssignments';

export interface Ticket {
  id: string;
  ticket_id: string;
  name: string;
  location: string;
  pincode: string;
  sub_category: string;
  route_name?: string;
}

export interface LocationGroup {
  id: string;
  serial: number;
  originalArea: string;
  sanitizedArea: string;
  pincode: string;
  tickets: Ticket[];
  coords: string;
}

export interface Category {
  name: string;
  icon_name: string;
  color: string;
}

interface RoutePlannerContextType {
  date: string;
  setDate: (date: string) => void;
  city: string;
  setCity: (city: string) => void;
  groups: LocationGroup[];
  categories: Category[];
  routes: string[]; 
  groupRoutes: Record<string, string>;
  ticketRoutes: Record<string, string>;
  unassignedCount: number;
  
  selectedGroupIds: Set<string>;
  isMultiSelectMode: boolean;
  toggleGroupSelection: (groupId: string, multi?: boolean) => void;
  clearGroupSelection: () => void;
  selectAllGroups: () => void;
  setMultiSelectMode: (mode: boolean) => void;
  bulkAssignGroupRoute: (routeName: string) => Promise<void>;

  fetchStateFromDB: () => Promise<void>;
  assignGroupRoute: (groupId: string, routeName: string) => Promise<void>;
  assignTicketRoute: (groupId: string, ticketId: string, routeName: string) => Promise<void>;
  updateCoords: (groupId: string, coords: string) => Promise<void>;
  addRoute: (routeName: string) => void;
  getRouteColor: (routeName: string) => { bgColor: string, textColor: string, borderColor: string };
}

const RoutePlannerContext = createContext<RoutePlannerContextType | undefined>(undefined);

export function RoutePlannerProvider({ children }: { children: React.ReactNode }) {
  const getNextDay = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return format(d, 'yyyy-MM-dd');
  };

  const [date, setDate] = useState<string>(getNextDay());
  
  // Custom Hooks for Logic
  const {
    city, setCity,
    groups,
    categories,
    routes, setRoutes,
    groupRoutes, setGroupRoutes,
    ticketRoutes, setTicketRoutes,
    fetchStateFromDB,
    updateCoords
  } = usePlannerData(date);

  const {
    selectedGroupIds,
    isMultiSelectMode,
    toggleGroupSelection,
    clearGroupSelection,
    selectAllGroups,
    setMultiSelectMode
  } = usePlannerSelection(groups);

  const {
    assignGroupRoute,
    assignTicketRoute,
    bulkAssignGroupRoute
  } = usePlannerAssignments({
    groups,
    setGroupRoutes,
    setTicketRoutes,
    selectedGroupIds,
    clearGroupSelection
  });
  
  const ROUTE_COLORS = [
    { bgColor: "bg-red-500", textColor: "text-red-500", borderColor: "border-l-red-500", hex: "#ef4444" },
    { bgColor: "bg-blue-500", textColor: "text-blue-500", borderColor: "border-l-blue-500", hex: "#3b82f6" },
    { bgColor: "bg-emerald-500", textColor: "text-emerald-500", borderColor: "border-l-emerald-500", hex: "#10b981" },
    { bgColor: "bg-amber-500", textColor: "text-amber-500", borderColor: "border-l-amber-500", hex: "#f59e0b" },
    { bgColor: "bg-indigo-500", textColor: "text-indigo-500", borderColor: "border-l-indigo-500", hex: "#6366f1" },
    { bgColor: "bg-pink-500", textColor: "text-pink-500", borderColor: "border-l-pink-500", hex: "#ec4899" },
    { bgColor: "bg-teal-500", textColor: "text-teal-500", borderColor: "border-l-teal-500", hex: "#14b8a6" },
    { bgColor: "bg-lime-500", textColor: "text-lime-500", borderColor: "border-l-lime-500", hex: "#84cc16" },
    { bgColor: "bg-cyan-500", textColor: "text-cyan-500", borderColor: "border-l-cyan-500", hex: "#06b6d4" },
    { bgColor: "bg-orange-500", textColor: "text-orange-500", borderColor: "border-l-orange-500", hex: "#f97316" },
    { bgColor: "bg-fuchsia-500", textColor: "text-fuchsia-500", borderColor: "border-l-fuchsia-500", hex: "#d946ef" },
    { bgColor: "bg-rose-500", textColor: "text-rose-500", borderColor: "border-l-rose-500", hex: "#f43f5e" }
  ];

  const getRouteColor = (routeName: string) => {
    const idx = routes.indexOf(routeName);
    if (idx === -1) return ROUTE_COLORS[0];
    return ROUTE_COLORS[idx % ROUTE_COLORS.length];
  };

  const addRoute = (routeName: string) => {
    if (!routes.includes(routeName)) {
      setRoutes(prev => [...prev, routeName].sort());
    }
  };

  const unassignedCount = groups.filter(g => !groupRoutes[g.id]).length;

  useEffect(() => {
    fetchStateFromDB();
  }, [date, fetchStateFromDB]);

  return (
    <RoutePlannerContext.Provider value={{
      date, setDate,
      city, setCity,
      groups, categories, routes, groupRoutes, ticketRoutes,
      unassignedCount,
      selectedGroupIds,
      isMultiSelectMode,
      toggleGroupSelection,
      clearGroupSelection,
      selectAllGroups,
      setMultiSelectMode,
      bulkAssignGroupRoute,
      assignGroupRoute,
      assignTicketRoute,
      updateCoords,
      addRoute,
      getRouteColor,
      fetchStateFromDB
    }}>
      {children}
    </RoutePlannerContext.Provider>
  );
}

export function useRoutePlanner() {
  const context = useContext(RoutePlannerContext);
  if (context === undefined) {
    throw new Error('useRoutePlanner must be used within a RoutePlannerProvider');
  }
  return context;
}
