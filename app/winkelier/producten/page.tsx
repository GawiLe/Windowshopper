"use client"

import Link from "next/link"
import { ArrowDown, ArrowUp, Camera, EyeOff, Minus, Pencil, Plus } from "lucide-react"
import { actions } from "@/lib/store"
import { shopProducts } from "@/lib/selectors"
import { IconBadge, ProductImage, StockBadge } from "@/components/Visuals"
import { cn, euro, stockLabel } from "@/lib/utils"
import type { Product } from "@/lib/types"
import { useCurrentShop } from "../useShop"

export default function ProductsPage() {
  const { db, shop } = useCurrentShop()
  if (!shop) return null
  const products = shopProducts(db, shop.id, true)
  const max = db.settings.maxProductsPerShop

  const update = (p: Product, patch: Partial<Product>) => actions.upsertProduct({ ...p, ...patch })

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-primary">Mijn producten</h1>
          <p className="text-sm text-stone-500">
            {products.length} van {max} geplaatst
          </p>
        </div>
        {products.length < max && (
          <Link href="/winkelier/producten/nieuw" className="flex h-11 items-center gap-1 rounded-xl bg-accent px-4 text-sm font-bold text-white">
            <Plus className="h-4 w-4" /> Nieuw
          </Link>
        )}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200">
        <div className="h-full rounded-full bg-gradient-to-r from-primary to-gold" style={{ width: `${(products.length / max) * 100}%` }} />
      </div>

      {products.length === 0 && (
        <Link href="/winkelier/producten/nieuw" className="mt-6 block rounded-3xl border-2 border-dashed border-primary/30 bg-white p-10 text-center">
          <IconBadge icon={Camera} />
          <p className="mt-2 font-bold">Plaats je eerste kadotip</p>
          <p className="text-sm text-stone-500">Maak een foto, vul een prijs in en klaar.</p>
        </Link>
      )}

      <ul className="mt-5 space-y-3">
        {products.map((p, i) => {
          const st = stockLabel(p)
          return (
            <li key={p.id} className={cn("rounded-3xl bg-white p-3 shadow-sm ring-1 ring-black/5", !p.active && "opacity-60")}>
              <div className="flex gap-3">
                <Link href={`/winkelier/producten/${p.id}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
                  <ProductImage product={p} color={shop.coverColor} />
                  {!p.active && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                      <EyeOff className="h-6 w-6" />
                    </span>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/winkelier/producten/${p.id}`} className="line-clamp-2 font-bold leading-snug">
                    {p.title}
                  </Link>
                  <p className="text-sm font-semibold text-primary">{euro(p.price)}</p>
                  <StockBadge {...st} className="mt-1" />
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => actions.moveProduct(p.id, -1)} disabled={i === 0} className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 disabled:opacity-30" aria-label="Omhoog">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button onClick={() => actions.moveProduct(p.id, 1)} disabled={i === products.length - 1} className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 disabled:opacity-30" aria-label="Omlaag">
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* snelle voorraadknoppen */}
              <div className="mt-3 flex items-center gap-2">
                {p.stockMode === "count" ? (
                  <div className="flex flex-1 items-center justify-between rounded-2xl bg-stone-100 p-1">
                    <button onClick={() => update(p, { stock: Math.max(0, p.stock - 1) })} className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm" aria-label="Voorraad min">
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-bold">{p.stock} op voorraad</span>
                    <button onClick={() => update(p, { stock: p.stock + 1 })} className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm" aria-label="Voorraad plus">
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => update(p, { inStock: !p.inStock })}
                    className={cn("h-12 flex-1 rounded-2xl text-sm font-bold", p.inStock ? "bg-primary-soft text-primary" : "bg-stone-200 text-stone-600")}
                  >
                    {p.inStock ? "Op voorraad · tik voor uitverkocht" : "Uitverkocht · tik voor op voorraad"}
                  </button>
                )}
                <Link href={`/winkelier/producten/${p.id}`} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100" aria-label="Bewerken">
                  <Pencil className="h-5 w-5" />
                </Link>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
