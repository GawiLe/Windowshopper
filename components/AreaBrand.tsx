"use client"

import { useDB } from "@/lib/store"
import { monogram } from "@/lib/icons"
import { cn } from "@/lib/utils"

/** Klein beeldmerk van het winkelgebied (menubalk, inlogschermen). Valt terug op een monogram. */
export function AreaMark({ className, framed = false }: { className?: string; framed?: boolean }) {
  const { settings } = useDB()
  if (settings.brand.mark) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={settings.brand.mark} alt="" className={cn("w-auto shrink-0", framed && "rounded-lg bg-primary p-2", className)} />
    )
  }
  return (
    <span
      aria-hidden
      className={cn(
        "flex aspect-square shrink-0 items-center justify-center rounded-full border border-gold/70 font-display font-semibold text-gold",
        framed && "bg-primary",
        className,
      )}
    >
      <span className="text-[0.5em] leading-none">{monogram(settings.areaName)}</span>
    </span>
  )
}

/** Volledig logo (footer); valt terug op de naam in huisstijl. */
export function AreaLogo({ className }: { className?: string }) {
  const { settings } = useDB()
  if (settings.brand.logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={settings.brand.logo} alt={`Winkelgebied ${settings.areaName}, ${settings.town}`} className={cn("w-auto", className)} />
  }
  return (
    <div className="text-gold">
      <p className="text-[11px] font-medium uppercase tracking-[0.25em]">Winkelgebied</p>
      <p className="font-display text-3xl font-semibold leading-tight">{settings.areaName}</p>
      <p className="text-[11px] font-medium uppercase tracking-[0.25em]">{settings.town}</p>
    </div>
  )
}
