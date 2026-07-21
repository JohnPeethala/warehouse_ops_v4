"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createGTAction } from "../actions"
import { toast } from "sonner"

interface CreateGTDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName?: string;
  onSuccess: (id: string) => void;
}

export function CreateGTDialog({ open, onOpenChange, defaultName = "", onSuccess }: CreateGTDialogProps) {
  const [name, setName] = useState(defaultName)
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)

  // Reset state when opened with new defaults
  useState(() => {
    setName(defaultName)
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !phone) return toast.error("Please fill all fields")
    
    setLoading(true)
    try {
      const res = await createGTAction(name, phone)
      if (res.success && res.data) {
        toast.success("GT profile created successfully")
        onSuccess(res.data.id)
        onOpenChange(false)
        setPhone("")
      } else {
        const errorMsg = typeof res.error === 'string' 
          ? res.error 
          : JSON.stringify(res.error, Object.getOwnPropertyNames(res.error || {}))
        toast.error(errorMsg || "Failed to create GT profile")
      }
    } catch (err: any) {
      const errorMsg = typeof err === 'string' 
        ? err 
        : err?.message || JSON.stringify(err, Object.getOwnPropertyNames(err || {}))
      toast.error(`Client Error: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New GT Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="gtName" className="text-sm font-medium">Name</label>
              <Input 
                id="gtName" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="e.g. John Doe"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="gtPhone" className="text-sm font-medium">Phone Number</label>
              <Input 
                id="gtPhone" 
                type="tel"
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                placeholder="e.g. 9876543210"
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
