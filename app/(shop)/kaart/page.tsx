"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ArrowRight, X } from "lucide-react"
import { useDB } from "@/lib/store"
import { shopProducts, visibleShops } from "@/lib/selectors"
import { StreetMap } from "@/components/StreetMap"
import { ProductImage, ShopLogo } from "@/components/Visuals"
import type { Shop } from "@/lib/types"
import { cn, openToday } from "@/lib/utils"

export default function MapPage() {
  const db = useDB()
  const shops = visibleShops(db)
  const [selected, setSelected] = useState<Shop | null>(null)
  const scroller = useRef<HTMLDivElement>(null)

  // centreer de kaart op de geselecteerde winkel (op mobiel is de kaart breder dan het scherm)
  useEffect(() => {
    const el = scroller.current
    if (!el || !selected) return
    const target = (selected.mapX / 100) * el.scrollWidth - el.clientWidth / 2
    el.scrollTo({ left: target, behavior: "smooth" })
  }, [selected])

  const sel = selected && shops.find((s) => s.id === selected.id)
  const products = sel ? shopProducts(db, sel.id).slice(0, 4) : []

  return (
    <div className="pt-5">
      <div className="px-4">
        <h1 className="font-display text-3xl font-semibold text-primary">Wandel door de straat</h1>
        <p className="text-sm text-stone-500">Veeg langs de etalages en tik op een winkel.</p>
      </div>

      <div ref={scroller} className="scrollbar-none mt-4 overflow-x-auto md:mx-4 md:overflow-hidden md:rounded-3xl md:shadow-md">
        <div className="w-[230%] sm:w-[160%] md:w-full">
          <StreetMap shops={shops} selectedId={sel?.id} onSelect={(s) => setSelected(s)} />
        </div>
      </div>
      <p className="mt-1 px-4 text-center text-xs text-stone-400 md:hidden">← veeg om door de straat te lopen →</p>

      {sel ? (
        <div className="animate-fade-up mx-4 mt-4 overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-black/5">
          <div className="flex items-start gap-3 p-4">
            <ShopLogo shop={sel} size={56} />
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl font-semibold">{sel.name}</p>
              <p className="text-sm text-stone-500">{sel.tagline}</p>
              <p className="text-xs text-stone-500">
                {sel.address} · {openToday(sel.openingHours) ? `vandaag ${openToday(sel.openingHours)}` : "vandaag gesloten"}
              </p>
            </div>
            <button onClick={() => setSelected(null)} aria-label="Sluiten" className="rounded-full p-1 text-stone-400">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-0.5">
            {products.map((p) => (
              <Link key={p.id} href={`/product/${p.id}`} className="aspect-square">
                <ProductImage product={p} color={sel.coverColor} />
              </Link>
            ))}
          </div>
          <Link href={`/winkel/${sel.slug}`} className="flex h-14 items-center justify-center gap-2 bg-primary font-bold text-white">
            Bekijk de etalage <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}

      <ul className="mt-6 space-y-2 px-4">
        {shops.map((s, i) => (
          <li key={s.id}>
            <button
              onClick={() => setSelected(s)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-black/5",
                sel?.id === s.id && "ring-2 ring-gold",
              )}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{i + 1}</span>
              <ShopLogo shop={s} size={36} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">{s.name}</span>
                <span className="block truncate text-xs text-stone-500">{s.address}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
