"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight, Clock, MapPin, Navigation, X } from "lucide-react"
import { useDB } from "@/lib/store"
import { shopProducts, visibleShops } from "@/lib/selectors"
import { ShopMap } from "@/components/ShopMap"
import { ProductImage, ShopLogo } from "@/components/Visuals"
import { cn, openToday } from "@/lib/utils"

export default function MapPage() {
  const db = useDB()
  const shops = visibleShops(db)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const sel = shops.find((s) => s.id === selectedId) ?? null
  const products = sel ? shopProducts(db, sel.id).slice(0, 4) : []
  const today = sel ? openToday(sel.openingHours) : null
  const routeUrl = sel
    ? sel.lat != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${sel.lat},${sel.lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${sel.address}, ${db.settings.town}`)}`
    : "#"

  return (
    <div className="wrap pt-6">
      <h1 className="font-display text-3xl font-semibold text-primary sm:text-4xl">Kaart van het winkelgebied</h1>
      <p className="text-sm text-stone-500">Tik op een pin om de winkel en de kadotips te bekijken.</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="relative overflow-hidden rounded-3xl shadow-md ring-1 ring-black/5">
          <ShopMap
            shops={shops}
            numbered
            selectedId={selectedId}
            onSelect={(s) => setSelectedId(s.id)}
            className="h-[58vh] min-h-[360px] lg:h-[72vh]"
          />

          {sel && (
            <div className="animate-fade-up absolute inset-x-3 bottom-3 z-[500] overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 lg:hidden">
              <SelectedShop
                shop={sel}
                today={today}
                products={products}
                routeUrl={routeUrl}
                onClose={() => setSelectedId(null)}
              />
            </div>
          )}
        </div>

        <aside className="space-y-3">
          {sel && (
            <div className="hidden overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-black/5 lg:block">
              <SelectedShop shop={sel} today={today} products={products} routeUrl={routeUrl} onClose={() => setSelectedId(null)} />
            </div>
          )}
          <p className="pt-1 text-xs font-medium uppercase tracking-[0.2em] text-stone-500">Looproute · {shops.length} winkels</p>
          <ul className="space-y-2 lg:max-h-[60vh] lg:overflow-y-auto lg:pr-1">
            {shops.map((s, i) => (
              <li key={s.id}>
                <button
                  onClick={() => setSelectedId(s.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-black/5 transition hover:ring-gold",
                    sel?.id === s.id && "ring-2 ring-gold",
                  )}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                    {i + 1}
                  </span>
                  <ShopLogo shop={s} size={38} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{s.name}</span>
                    <span className="block truncate text-xs text-stone-500">{s.address}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}

function SelectedShop({
  shop,
  today,
  products,
  routeUrl,
  onClose,
}: {
  shop: import("@/lib/types").Shop
  today: string | null
  products: import("@/lib/types").Product[]
  routeUrl: string
  onClose: () => void
}) {
  return (
    <>
      <div className="flex items-start gap-3 p-4">
        <ShopLogo shop={shop} size={52} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-semibold leading-tight">{shop.name}</p>
          <p className="truncate text-sm text-stone-500">{shop.tagline}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-stone-500">
            <MapPin className="h-3.5 w-3.5" /> {shop.address}
          </p>
          <p className="flex items-center gap-1 text-xs text-stone-500">
            <Clock className="h-3.5 w-3.5" /> {today ? `Vandaag open ${today}` : "Vandaag gesloten"}
          </p>
        </div>
        <button onClick={onClose} aria-label="Sluiten" className="rounded-full p-1 text-stone-400 hover:bg-stone-100">
          <X className="h-5 w-5" />
        </button>
      </div>
      {products.length > 0 && (
        <div className="grid grid-cols-4 gap-0.5">
          {products.map((p) => (
            <Link key={p.id} href={`/product/${p.id}`} className="aspect-square">
              <ProductImage product={p} color={shop.coverColor} />
            </Link>
          ))}
        </div>
      )}
      <div className="grid grid-cols-[auto_1fr]">
        <a
          href={routeUrl}
          target="_blank"
          rel="noreferrer"
          className="flex h-12 items-center justify-center gap-1.5 border-r border-white/10 bg-primary px-4 text-sm font-semibold text-gold"
        >
          <Navigation className="h-4 w-4" /> Route
        </a>
        <Link href={`/winkel/${shop.slug}`} className="flex h-12 items-center justify-center gap-2 bg-primary text-sm font-semibold text-white">
          Bekijk de etalage <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </>
  )
}
