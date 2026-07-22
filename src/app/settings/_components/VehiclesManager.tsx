"use client";

import React, { useState } from "react";
import { addVehicle, updateVehicle, deleteVehicle } from "@/app/actions/settings";
import { AddVehicleForm } from "./AddVehicleForm";
import { VehiclesTable } from "./VehiclesTable";

export interface Vehicle {
  id: string;
  vehicle_no: string;
  driver_name: string;
  driver_phone: string | null;
  is_active: boolean;
}
export function VehiclesManager({ initialData }: { initialData: Vehicle[] }) {
  const [entries, setEntries] = useState<Vehicle[]>(initialData);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVehicleNo, setEditVehicleNo] = useState("");
  const [editDriverName, setEditDriverName] = useState("");
  const [editDriverPhone, setEditDriverPhone] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  const handleAdd = async (vehicleNo: string, driverName: string, driverPhone: string, isActive: boolean) => {
    const res = await addVehicle(vehicleNo, driverName, driverPhone, isActive);
    if (res.success) {
      setEntries([...entries, { 
        id: Date.now().toString(), // temporary ID until refresh
        vehicle_no: vehicleNo, 
        driver_name: driverName,
        driver_phone: driverPhone,
        is_active: isActive 
      }]);
    } else {
      alert("Failed to add vehicle: " + res.error);
    }
    return res;
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (!confirm("Delete this vehicle?")) return;
    
    const res = await deleteVehicle(id);
    if (res.success) {
      setEntries(entries.filter(e => e.id !== id));
    } else {
      alert("Failed to delete vehicle: " + res.error);
    }
  };

  const startEdit = (v: Vehicle) => {
    setEditingId(v.id);
    setEditVehicleNo(v.vehicle_no);
    setEditDriverName(v.driver_name || "");
    setEditDriverPhone(v.driver_phone || "");
    setEditIsActive(v.is_active ?? true);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    if (!editVehicleNo.trim()) return;
    
    const res = await updateVehicle(id, { vehicle_no: editVehicleNo.trim(), driver_name: editDriverName.trim(), driver_phone: editDriverPhone.trim() || null, is_active: editIsActive });
    if (res.success) {
      setEntries(entries.map(e => e.id === id ? { ...e, vehicle_no: editVehicleNo.trim(), driver_name: editDriverName.trim(), driver_phone: editDriverPhone.trim() || null, is_active: editIsActive } : e));
      setEditingId(null);
    } else {
      alert("Failed to update vehicle: " + res.error);
    }
  };

  const handleActiveToggle = async (id: string, currentActive: boolean) => {
    const res = await updateVehicle(id, { is_active: !currentActive });
    if (res.success) {
      setEntries(entries.map(e => e.id === id ? { ...e, is_active: !currentActive } : e));
    } else {
      alert("Failed to update vehicle status: " + res.error);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Vehicles</h2>
        <p className="text-sm text-foreground/60 mt-1">Manage your fleet of vehicles available for dispatch.</p>
      </div>
      
      <AddVehicleForm onAdd={handleAdd} />

      <VehiclesTable
        entries={entries}
        editingId={editingId}
        editVehicleNo={editVehicleNo}
        editDriverName={editDriverName}
        editDriverPhone={editDriverPhone}
        editIsActive={editIsActive}
        onEditVehicleNoChange={setEditVehicleNo}
        onEditDriverNameChange={setEditDriverName}
        onEditDriverPhoneChange={setEditDriverPhone}
        onEditIsActiveChange={setEditIsActive}
        onEdit={startEdit}
        onCancelEdit={cancelEdit}
        onSaveEdit={saveEdit}
        onActiveToggle={handleActiveToggle}
        onDelete={handleDelete}
      />
    </div>
  );
}
