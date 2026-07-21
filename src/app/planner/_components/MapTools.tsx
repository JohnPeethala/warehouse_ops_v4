"use client";

import { Plus, Minus, Target, MousePointerClick } from "lucide-react";
import { useRoutePlanner } from "./RoutePlannerContext";

interface MapToolsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPan: () => void;
}

export function MapTools({ onZoomIn, onZoomOut, onPan }: MapToolsProps) {
  const { isMultiSelectMode, setMultiSelectMode } = useRoutePlanner();

  return (
    <div className="absolute bottom-5 left-5 md:left-24 z-40">
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-xl shadow-lg border border-border flex flex-col overflow-hidden">
        <button 
          onClick={() => setMultiSelectMode(!isMultiSelectMode)}
          className={`p-3 transition-colors border-b border-border ${
            isMultiSelectMode 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
          }`}
          title="Toggle Multi-Select Mode"
        >
          <MousePointerClick size={16} />
        </button>
        <button 
          onClick={onPan}
          className="p-3 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border-b border-border"
          title="Recenter Map"
        >
          <Target size={16} />
        </button>
        <button 
          onClick={onZoomIn}
          className="p-3 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border-b border-border"
        >
          <Plus size={16} />
        </button>
        <button 
          onClick={onZoomOut}
          className="p-3 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Minus size={16} />
        </button>
      </div>
    </div>
  );
}
