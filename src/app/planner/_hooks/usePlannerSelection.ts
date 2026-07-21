import { useState } from 'react';
import { LocationGroup } from '../_components/RoutePlannerContext';

export function usePlannerSelection(groups: LocationGroup[]) {
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);

  const toggleGroupSelection = (groupId: string, multi = false) => {
    setSelectedGroupIds(prev => {
      const next = new Set(multi ? prev : undefined);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const clearGroupSelection = () => setSelectedGroupIds(new Set());
  
  const selectAllGroups = () => {
    setSelectedGroupIds(new Set(groups.map(g => g.id)));
  };

  const setMultiSelectMode = (mode: boolean) => {
    setIsMultiSelectMode(mode);
    if (!mode) clearGroupSelection();
  };

  return {
    selectedGroupIds,
    setSelectedGroupIds,
    isMultiSelectMode,
    toggleGroupSelection,
    clearGroupSelection,
    selectAllGroups,
    setMultiSelectMode
  };
}
