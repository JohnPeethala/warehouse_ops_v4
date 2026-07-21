"use client";

import React, { useState } from "react";
import { updateProfile, addProfile, deleteProfile } from "@/app/actions/settings";
import { Shield, ShieldAlert, Truck, Plus, Hammer, Wrench, Eye } from "lucide-react";
import { AddUserModal } from "./AddUserModal";
import { TeamTable } from "./TeamTable";

import { useRouter } from "next/navigation";

export interface Profile {
  id: string;
  name: string;
  phone: string;
  role: "admin" | "supervisor" | "ground" | "technician" | "carpenter" | "viewer";
  created_at: string;
  is_active: boolean;
}

export function TeamManager({ initialData }: { initialData: Profile[] }) {
  const router = useRouter();
  const [entries, setEntries] = useState<Profile[]>(initialData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);



  const handleRoleChange = async (userId: string, newRole: string) => {
    setIsSaving(true);
    const res = await updateProfile(userId, { role: newRole });
    
    if (res.success) {
      setEntries(entries.map(e => e.id === userId ? { ...e, role: newRole as any } : e));
    } else {
      alert("Failed to update user role: " + res.error);
    }
    
    setEditingId(null);
    setIsSaving(false);
  };

  const handleActiveToggle = async (userId: string, currentActive: boolean) => {
    setIsSaving(true);
    const res = await updateProfile(userId, { is_active: !currentActive });
    
    if (res.success) {
      setEntries(entries.map(e => e.id === userId ? { ...e, is_active: !currentActive } : e));
    } else {
      alert("Failed to update user status: " + res.error);
    }
    setIsSaving(false);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    
    setIsSaving(true);
    const res = await deleteProfile(userId);
    
    if (res.success) {
      setEntries(entries.filter(e => e.id !== userId));
    } else {
      alert("Failed to delete user: " + res.error);
    }
    setIsSaving(false);
  };

  const handleCreateUser = async (name: string, phone: string, role: string, isActive: boolean) => {
    setIsSaving(true);
    const res = await addProfile(name, phone, role, isActive);

    if (res.success) {
      setIsModalOpen(false);
      router.refresh();
    }
    
    setIsSaving(false);
    return res;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <ShieldAlert className="w-4 h-4 text-red-500" />;
      case "supervisor": return <Shield className="w-4 h-4 text-blue-500" />;
      case "carpenter": return <Hammer className="w-4 h-4 text-orange-500" />;
      case "technician": return <Wrench className="w-4 h-4 text-purple-500" />;
      case "viewer": return <Eye className="w-4 h-4 text-gray-500" />;
      default: return <Truck className="w-4 h-4 text-green-500" />;
    }
  };

  const roleOptions = [
    { value: "admin", label: "Admin", count: 0 },
    { value: "supervisor", label: "Supervisor", count: 0 },
    { value: "ground", label: "Ground Team", count: 0 },
    { value: "technician", label: "Technician", count: 0 },
    { value: "carpenter", label: "Carpenter", count: 0 },
    { value: "viewer", label: "Viewer", count: 0 }
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team & Roles</h2>
          <p className="text-sm text-foreground/60 mt-1">
            Manage system access and create new users.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      <TeamTable
        entries={entries}
        editingId={editingId}
        isSaving={isSaving}
        onEdit={setEditingId}
        onCancelEdit={() => setEditingId(null)}
        onRoleChange={handleRoleChange}
        onActiveToggle={handleActiveToggle}
        onDelete={handleDelete}
        getRoleIcon={getRoleIcon}
        roleOptions={roleOptions}
      />

      {isModalOpen && (
        <AddUserModal
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateUser}
          roleOptions={roleOptions}
        />
      )}
    </div>
  );
}
