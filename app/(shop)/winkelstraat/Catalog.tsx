"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { useDB } from "@/lib/store"
import { visibleProducts, visibleShops } from "@/lib/selectors"
import { ProductCard, ProductGrid } from "@/components/ProductCard"
import { cn, isAvailable } from "@/lib/utils"

type Sort = "default" | "price-asc" | "price-desc" | "new"

const PRICE_RANGES = [
  { id: "", label: "Elke prijs" },
  { id: "0-15", label: "Tot €15" },
  { id: "15-30", label: "€15 – €30" },
  { id: "30-60", label: "€30 – €60" },
  { id: "60-9999", label: "€60+" },
]

export function Catalog() {
  const db = useDB()
  const router = useRouter()
  const params = useSearchParams()
  const shops = visibleShops(db)
  const all = visibleProducts(db)

  const cat = params.get("cat") ?? ""
  const shop = params.get("winkel") ?? ""
  const [q, setQ] = useState(params.get("q") ?? "")
  const [price, setPrice] = useState("")
  const [sort, setSort] = useState<Sort>("default")
  const [onlyStock, setOnlyStock] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params.toString())
    if (v) next.set(k, v)
    else next.delete(k)
    router.replace(`/winkelstraat${next.size ? `?${next}` : ""}`, { scroll: false })
  }

  const cats = db.settings.categories.filter((c) => all.some((p) => p.category === c))

  const list = (() => {
    const needle = q.trim().toLowerCase()
    const [min, max] = price ? price.split("-").map(Number) : [0, Infinity]
    let r = all.filter(
      (p) =>
        (!cat || p.category === cat) &&
        (!shop || p.shopId === shop) &&
        (!onlyStock || isAvailable(p)) &&
        p.price >= min &&
        p.price < max &&
        (!needle ||
          p.title.toLowerCase().includes(needle) ||
          p.description.toLowerCase().includes(needle) ||
          shops.find((s) => s.id === p.shopId)?.name.toLowerCase().includes(needle)),
    )
    if (sort === "price-asc") r = [...r].sort((a, b) => a.price - b.price)
    else if (sort === "price-desc") r = [...r].sort((a, b) => b.price - a.price)
    else if (sort === "new") r = [...r].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    else {
      // standaard: winkels door elkaar, zodat het voelt als een straat vol etalages
      r = [...r].sort((a, b) => a.sortOrder - b.sortOrder || a.shopId.localeCompare(b.shopId))
    }
    return r
  })()

  const activeFilters = (price ? 1 : 0) + (onlyStock ? 1 : 0) + (shop ? 1 : 0) + (sort !== "default" ? 1 : 0)

  return (
    <div className="px-4 pt-5">
      <h1 className="font-display text-3xl font-semibold text-primary">Alle kado&apos;s</h1>
      <p className="text-sm text-stone-500">Kadotips uit de etalages van {shops.length} winkels</p>

      <div className="sticky top-14 z-30 -mx-4 mt-4 bg-cream/95 px-4 pb-3 pt-2 backdrop-blur md:top-16">
        <div className="flex gap-2">
          <label className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek een kado of winkel…"
              className="h-12 w-full rounded-2xl border-0 bg-white pl-11 pr-4 text-base shadow-sm ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={cn(
              "relative flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/10",
              showFilters ? "bg-primary text-white" : "bg-white",
            )}
            aria-expanded={showFilters}
            aria-label="Filters"
          >
            <SlidersHorizontal className="h-5 w-5" />
            {activeFilters > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        <div className="scrollbar-none -mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4">
          <Chip active={!cat} onClick={() => setParam("cat", "")}>
            Alles
          </Chip>
          {cats.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setParam("cat", cat === c ? "" : c)}>
              {c}
            </Chip>
          ))}
        </div>

        {showFilters && (
          <div className="animate-fade-up mt-3 space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-stone-500">Prijs</p>
              <div className="flex flex-wrap gap-2">
                {PRICE_RANGES.map((r) => (
                  <Chip key={r.id} small active={price === r.id} onClick={() => setPrice(r.id)}>
                    {r.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-bold uppercase tracking-wide text-stone-500">
                Winkel
                <select
                  value={shop}
                  onChange={(e) => setParam("winkel", e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-white px-2 text-sm font-normal normal-case tracking-normal text-ink"
                >
                  <option value="">Alle winkels</option>
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold uppercase tracking-wide text-stone-500">
                Sorteren
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-white px-2 text-sm font-normal normal-case tracking-normal text-ink"
                >
                  <option value="default">Etalagevolgorde</option>
                  <option value="price-asc">Prijs laag–hoog</option>
                  <option value="price-desc">Prijs hoog–laag</option>
                  <option value="new">Nieuwste</option>
                </select>
              </label>
            </div>
            <label className="flex items-center gap-3 text-sm font-semibold">
              <input type="checkbox" checked={onlyStock} onChange={(e) => setOnlyStock(e.target.checked)} className="h-5 w-5 accent-[var(--c-primary)]" />
              Alleen wat op voorraad is
            </label>
            {activeFilters > 0 && (
              <button
                onClick={() => {
                  setPrice("")
                  setOnlyStock(false)
                  setSort("default")
                  setParam("winkel", "")
                }}
                className="flex items-center gap-1 text-sm font-bold text-accent"
              >
                <X className="h-4 w-4" /> Filters wissen
              </button>
            )}
          </div>
        )}
      </div>

      <p className="mb-3 text-sm text-stone-500">{list.length} kado&apos;s gevonden</p>
      {list.length ? (
        <ProductGrid>
          {list.map((p) => (
            <ProductCard key={p.id} product={p} shop={shops.find((s) => s.id === p.shopId)} />
          ))}
        </ProductGrid>
      ) : (
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
          <p className="text-5xl">⛄</p>
          <p className="mt-3 font-bold">Niets gevonden</p>
          <p className="text-sm text-stone-500">Probeer een andere zoekterm of categorie.</p>
        </div>
      )}
    </div>
  )
}

function Chip({ active, onClick, children, small }: { active: boolean; onClick: () => void; children: React.ReactNode; small?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full font-semibold shadow-sm ring-1 transition",
        small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
        active ? "bg-primary text-white ring-primary" : "bg-white text-ink ring-black/10",
      )}
    >
      {children}
    </button>
  )
}
