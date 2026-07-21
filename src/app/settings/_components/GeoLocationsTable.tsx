"use client";

import React, { useState } from "react";
import { Trash2, Edit2, Check, X, MapPin } from "lucide-react";
import { GeoZone } from "./GeoLocationsManager";

interface GeoLocationsTableProps {
  entries: GeoZone[];
  isSaving: boolean;
  editingId: string | null;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
  onUpdate: (id: string, lat: number, lng: number) => void;
  onDelete: (id: string) => void;
}

export function GeoLocationsTable({
  entries,
  isSaving,
  editingId,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete
}: GeoLocationsTableProps) {
  
  const [editLat, setEditLat] = useState("");
  const [editLng, setEditLng] = useState("");

  const startEdit = (entry: GeoZone) => {
    setEditLat(entry.lat.toString());
    setEditLng(entry.lng.toString());
    onEdit(entry.id);
  };

  const handleSave = (id: string) => {
    const lat = parseFloat(editLat);
    const lng = parseFloat(editLng);
    if (isNaN(lat) || isNaN(lng)) {
      alert("Invalid coordinates");
      return;
    }
    onUpdate(id, lat, lng);
  };

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-border border-dashed">
        <MapPin className="w-8 h-8 opacity-20 mb-3" />
        <p className="text-sm">No locations found.</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden flex flex-col h-full min-h-0 bg-background">
      <div className="overflow-x-auto h-full min-h-0">
        <div className="inline-block min-w-full align-middle h-full flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="min-w-full divide-y divide-border relative">
              <thead className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Area</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Pincode</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Coordinates</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {entries.map((entry) => {
                  const isEditing = editingId === entry.id;
                  
                  return (
                    <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground">
                        {entry.area}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground font-mono">
                        {entry.pincode}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              step="any"
                              value={editLat}
                              onChange={e => setEditLat(e.target.value)}
                              className="w-24 text-sm px-2 py-1 rounded bg-muted border border-border"
                              placeholder="Lat"
                            />
                            <span className="text-muted-foreground">,</span>
                            <input 
                              type="number" 
                              step="any"
                              value={editLng}
                              onChange={e => setEditLng(e.target.value)}
                              className="w-24 text-sm px-2 py-1 rounded bg-muted border border-border"
                              placeholder="Lng"
                            />
                          </div>
                        ) : (
                          <span className="font-mono text-xs bg-muted/50 px-2 py-1 rounded text-muted-foreground">
                            {entry.lat.toFixed(6)}, {entry.lng.toFixed(6)}
                          </span>
                        )}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex items-center justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSave(entry.id)}
                                disabled={isSaving}
                                className="text-green-600 hover:text-green-700 disabled:opacity-50 transition-colors bg-green-500/10 p-1.5 rounded"
                                title="Save"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={onCancelEdit}
                                disabled={isSaving}
                                className="text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors bg-muted p-1.5 rounded"
                                title="Cancel"
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(entry)}
                                disabled={isSaving || editingId !== null}
                                className="text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors bg-blue-500/10 p-1.5 rounded"
                                title="Edit Coordinates"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => onDelete(entry.id)}
                                disabled={isSaving || editingId !== null}
                                className="text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors bg-red-500/10 p-1.5 rounded"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
