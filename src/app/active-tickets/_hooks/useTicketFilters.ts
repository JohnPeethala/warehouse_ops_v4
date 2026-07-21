import { useState, useMemo } from "react";
import type { EnrichedTicket, TicketAnnotation, SortConfig } from "../_components/types";

export function useTicketFilters(data: EnrichedTicket[], annotationsMap: Record<string, TicketAnnotation>, selectedIds: Set<string>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [colFilters, setColFilters] = useState<Record<string, Set<string> | null>>({
    check: null,
    prio: null,
    schedule: null,
    date: null,
    tags: null,
    ops: null,
    contactName: null,
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
  };

  const removeFilter = (key: string, val: string) => {
    setColFilters(prev => {
      const set = prev[key];
      if (!set) return prev;
      const newSet = new Set(set);
      newSet.delete(val);
      return { ...prev, [key]: newSet.size === 0 ? null : newSet };
    });
  };

  const clearAllFilters = () => setColFilters({});

  const filterOptions = useMemo(() => {
    const prioMap = new Map<string, number>();
    const dateMap = new Map<string, number>();
    const tagsMap = new Map<string, number>();
    const opsMap = new Map<string, number>();
    const checkMap = new Map<string, number>();
    const scheduleMap = new Map<string, number>();

    const searchTerms = searchQuery
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
      .map(t => t.startsWith('#') ? t.substring(1).toLowerCase() : t.toLowerCase());

    data.forEach(t => {
      const activeAnnotation = annotationsMap[t.ticket_id] || t.annotation;
      
      const isChecked = selectedIds.has(t.id) ? "Checked" : "Unchecked";
      const prio = (activeAnnotation?.priority_tag || "").toLowerCase();
      
      let scheduleStatusLabel = "Unscheduled";
      if (t.latest_schedule_date) {
        const today = new Date();
        const tzOffset = today.getTimezoneOffset() * 60000;
        const todayStr = (new Date(today.getTime() - tzOffset)).toISOString().split('T')[0];
        
        if (t.latest_schedule_date === todayStr) {
          scheduleStatusLabel = "Today";
        } else if (t.latest_schedule_date < todayStr) {
          scheduleStatusLabel = "Past";
        } else {
          scheduleStatusLabel = "Future";
        }
      }
      
      const dateKey = (!t.date || t.date.startsWith("1970-01-01")) ? "-" : t.date;
      
      const rawTags = t.raw_tags || "";
      const tagsList = rawTags.trim() ? rawTags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      const subCat = t.sub_category || "";

      let passesSearch = true;
      if (searchTerms.length > 0) {
        const name = (t.annotation?.contact_name || t.contact_name || "").toLowerCase();
        const id = t.ticket_id.toLowerCase();
        const phone = (t.phone || "").toLowerCase();
        const sub = subCat.toLowerCase();
        const tagsStr = rawTags.toLowerCase();
        const address = (t.address1 || "").toLowerCase();
        const loc = (t.annotation?.location || "").toLowerCase();
        passesSearch = searchTerms.some(term => 
          name.includes(term) || id.includes(term) || phone.includes(term) || sub.includes(term) || tagsStr.includes(term) || address.includes(term) || loc.includes(term)
        );
      }

      const passCheck = !colFilters.check || colFilters.check.has(isChecked);
      const passPrio = !colFilters.prio || colFilters.prio.has(prio);
      const passSchedule = !colFilters.schedule || colFilters.schedule.has(scheduleStatusLabel);
      const passDate = !colFilters.date || colFilters.date.has(dateKey);
      const passTags = !colFilters.tags || colFilters.tags.size === 0 || (tagsList.length === 0 ? colFilters.tags.has("") : tagsList.some(tag => colFilters.tags!.has(tag)));
      const passOps = !colFilters.ops || colFilters.ops.size === 0 || colFilters.ops.has(subCat);

      if (passesSearch && passPrio && passSchedule && passDate && passTags && passOps) {
        checkMap.set(isChecked, (checkMap.get(isChecked) || 0) + 1);
      }
      if (passesSearch && passCheck && passSchedule && passDate && passTags && passOps) {
        prioMap.set(prio, (prioMap.get(prio) || 0) + 1);
      }
      if (passesSearch && passCheck && passPrio && passDate && passTags && passOps) {
        scheduleMap.set(scheduleStatusLabel, (scheduleMap.get(scheduleStatusLabel) || 0) + 1);
      }
      if (passesSearch && passCheck && passPrio && passSchedule && passTags && passOps) {
        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
      }
      if (passesSearch && passCheck && passPrio && passSchedule && passDate && passOps) {
        if (tagsList.length > 0) {
          tagsList.forEach(tag => tagsMap.set(tag, (tagsMap.get(tag) || 0) + 1));
        } else {
          tagsMap.set("", (tagsMap.get("") || 0) + 1);
        }
      }
      if (passesSearch && passCheck && passPrio && passSchedule && passDate && passTags) {
        opsMap.set(subCat, (opsMap.get(subCat) || 0) + 1);
      }
    });

    const toOptions = (map: Map<string, number>) => Array.from(map.entries()).map(([label, count]) => ({ label, count })).sort((a, b) => a.label.localeCompare(b.label));

    return {
      check: toOptions(checkMap),
      prio: toOptions(prioMap),
      schedule: toOptions(scheduleMap),
      date: toOptions(dateMap),
      tags: toOptions(tagsMap),
      ops: toOptions(opsMap),
    };
  }, [data, annotationsMap, selectedIds, colFilters, searchQuery]);

  const activeFilters = useMemo(() => {
    const list: { key: string, val: string, label: string }[] = [];
    Object.entries(colFilters).forEach(([key, set]) => {
      if (set && set.size > 0) {
        set.forEach(val => {
          let displayVal = val;
          if (val === '') displayVal = '(Blank)';
          if (key === 'date' && val !== 'Unknown') {
            try {
              displayVal = new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
            } catch {
              displayVal = val;
            }
          }
          let labelPrefix = key.charAt(0).toUpperCase() + key.slice(1);
          if (key === 'contactName') labelPrefix = "Name";
          list.push({ key, val, label: `${labelPrefix}: ${displayVal}` });
        });
      }
    });
    return list;
  }, [colFilters]);

  const filteredData = useMemo(() => {
    let result = data;

    if (searchQuery.trim()) {
      const searchTerms = searchQuery
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
        .map(t => {
          if (t.startsWith('#')) return t.substring(1).toLowerCase();
          return t.toLowerCase();
        });

      if (searchTerms.length > 0) {
        result = result.filter((t) => {
          const name = (t.annotation?.contact_name || t.contact_name || "").toLowerCase();
          const id = t.ticket_id.toLowerCase();
          const phone = (t.phone || "").toLowerCase();
          const sub = (t.sub_category || "").toLowerCase();
          const tags = (t.raw_tags || "").toLowerCase();
          const address = (t.address1 || "").toLowerCase();
          const loc = (t.annotation?.location || "").toLowerCase();

          return searchTerms.some(term => {
            return name.includes(term) || 
                   id.includes(term) || 
                   phone.includes(term) || 
                   sub.includes(term) || 
                   tags.includes(term) || 
                   address.includes(term) || 
                   loc.includes(term);
          });
        });
      }
    }

    if (colFilters.check) {
      result = result.filter(t => colFilters.check!.has(selectedIds.has(t.id) ? "Checked" : "Unchecked"));
    }
    if (colFilters.prio) {
      result = result.filter(t => {
        const activeAnnotation = annotationsMap[t.ticket_id] || t.annotation;
        const prio = (activeAnnotation?.priority_tag || "").toLowerCase();
        return colFilters.prio!.has(prio);
      });
    }
    if (colFilters.schedule) {
      result = result.filter(t => {
        let scheduleStatusLabel = "Unscheduled";
        if (t.latest_schedule_date) {
          const today = new Date();
          const tzOffset = today.getTimezoneOffset() * 60000;
          const todayStr = (new Date(today.getTime() - tzOffset)).toISOString().split('T')[0];
          
          if (t.latest_schedule_date === todayStr) {
            scheduleStatusLabel = "Today";
          } else if (t.latest_schedule_date < todayStr) {
            scheduleStatusLabel = "Past";
          } else {
            scheduleStatusLabel = "Future";
          }
        }
        return colFilters.schedule!.has(scheduleStatusLabel);
      });
    }
    if (colFilters.date) {
      result = result.filter(t => {
        const dKey = (!t.date || t.date.startsWith("1970-01-01")) ? "-" : t.date;
        return colFilters.date!.has(dKey);
      });
    }
    if (colFilters.tags && colFilters.tags.size > 0) {
      result = result.filter(t => {
        const rawTags = t.raw_tags || "";
        if (!rawTags.trim()) return colFilters.tags!.has("");
        const tagsList = rawTags.split(',').map(tag => tag.trim()).filter(Boolean);
        return tagsList.some(tag => colFilters.tags!.has(tag));
      });
    }
    if (colFilters.ops && colFilters.ops.size > 0) {
      result = result.filter(t => colFilters.ops!.has(t.sub_category || ""));
    }
    if (colFilters.contactName && colFilters.contactName.size > 0) {
      result = result.filter(t => {
        const activeAnnotation = annotationsMap[t.ticket_id] || t.annotation;
        const displayName = activeAnnotation?.contact_name || t.contact_name;
        return colFilters.contactName!.has((displayName || "").trim());
      });
    }

    if (sortConfig) {
      result = [...result].sort((a, b) => {
        let valA: any = a[sortConfig.key as keyof EnrichedTicket];
        let valB: any = b[sortConfig.key as keyof EnrichedTicket];

        if (sortConfig.key === 'prio') {
          valA = (annotationsMap[a.ticket_id] || a.annotation)?.priority_tag || "";
          valB = (annotationsMap[b.ticket_id] || b.annotation)?.priority_tag || "";
        } else if (sortConfig.key === 'status') {
          valA = (annotationsMap[a.ticket_id] || a.annotation)?.gt_status || "";
          valB = (annotationsMap[b.ticket_id] || b.annotation)?.gt_status || "";
        } else if (sortConfig.key === 'contact_name') {
          valA = (a.contact_name || "").toLowerCase();
          valB = (b.contact_name || "").toLowerCase();
        } else if (sortConfig.key === 'location') {
          valA = ((annotationsMap[a.ticket_id] || a.annotation)?.location || a.address1 || "").toLowerCase();
          valB = ((annotationsMap[b.ticket_id] || b.annotation)?.location || b.address1 || "").toLowerCase();
        } else if (sortConfig.key === 'address') {
          valA = (a.address1 || "").toLowerCase();
          valB = (b.address1 || "").toLowerCase();
        } else if (sortConfig.key === 'date') {
          valA = new Date(a.date || 0).getTime();
          valB = new Date(b.date || 0).getTime();
        } else if (sortConfig.key === 'age') {
          valA = a.ticket_age || 0;
          valB = b.ticket_age || 0;
        } else if (sortConfig.key === 'ops') {
          valA = (a.sub_category || "").toLowerCase();
          valB = (b.sub_category || "").toLowerCase();
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchQuery, colFilters, annotationsMap, selectedIds, sortConfig]);

  return {
    searchQuery,
    setSearchQuery,
    colFilters,
    setColFilters,
    sortConfig,
    handleSort,
    filterOptions,
    activeFilters,
    removeFilter,
    clearAllFilters,
    filteredData,
  };
}
