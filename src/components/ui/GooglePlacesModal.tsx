"use client";

import React, { useEffect, useState, useRef } from "react";
import { X, Search, MapPin, Loader2, Navigation, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { APIProvider, Map, Marker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { HYDERABAD_COORDS, DARK_STYLES, LIGHT_STYLES } from "@/app/planner/_components/mapConfig";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (area: string, pincode: string, lat: number, lng: number) => void;
  initialQuery?: string;
};

type SearchResult = {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    }
  };
};

export function GooglePlacesModal(props: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!props.isOpen || !mounted) return null;

  return createPortal(
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
      <GooglePlacesModalInner {...props} />
    </APIProvider>,
    document.body
  );
}

function GooglePlacesModalInner({ isOpen, onClose, onSelect, initialQuery }: Props) {
  const [selectedLocation, setSelectedLocation] = useState<{ area: string; pincode: string; lat: number; lng: number } | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSelectedLocation(null);
        setSearchResults([]);
      }, 300);
    }
  }, [isOpen]);

  const handleConfirmMap = () => {
    if (selectedLocation) {
      onSelect(selectedLocation.area, selectedLocation.pincode, selectedLocation.lat, selectedLocation.lng);
      onClose();
    }
  };

  const handleSearchResults = (results: SearchResult[]) => {
    setSearchResults(results);
    setSelectedLocation(null);
  };

  const handleMarkerClick = (place: SearchResult) => {
    handleGeocodeAndSelect(place);
  };

  const geocodingLib = useMapsLibrary('geocoding');

  const handleGeocodeAndSelect = async (place: SearchResult) => {
    try {
      const lat = place.geometry.location.lat;
      const lng = place.geometry.location.lng;

      let pincode = "";
      if (geocodingLib) {
        const geocoder = new geocodingLib.Geocoder();
        const response = await geocoder.geocode({ location: { lat, lng } });
        if (response.results && response.results.length > 0) {
          for (const r of response.results) {
             r.address_components.forEach((component: any) => {
              const types = component.types;
              if (types.includes("postal_code") && !pincode) {
                pincode = component.long_name;
              }
            });
            if (pincode) break;
          }
        }
      }

      setSelectedLocation({
        area: place.name,
        pincode: pincode || "",
        lat: lat,
        lng: lng
      });

    } catch (error) {
      console.error("Error fetching exact details: ", error);
      setSelectedLocation({
        area: place.name,
        pincode: "",
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      });
    }
  };

  const currentCenter = selectedLocation 
    ? { lat: selectedLocation.lat, lng: selectedLocation.lng } 
    : (searchResults.length > 0 ? { lat: searchResults[0].geometry.location.lat, lng: searchResults[0].geometry.location.lng } : HYDERABAD_COORDS);
  const currentZoom = selectedLocation ? 16 : 12;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card w-full max-w-7xl rounded-xl shadow-2xl overflow-hidden flex flex-col h-[85vh] sm:flex-row border border-border"
        >
          {/* Left Side: Search */}
          <div className="w-full sm:w-[35%] flex flex-col border-r border-border bg-background h-1/2 sm:h-full shrink-0 z-10">
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                Location Picker
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors sm:hidden"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-4 flex flex-col bg-muted/20">
               <PlacesSearch 
                  onSearchResults={handleSearchResults} 
                  onSelectResult={handleGeocodeAndSelect}
                  initialQuery={initialQuery} 
                  selectedArea={selectedLocation?.area}
                  results={searchResults}
                />
            </div>
          </div>

          {/* Right Side: Map */}
          <div className="w-full sm:w-[65%] flex-1 relative h-1/2 sm:h-full bg-muted">
             {/* Desktop Close Button */}
             <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 p-2 bg-background shadow-sm border border-border text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors hidden sm:block"
              >
                <X size={18} />
              </button>

             <div className="absolute inset-0 z-0">
                <Map
                  defaultCenter={currentCenter}
                  defaultZoom={currentZoom}
                  gestureHandling={'greedy'}
                  disableDefaultUI={true}
                  zoomControl={true}
                  styles={isDarkMode ? DARK_STYLES : LIGHT_STYLES}
                >
                <MapBoundsUpdater results={searchResults} selectedLocation={selectedLocation} />

                {!selectedLocation && searchResults.map((res) => (
                  <Marker 
                    key={res.place_id}
                    position={{ lat: res.geometry.location.lat, lng: res.geometry.location.lng }}
                    onClick={() => handleMarkerClick(res)}
                  />
                ))}

              {selectedLocation && (
                <DraggableMarker 
                  position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                  onDragEnd={(lat, lng) => {
                    setSelectedLocation(prev => prev ? { ...prev, lat, lng } : null);
                  }}
                />
              )}
              </Map>
            </div>

            {/* Confirm Button Layer */}
            <AnimatePresence>
              {selectedLocation && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
                >
                  <div className="bg-card p-4 rounded-lg border border-border shadow-lg pointer-events-auto flex items-center gap-6 min-w-[320px]">
                    <div className="flex flex-col min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">Adjust pin for</p>
                      <p className="text-sm font-medium text-foreground truncate">{selectedLocation.area}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleConfirmMap}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors shrink-0"
                    >
                      <Check size={16} />
                      Confirm
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Helper component to update bounds when results change
function MapBoundsUpdater({ results, selectedLocation }: { results: SearchResult[], selectedLocation: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    
    if (results.length > 0 && !selectedLocation) {
      if (results.length === 1) {
        map.panTo({ lat: results[0].geometry.location.lat, lng: results[0].geometry.location.lng });
        map.setZoom(15);
      } else {
        const bounds = new window.google.maps.LatLngBounds();
        results.forEach(res => {
          bounds.extend(new window.google.maps.LatLng(res.geometry.location.lat, res.geometry.location.lng));
        });
        map.fitBounds(bounds, 50); // 50px padding
      }
    } else if (selectedLocation) {
       map.panTo({ lat: selectedLocation.lat, lng: selectedLocation.lng });
       map.setZoom(16);
    }
  }, [map, results, selectedLocation]);

  return null;
}

