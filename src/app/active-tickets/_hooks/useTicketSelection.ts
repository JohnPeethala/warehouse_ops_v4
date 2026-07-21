import { useState } from "react";

export function useTicketSelection(dataIds: string[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelectAll = () => {
    if (selectedIds.size === dataIds.length && dataIds.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(dataIds));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  return {
    selectedIds,
    setSelectedIds,
    toggleSelectAll,
    toggleSelect,
  };
}
