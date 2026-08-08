'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronRight, Plus } from 'lucide-react'

export interface SelectOption {
  label: string
  value: string
  rightLabel?: string
}

interface CustomSelectProps {
  value: string
  options: SelectOption[]
  onChange: (val: string) => void
  placeholder: string
  onAddNew?: () => void
  addLabel?: string
}

export function CustomSelect({ value, options, onChange, placeholder, onAddNew, addLabel }: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [open])

  const selectedOption = options.find(o => o.value === value)
  const selectedLabel = selectedOption?.label || value
  const selectedRight = selectedOption?.rightLabel

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-background/50 backdrop-blur-sm border border-white/10 outline-none rounded-xl px-4 py-3 text-sm shadow-sm transition-all flex items-center justify-between hover:bg-white/5 focus:border-primary/50 text-left text-foreground font-medium"
      >
        <span className={`flex-1 flex items-center justify-between mr-3 truncate ${!value ? 'text-foreground/40' : 'text-foreground'}`}>
          <span className="truncate">{value ? selectedLabel : placeholder}</span>
          {value && selectedRight && (
            <span className="opacity-50 text-xs font-mono uppercase tracking-wider ml-2 shrink-0">{selectedRight}</span>
          )}
        </span>
        <ChevronRight className={`w-4 h-4 text-foreground/40 transition-transform duration-300 shrink-0 ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-[100] min-w-full w-max bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-56 overflow-y-auto p-1.5 scrollbar-none flex flex-col">
            <div
              onClick={() => { onChange(''); setOpen(false) }}
              className="px-3 py-2.5 text-sm text-foreground/50 hover:bg-white/10 rounded-xl cursor-pointer transition-colors mb-1 font-medium shrink-0"
            >
              — Select —
            </div>
            {options.map(o => (
              <div
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false) }}
                className={`flex items-center justify-between gap-4 px-3 py-2.5 text-sm rounded-xl cursor-pointer transition-colors font-medium shrink-0 ${
                  value === o.value ? 'bg-primary/20 text-primary' : 'text-foreground hover:bg-white/5'
                }`}
              >
                <span className="whitespace-nowrap">{o.label}</span>
                {o.rightLabel && (
                  <span className="opacity-50 text-xs font-mono uppercase tracking-wider">{o.rightLabel}</span>
                )}
              </div>
            ))}
            {onAddNew && (
              <div
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddNew(); setOpen(false) }}
                className="mt-1 px-3 py-2.5 text-sm rounded-xl cursor-pointer transition-colors font-bold text-primary hover:bg-primary/10 flex items-center gap-2 border-t border-white/5 shrink-0"
              >
                <Plus size={16} strokeWidth={2.5} />
                {addLabel || 'Create New'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
