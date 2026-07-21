"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createVehicleAction } from "../actions"
import { toast } from "sonner"

interface CreateVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDriverName?: string;
  onSuccess: (id: string) => void;
}

export function CreateVehicleDialog({ open, onOpenChange, defaultDriverName = "", onSuccess }: CreateVehicleDialogProps) {
  const [vehicleNo, setVehicleNo] = useState("")
  const [driverName, setDriverName] = useState(defaultDriverName)
  const [loading, setLoading] = useState(false)

  // Reset state when opened with new defaults
  useState(() => {
    setDriverName(defaultDriverName)
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehicleNo || !driverName) return toast.error("Please fill all fields")
    
    setLoading(true)
    try {
      const res = await createVehicleAction(vehicleNo, driverName)
      if (res.success && res.data) {
        toast.success("Vehicle created successfully")
        onSuccess(res.data.id)
        onOpenChange(false)
        setVehicleNo("")
      } else {
        toast.error(res.error || "Failed to create vehicle")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Vehicle / Driver</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="driverName" className="text-sm font-medium">Driver Name</label>
              <Input 
                id="driverName" 
                value={driverName} 
                onChange={e => setDriverName(e.target.value)} 
                placeholder="e.g. John Doe"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="vehicleNo" className="text-sm font-medium">Vehicle Number</label>
              <Input 
                id="vehicleNo" 
                value={vehicleNo} 
                onChange={e => setVehicleNo(e.target.value)} 
                placeholder="e.g. VH-1024"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
