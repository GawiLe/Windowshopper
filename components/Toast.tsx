"use client"

import { useEffect, useState } from "react"

export function toast(message: string) {
  window.dispatchEvent(new CustomEvent("ws-toast", { detail: message }))
}

export function Toaster() {
  const [items, setItems] = useState<{ id: number; text: string }[]>([])
  useEffect(() => {
    const onToast = (e: Event) => {
      const id = Date.now() + Math.random()
      setItems((l) => [...l.slice(-2), { id, text: (e as CustomEvent<string>).detail }])
      setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), 3200)
    }
    window.addEventListener("ws-toast", onToast)
    return () => window.removeEventListener("ws-toast", onToast)
  }, [])
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex flex-col items-center gap-2 px-4">
      {items.map((t) => (
        <div key={t.id} className="animate-fade-up rounded-full bg-ink/95 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          {t.text}
        </div>
      ))}
    </div>
  )
}