function PlacesSearch({ 
  onSearchResults,
  onSelectResult,
  initialQuery,
  selectedArea,
  results
}: { 
  onSearchResults: (r: SearchResult[]) => void, 
  onSelectResult: (r: SearchResult) => void,
  initialQuery?: string,
  selectedArea?: string,
  results: SearchResult[]
}) {
  const [value, setValue] = useState(initialQuery || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<"OK" | "ZERO_RESULTS" | "">("");

  const inputRef = useRef<HTMLInputElement>(null);

  
  const placesLib = useMapsLibrary('places');

  useEffect(() => {
    // Auto-search if initial query is provided
    if (initialQuery && !results.length) {
       setValue(initialQuery);
       // Timeout ensures state is fully mounted and value is available
       setTimeout(() => {
         const btn = document.getElementById('hidden-search-trigger');
         if (btn) btn.click();
       }, 50);
    }
  }, [initialQuery]);

  useEffect(() => {
    inputRef.current?.focus();
    if (inputRef.current) {
       inputRef.current.selectionStart = inputRef.current.value.length;
       inputRef.current.selectionEnd = inputRef.current.value.length;
    }
  }, []);

  useEffect(() => {
    if (selectedArea && value !== selectedArea) {
       setValue(selectedArea);
    }
  }, [selectedArea]);

  const executeSearch = async () => {
    if (!value || value === selectedArea) {
      if (results.length > 0 && value !== selectedArea) {
         onSearchResults([]);
      }
      setStatus("");
      return;
    }

    const searchQuery = value.trim() ? `${value.trim()}, Hyderabad, Telangana, India` : "";
    if (!searchQuery) {
      onSearchResults([]);
      setStatus("");
      return;
    }
    
    if (!placesLib) return;

    setIsProcessing(true);
    try {
      const service = new placesLib.PlacesService(document.createElement('div'));
      service.textSearch({ query: searchQuery }, (res, searchStatus) => {
        if (searchStatus === placesLib.PlacesServiceStatus.OK && res) {
          onSearchResults(res.slice(0, 10).map((r: any) => ({
             place_id: r.place_id,
             name: r.name,
             formatted_address: r.formatted_address,
             geometry: {
               location: {
                 lat: r.geometry.location.lat(),
                 lng: r.geometry.location.lng()
               }
             }
          })));
          setStatus("OK");
        } else {
          onSearchResults([]);
          setStatus("ZERO_RESULTS");
        }
        setIsProcessing(false);
      });
    } catch (e) {
      onSearchResults([]);
      setStatus("ZERO_RESULTS");
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="w-full flex items-center bg-background border border-input rounded-md transition-colors overflow-hidden px-3 h-10 focus-within:ring-1 focus-within:ring-ring focus-within:border-ring shrink-0">
        <Search className="text-muted-foreground shrink-0" size={16} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search and press Enter..."
          className="flex-1 bg-transparent border-none outline-none py-2 px-3 text-sm text-foreground placeholder:text-muted-foreground"
        />
          {isProcessing && (
            <Loader2 className="animate-spin text-primary shrink-0" size={14} />
          )}
        </div>
        <button 
          id="hidden-search-trigger" 
          onClick={executeSearch} 
          className="hidden" 
          aria-hidden="true" 
        />
  
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
        <AnimatePresence>
          {results.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-2 pb-4"
            >
              {results.map((item) => (
                <button
                  key={item.place_id}
                  onClick={() => onSelectResult(item)}
                  disabled={isProcessing}
                  className="flex items-start gap-3 w-full p-3 rounded-md hover:bg-muted transition-colors text-left disabled:opacity-50 group border border-transparent hover:border-border bg-background shadow-sm"
                >
                  <div className="shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {item.name}
                    </span>
                    <span className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.formatted_address}
                    </span>
                  </div>
                </button>
              ))}
            </motion.div>
          ) : (
            !isProcessing && value && value !== selectedArea && status === "ZERO_RESULTS" && (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <MapPin className="text-muted-foreground w-6 h-6 mb-2 opacity-50" />
                <p className="text-sm font-medium text-foreground">No places found</p>
                <p className="text-xs text-muted-foreground mt-1">Try a different search term.</p>
              </div>
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function DraggableMarker({ position, onDragEnd }: { position: { lat: number; lng: number }; onDragEnd: (lat: number, lng: number) => void }) {
  const handleDragEnd = (e: any) => {
    if (e.latLng) {
      onDragEnd(e.latLng.lat(), e.latLng.lng());
    }
  };

  return (
    <Marker 
      position={position} 
      draggable={true}
      onDragEnd={handleDragEnd}
    />
  );
}
