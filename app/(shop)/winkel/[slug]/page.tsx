"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { AtSign, Clock, Globe, MapPin, Phone } from "lucide-react"
import { useDB, useHydrated } from "@/lib/store"
import { shopBySlug, shopProducts } from "@/lib/selectors"
import { ProductCard, ProductGrid } from "@/components/ProductCard"
import { Ornament, ShopLogo } from "@/components/Visuals"
import { SnowDrift } from "@/components/Snow"
import { DAYS, cn } from "@/lib/utils"

export default function ShopPage() {
  const { slug } = useParams<{ slug: string }>()
  const db = useDB()
  const hydrated = useHydrated()
  const shop = shopBySlug(db, slug)

  if (!shop || !shop.active) {
    if (!hydrated) return <div className="h-[60vh]" />
    return (
      <div className="px-4 py-20 text-center">
        <p className="text-5xl">🏠</p>
        <h1 className="mt-3 font-display text-2xl">Deze winkel doet (nog) niet mee</h1>
        <Link href="/winkels" className="mt-4 inline-block font-bold text-accent underline">
          Bekijk alle winkels
        </Link>
      </div>
    )
  }

  const products = shopProducts(db, shop.id)
  const todayIdx = new Date().getDay()
  const orderedDays = [1, 2, 3, 4, 5, 6, 0]

  return (
    <div>
      <section className="starry relative text-white" style={{ background: shop.coverColor }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30" />
        <div className="relative mx-auto max-w-2xl px-5 pb-6 pt-8 text-center">
          <ShopLogo shop={shop} size={104} className="mx-auto shadow-xl" />
          <h1 className="mt-4 font-display text-3xl font-semibold">{shop.name}</h1>
          <p className="gold-text text-sm font-bold uppercase tracking-[0.15em]">{shop.tagline}</p>
          <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-white/90">{shop.bio}</p>
        </div>
        <SnowDrift />
      </section>

      <section className="px-4">
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <a href={`https://maps.google.com/?q=${encodeURIComponent(`${shop.address}, ${db.settings.town}`)}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
            <MapPin className="h-5 w-5 shrink-0 text-accent" />
            <span className="truncate">{shop.address}</span>
          </a>
          {shop.phone && (
            <a href={`tel:${shop.phone}`} className="flex items-center gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
              <Phone className="h-5 w-5 shrink-0 text-accent" />
              <span className="truncate">{shop.phone}</span>
            </a>
          )}
          {shop.website && (
            <a href={shop.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
              <Globe className="h-5 w-5 shrink-0 text-accent" />
              <span className="truncate">Website</span>
            </a>
          )}
          {shop.instagram && (
            <a href={`https://instagram.com/${shop.instagram.replace("@", "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
              <AtSign className="h-5 w-5 shrink-0 text-accent" />
              <span className="truncate">{shop.instagram}</span>
            </a>
          )}
        </div>

        <details className="mt-2 rounded-2xl bg-white p-3 text-sm shadow-sm ring-1 ring-black/5">
          <summary className="flex cursor-pointer items-center gap-2 font-semibold">
            <Clock className="h-5 w-5 text-accent" /> Openingstijden
          </summary>
          <ul className="mt-2 space-y-1 pl-7">
            {orderedDays.map((d) => {
              const h = shop.openingHours.find((x) => x.day === d)
              return (
                <li key={d} className={cn("flex justify-between", d === todayIdx && "font-bold text-primary")}>
                  <span className="capitalize">{DAYS[d]}</span>
                  <span>{h?.open ? `${h.open} – ${h.close}` : "gesloten"}</span>
                </li>
              )
            })}
          </ul>
        </details>

        <Ornament className="my-7" />
        <h2 className="mb-3 font-display text-2xl font-semibold text-primary">
          In de etalage <span className="text-base font-normal text-stone-500">({products.length})</span>
        </h2>
        {products.length ? (
          <ProductGrid>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} shop={shop} showShop={false} />
            ))}
          </ProductGrid>
        ) : (
          <p className="rounded-2xl bg-white p-8 text-center text-stone-500">De etalage wordt nog ingericht ✨</p>
        )}
      </section>
    </div>
  )
}
