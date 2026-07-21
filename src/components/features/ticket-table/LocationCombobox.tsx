"use client";

import React, { useState } from "react";
import { Search, ChevronDown, Check, Navigation, X, MapPin } from "lucide-react";
import { GooglePlacesModal } from "@/components/ui/GooglePlacesModal";
import { saveGeoZone, updateTicketLocation } from "@/app/actions/geo";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

type GeoZone = {
  id: string;
  area: string | null;
  pincode: string | null;
  lat: number | null;
  lng: number | null;
  zone: string | null;
  city: string | null;
};

type Props = {
  ticketId: string;
  stagedTicketId: string;
  initialLocation: string;
  initialPincode: string;
  geoZones: GeoZone[];
  onUpdate?: (area: string, pincode: string) => void;
};

export function LocationCombobox({ ticketId, stagedTicketId, initialLocation, initialPincode, geoZones, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [currentLocation, setCurrentLocation] = useState(initialLocation);
  const [currentPincode, setCurrentPincode] = useState(initialPincode);

  React.useEffect(() => {
    setCurrentLocation(initialLocation);
    setCurrentPincode(initialPincode);
  }, [initialLocation, initialPincode]);

  const handleSelectZone = async (zone: GeoZone) => {
    setOpen(false);
    if (!zone.area || !zone.pincode) return;
    
    setCurrentLocation(zone.area);
    setCurrentPincode(zone.pincode);
    setSearch("");

    if (onUpdate) {
      onUpdate(zone.area, zone.pincode);
    } else {
      await updateTicketLocation(ticketId, stagedTicketId, zone.area, zone.pincode);
    }
  };

  const handleGooglePlaceSelect = async (area: string, pincode: string, lat: number, lng: number) => {
    setCurrentLocation(area);
    setCurrentPincode(pincode);

    // 1. Save to global geo zones
    const res = await saveGeoZone(area, pincode, lat, lng);
    
    let finalArea = area;
    let finalPincode = pincode;

    if (res?.warning && res.data) {
      toast.warning(res.warning);
      finalArea = res.data.area;
      finalPincode = res.data.pincode;
      setCurrentLocation(finalArea);
      setCurrentPincode(finalPincode);
    } else if (res?.success === false) {
      toast.error(res.error || "Failed to save location");
      return;
    }

    // 2. Save to this specific ticket
    setSearch("");
    if (onUpdate) {
      onUpdate(finalArea, finalPincode);
    } else {
      await updateTicketLocation(ticketId, stagedTicketId, finalArea, finalPincode);
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-1">
      <Popover open={open} onOpenChange={(val) => {
        setOpen(val);
        if (!val) setSearch("");
      }}>
        <PopoverTrigger 
          className={`flex items-center justify-between w-full min-h-[28px] text-xs bg-background hover:bg-muted/50 border transition-all rounded-sm px-2 text-left outline-none shadow-sm ${
            open ? 'border-primary ring-1 ring-primary/20' : 'border-border'
          }`}
        >
            <div className="flex-1 truncate py-0.5 pr-2 flex items-center justify-between gap-1.5">
              {currentLocation ? (
                <>
                  <span className="text-foreground truncate">{currentLocation}</span>
                  {currentPincode && (
                    <span className="text-[10px] text-muted-foreground bg-foreground/5 px-1.5 py-0.5 rounded shrink-0 font-mono">
                      {currentPincode}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground/70">Select location...</span>
              )}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0 shadow-md rounded-md border border-border overflow-hidden" align="start" sideOffset={8}>
          <Command shouldFilter={false} className="bg-transparent">
            <CommandInput 
              placeholder="Search zones..." 
              value={search} 
              onValueChange={setSearch} 
              className="text-sm border-none focus:ring-0"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = e.currentTarget.value;
                  const hasMatches = geoZones.some(z => {
                      if (!val.trim()) return true;
                      const q = val.toLowerCase();
                      return (z.area || "").toLowerCase().includes(q) || (z.pincode || "").toLowerCase().includes(q);
                  });
                    
                  if (!hasMatches && val.trim()) {
                    e.preventDefault();
                    setSearch(val);
                    setOpen(false);
                    setIsModalOpen(true);
                  }
                }
              }}
            />
            <CommandList className="h-[260px] overflow-y-auto custom-scrollbar p-2">
              <CommandEmpty className="py-8 text-sm text-center text-muted-foreground">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Navigation className="w-6 h-6 opacity-20" />
                  No matching zones found.
                </div>
              </CommandEmpty>
              <CommandGroup>
                {initialLocation && (
                  <CommandItem
                    key="clear-selection"
                    onSelect={async () => {
                      setOpen(false);
                      setCurrentLocation("");
                      setCurrentPincode("");
                      if (onUpdate) {
                        onUpdate("", "");
                      } else {
                        await updateTicketLocation(ticketId, stagedTicketId, "", "");
                      }
                    }}
                    className="flex items-start gap-3 py-2.5 px-3 mb-1 rounded-sm cursor-pointer aria-selected:bg-red-500/10 aria-selected:text-red-600 hover:bg-red-500/10 transition-none group/clear"
                  >
                    <div className="mt-0.5 text-red-500/70 group-hover/clear:text-red-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex items-center min-w-0 flex-1 gap-2">
                      <span className="font-medium text-red-600 dark:text-red-400 group-hover/clear:text-red-700 dark:group-hover/clear:text-red-300 transition-colors truncate">Clear Assigned Location</span>
                    </div>
                  </CommandItem>
                )}
                {geoZones
                  .filter(z => {
                    if (!search.trim()) return true;
                    const q = search.toLowerCase();
                    return (z.area || "").toLowerCase().includes(q) || (z.pincode || "").toLowerCase().includes(q);
                  })
                  .map(zone => (
                    <CommandItem
                      key={zone.id}
                      onSelect={() => handleSelectZone(zone)}
                      className="flex items-start gap-3 py-2.5 px-3 mb-1 rounded-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground hover:bg-accent transition-none"
                    >
                      <div className="mt-0.5 text-muted-foreground">
                        <Navigation className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex items-center min-w-0 flex-1 gap-2">
                        <span className="font-medium text-foreground truncate">{zone.area}</span>
                        <span className="text-xs text-muted-foreground/70 font-mono shrink-0">{zone.pincode}</span>
                      </div>
                      {currentPincode === zone.pincode && (
                        <div className="mt-1">
                          <Check className="w-4 h-4 text-primary shrink-0" />
                        </div>
                      )}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
            <div className="p-2 border-t border-border/30 bg-muted/30">
              <button
                onClick={() => {
                  setOpen(false);
                  setIsModalOpen(true);
                }}
                className="flex w-full items-center justify-center gap-2 py-2 px-3 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors text-sm"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Google Places</span>
              </button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>

      <GooglePlacesModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleGooglePlaceSelect}
        initialQuery={search}
      />
    </div>
  );
}
