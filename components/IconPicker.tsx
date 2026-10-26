"use client"

import { useState } from "react"
import { ICON_KEYS, ICONS } from "@/lib/icons"
import { cn } from "@/lib/utils"

/** Raster met iconen; standaard de eerste 16, met "Meer iconen" voor de rest. */
export function IconPicker({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const [all, setAll] = useState(false)
  const keys = all ? ICON_KEYS : ICON_KEYS.slice(0, 16).concat(ICON_KEYS.slice(16).includes(value) ? [value] : [])
  return (
    <div>
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
        {keys.map((k) => {
          const { Icon, label } = ICONS[k]
          const on = k === value
          return (
            <button
              type="button"
              key={k}
              onClick={() => onChange(k)}
              title={label}
              aria-label={label}
              aria-pressed={on}
              className={cn(
                "flex aspect-square items-center justify-center rounded-xl transition",
                on ? "bg-primary text-gold ring-2 ring-gold" : "bg-white text-stone-600 ring-1 ring-stone-200 hover:ring-primary",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={1.5} />
            </button>
          )
        })}
      </div>
      <button type="button" onClick={() => setAll((a) => !a)} className="mt-2 text-sm font-medium text-primary underline">
        {all ? "Minder iconen" : `Meer iconen (${ICON_KEYS.length})`}
      </button>
    </div>
  )
}
