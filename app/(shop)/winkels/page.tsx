"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight, Clock, MapPin, Search, SearchX } from "lucide-react"
import { useDB } from "@/lib/store"
import { shopProducts, visibleShops } from "@/lib/selectors"
import { IconBadge, ProductImage, ShopLogo } from "@/components/Visuals"
import { cn, openToday } from "@/lib/utils"
import type { OpeningHours } from "@/lib/types"

type Sort = "route" | "name" | "products"

function openNow(hours: OpeningHours[], d = new Date()) {
  const h = hours.find((x) => x.day === d.getDay())
  if (!h?.open || !h.close) return false
  const t = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  return t >= h.open && t < h.close
}

export default function ShopsPage() {
  const db = useDB()
  const all = visibleShops(db)
  const [q, setQ] = useState("")
  const [cat, setCat] = useState("")
  const [sort, setSort] = useState<Sort>("route")
  const [onlyOpen, setOnlyOpen] = useState(false)

  const cats = [...new Set(all.map((s) => s.category))].sort()
  const needle = q.trim().toLowerCase()
  let shops = all
    .map((s) => ({ shop: s, products: shopProducts(db, s.id) }))
    .filter(
      ({ shop, products }) =>
        (!cat || shop.category === cat) &&
        (!onlyOpen || openNow(shop.openingHours)) &&
        (!needle ||
          shop.name.toLowerCase().includes(needle) ||
          shop.tagline.toLowerCase().includes(needle) ||
          shop.category.toLowerCase().includes(needle) ||
          products.some((p) => p.title.toLowerCase().includes(needle))),
    )
  if (sort === "name") shops = [...shops].sort((a, b) => a.shop.name.localeCompare(b.shop.name))
  if (sort === "products") shops = [...shops].sort((a, b) => b.products.length - a.products.length)

  return (
    <div className="wrap pt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary sm:text-4xl">De winkels</h1>
          <p className="text-sm text-stone-500">
            {all.length} winkels uit winkelgebied {db.settings.areaName} doen mee.
          </p>
        </div>
        <Link href="/kaart" className="flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white">
          <MapPin className="h-4 w-4" /> Bekijk op de kaart
        </Link>
      </div>

      {/* ---------- zoeken, filteren, sorteren ---------- */}
      <div className="sticky top-16 z-30 -mx-4 mt-4 space-y-2.5 bg-cream/95 px-4 pb-3 pt-2 backdrop-blur sm:mx-0 sm:px-0 md:top-20">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek een winkel of kado…"
              className="h-12 w-full rounded-xl border-0 bg-white pl-11 pr-4 text-base shadow-sm ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <div className="flex gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="Sorteren"
              className="h-12 flex-1 rounded-xl bg-white px-3 text-sm shadow-sm ring-1 ring-black/10 sm:w-48 sm:flex-none"
            >
              <option value="route">Looproute (straat)</option>
              <option value="name">Naam A–Z</option>
              <option value="products">Meeste kadotips</option>
            </select>
            <button
              onClick={() => setOnlyOpen((o) => !o)}
              aria-pressed={onlyOpen}
              className={cn(
                "flex h-12 shrink-0 items-center gap-1.5 rounded-xl px-4 text-sm font-medium shadow-sm ring-1",
                onlyOpen ? "bg-primary text-white ring-primary" : "bg-white ring-black/10",
              )}
            >
              <Clock className="h-4 w-4" /> Nu open
            </button>
          </div>
        </div>
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {["", ...cats].map((c) => (
            <button
              key={c || "alle"}
              onClick={() => setCat(c)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium shadow-sm ring-1 transition",
                cat === c ? "bg-primary text-white ring-primary" : "bg-white ring-black/10",
              )}
            >
              {c || "Alle winkels"}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 text-sm text-stone-500">{shops.length} winkel{shops.length === 1 ? "" : "s"}</p>

      {shops.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
          <IconBadge icon={SearchX} />
          <p className="mt-3 font-semibold">Geen winkels gevonden</p>
          <p className="text-sm text-stone-500">Probeer een andere zoekterm of categorie.</p>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shops.map(({ shop: s, products }) => {
            const today = openToday(s.openingHours)
            const three = products.slice(0, 3)
            return (
              <li key={s.id} className="flex">
                <article className="flex w-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-lg">
                  <Link href={`/winkel/${s.slug}`} className="flex flex-1 flex-col">
                    <div
                      className="relative flex justify-center pb-4 pt-7"
                      style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${s.coverColor} 16%, white), white)` }}
                    >
                      <ShopLogo shop={s} size={112} className="shadow-lg" />
                    </div>
                    <div className="px-5 text-center">
                      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">{s.category}</p>
                      <h2 className="mt-0.5 font-display text-xl font-semibold leading-tight text-primary">{s.name}</h2>
                      <p className="mt-0.5 line-clamp-1 text-sm text-stone-500">{s.tagline}</p>
                      <p className="mt-1 text-xs font-medium text-primary">{today ? `Vandaag open ${today}` : "Vandaag gesloten"}</p>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-1.5 px-4">
                      {[0, 1, 2].map((i) =>
                        three[i] ? (
                          <div key={three[i].id} className="aspect-square overflow-hidden rounded-xl">
                            <ProductImage product={three[i]} color={s.coverColor} />
                          </div>
                        ) : (
                          <div key={i} className="aspect-square rounded-xl bg-stone-50" />
                        ),
                      )}
                    </div>
                    <p className="mt-2 px-5 text-center text-xs text-stone-500">
                      {products.length} kadotip{products.length === 1 ? "" : "s"} in de etalage
                    </p>
                  </Link>
                  <div className="mt-4 grid grid-cols-2 border-t border-stone-100">
                    <Link
                      href={`/kaart?winkel=${s.slug}`}
                      className="flex h-12 items-center justify-center gap-1.5 border-r border-stone-100 text-sm font-medium text-primary hover:bg-stone-50"
                    >
                      <MapPin className="h-4 w-4" /> Op de kaart
                    </Link>
                    <Link href={`/winkel/${s.slug}`} className="flex h-12 items-center justify-center gap-1.5 text-sm font-semibold text-accent hover:bg-stone-50">
                      Etalage <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
