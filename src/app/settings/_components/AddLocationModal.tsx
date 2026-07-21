"use client";

import React, { useState } from "react";
import { X, Search } from "lucide-react";
import { GooglePlacesModal } from "@/components/ui/GooglePlacesModal";

interface AddLocationModalProps {
  onClose: () => void;
  onCreate: (area: string, pincode: string, lat: number, lng: number) => Promise<{ success: boolean; error?: string }>;
}

export function AddLocationModal({ onClose, onCreate }: AddLocationModalProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [area, setArea] = useState("");
  const [pincode, setPincode] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const handleGooglePlaceSelect = (selectedArea: string, selectedPincode: string, selectedLat: number, selectedLng: number) => {
    setArea(selectedArea);
    setPincode(selectedPincode);
    setLat(selectedLat.toString());
    setLng(selectedLng.toString());
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!area || !pincode || !lat || !lng) {
      setError("Please fill all fields or use Google Places search.");
      return;
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      setError("Invalid coordinates.");
      return;
    }

    setIsSaving(true);
    const res = await onCreate(area, pincode, parsedLat, parsedLng);
    if (!res.success) {
      setError(res.error || "Failed to create location.");
    }
    setIsSaving(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 flex items-center justify-center p-4">
        <div className="bg-card border border-border shadow-lg rounded-xl w-full max-w-md overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
            <h2 className="text-lg font-semibold">Add New Location</h2>
            <button 
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsSearching(true)}
              className="w-full mb-6 flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-primary/30 text-primary rounded-lg hover:bg-primary/5 transition-colors font-medium"
            >
              <Search className="w-4 h-4" />
              Search with Google Places
            </button>

            <form id="add-location-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Area Name</label>
                <input
                  type="text"
                  required
                  value={area}
                  onChange={e => setArea(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. Gachibowli"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Pincode</label>
                <input
                  type="text"
                  required
                  value={pincode}
                  onChange={e => setPincode(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                  placeholder="e.g. 500032"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={lat}
                    onChange={e => setLat(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={lng}
                    onChange={e => setLng(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </form>
          </div>

          <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-location-form"
              disabled={isSaving}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Location"}
            </button>
          </div>
        </div>
      </div>

      <GooglePlacesModal 
        isOpen={isSearching}
        onClose={() => setIsSearching(false)}
        onSelect={(selectedArea, selectedPincode, selectedLat, selectedLng) => {
          handleGooglePlaceSelect(selectedArea, selectedPincode, selectedLat, selectedLng);
          setIsSearching(false);
        }}
      />
    </>
  );
}
