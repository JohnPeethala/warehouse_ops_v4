"use client";

import React, { useState } from "react";
import { Plus, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { GeoLocationsTable } from "./GeoLocationsTable";
import { AddLocationModal } from "./AddLocationModal";
import { deleteGeoZone, addGeoZone, updateGeoZone } from "@/app/actions/geo";

export interface GeoZone {
  id: string;
  area: string;
  pincode: string;
  lat: number;
  lng: number;
  city: string | null;
  zone: string | null;
}

export function GeoLocationsManager({ initialData }: { initialData: GeoZone[] }) {
  const router = useRouter();
  const [entries, setEntries] = useState<GeoZone[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleCreateLocation = async (area: string, pincode: string, lat: number, lng: number) => {
    setIsSaving(true);
    const res = await addGeoZone(area, pincode, lat, lng);
    if (res.success) {
      setIsModalOpen(false);
      setEntries([...entries, res.data].sort((a, b) => a.area.localeCompare(b.area)));
      router.refresh();
    } else {
      alert("Failed to add location: " + res.error);
    }
    setIsSaving(false);
    return res;
  };

  const handleUpdateLocation = async (id: string, lat: number, lng: number) => {
    setIsSaving(true);
    const res = await updateGeoZone(id, { lat, lng });
    if (res.success) {
      setEntries(entries.map(e => e.id === id ? { ...e, lat, lng } : e));
    } else {
      alert("Failed to update location: " + res.error);
    }
    setEditingId(null);
    setIsSaving(false);
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this location?")) return;
    setIsSaving(true);
    const res = await deleteGeoZone(id);
    if (res.success) {
      setEntries(entries.filter(e => e.id !== id));
      router.refresh();
    } else {
      alert("Failed to delete location: " + res.error);
    }
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Geo Locations</h2>
          <p className="text-sm text-foreground/60 mt-1">
            Manage dispatch areas, pincodes, and their coordinates.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Add Location
        </button>
      </div>

      <GeoLocationsTable
        entries={entries}
        isSaving={isSaving}
        editingId={editingId}
        onEdit={setEditingId}
        onCancelEdit={() => setEditingId(null)}
        onUpdate={handleUpdateLocation}
        onDelete={handleDeleteLocation}
      />

      {isModalOpen && (
        <AddLocationModal
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateLocation}
        />
      )}
    </div>
  );
}
