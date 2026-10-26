"use client"

import { useRef, useState } from "react"
import { Camera, ImagePlus, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react"
import { cn, resizeImage } from "@/lib/utils"
import { toast } from "./Toast"

export const inputCls =
  "h-12 w-full rounded-xl border border-stone-200 bg-white px-4 text-base text-ink placeholder:text-stone-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={cn("block", className)}>
      <span className="text-[15px] font-bold">{label}</span>
      {hint && <span className="block text-xs text-stone-500">{hint}</span>}
      <span className="mt-1.5 block">{children}</span>
      {error && <span className="mt-1 block text-sm font-semibold text-accent">{error}</span>}
    </label>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl bg-white p-4 text-left ring-1 ring-stone-200"
    >
      <span>
        <span className="block text-[15px] font-bold">{label}</span>
        {description && <span className="block text-xs text-stone-500">{description}</span>}
      </span>
      <span className={cn("relative h-8 w-14 shrink-0 rounded-full transition", checked ? "bg-primary" : "bg-stone-300")}>
        <span className={cn("absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all", checked ? "left-7" : "left-1")} />
      </span>
    </button>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div className="grid rounded-2xl bg-stone-100 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "h-11 rounded-xl text-sm font-bold transition",
            value === o.value ? "bg-white text-primary shadow" : "text-stone-500",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Grote, duimvriendelijke foto-kiezer: direct een foto maken met de camera of kiezen uit de galerij. */
export function PhotoPicker({
  images,
  onChange,
  max = 4,
}: {
  images: string[]
  onChange: (imgs: string[]) => void
  max?: number
}) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const handle = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    try {
      const room = max - images.length
      const picked = Array.from(files).slice(0, room)
      const out = await Promise.all(picked.map((f) => resizeImage(f, 1000, 0.78)))
      onChange([...images, ...out])
      if (files.length > room) toast(`Maximaal ${max} foto's per product`)
    } catch {
      toast("Die foto kon niet worden gelezen")
    } finally {
      setBusy(false)
      if (cameraRef.current) cameraRef.current.value = ""
      if (galleryRef.current) galleryRef.current.value = ""
    }
  }

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= images.length) return
    const next = [...images]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div>
      {images.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-2">
          {images.map((src, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-2xl bg-stone-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold">Hoofdfoto</span>}
              <button
                type="button"
                onClick={() => onChange(images.filter((_, k) => k !== i))}
                className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-accent shadow"
                aria-label="Foto verwijderen"
              >
                <X className="h-5 w-5" />
              </button>
              {images.length > 1 && (
                <div className="absolute inset-x-2 bottom-2 flex justify-between">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow disabled:opacity-0" aria-label="Naar links">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow disabled:opacity-0" aria-label="Naar rechts">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length < max && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex h-28 flex-col items-center justify-center gap-1.5 rounded-2xl bg-primary text-white shadow-md active:scale-[0.98]"
          >
            {busy ? <Loader2 className="h-8 w-8 animate-spin" /> : <Camera className="h-8 w-8" />}
            <span className="font-bold">Maak foto</span>
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="flex h-28 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-primary/40 bg-white text-primary active:scale-[0.98]"
          >
            <ImagePlus className="h-8 w-8" />
            <span className="font-bold">Kies uit galerij</span>
          </button>
        </div>
      )}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handle(e.target.files)} />
      <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handle(e.target.files)} />
      <p className="mt-2 text-xs text-stone-500">
        Tip: fotografeer op een rustige achtergrond bij daglicht. {images.length}/{max} foto&apos;s.
      </p>
    </div>
  )
}

/** Logo/afbeelding: één foto, rond weergegeven */
export function SingleImagePicker({ value, onChange, label = "Logo" }: { value: string | null; onChange: (v: string | null) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-100 ring-2 ring-gold">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="h-full w-full object-cover" />
        ) : (
          <Camera className="h-8 w-8 text-stone-400" />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <button type="button" onClick={() => ref.current?.click()} className="h-11 rounded-xl bg-primary px-4 text-sm font-bold text-white">
          {value ? `${label} wijzigen` : `${label} uploaden`}
        </button>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="text-sm font-semibold text-accent">
            Verwijderen
          </button>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (f) onChange(await resizeImage(f, 400, 0.85))
          e.target.value = ""
        }}
      />
    </div>
  )
}
