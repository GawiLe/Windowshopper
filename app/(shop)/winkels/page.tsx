"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { useDB } from "@/lib/store"
import { shopProducts, visibleShops } from "@/lib/selectors"
import { ProductImage, ShopLogo } from "@/components/Visuals"
import { openToday } from "@/lib/utils"

export default function ShopsPage() {
  const db = useDB()
  const shops = visibleShops(db)
  return (
    <div className="wrap pt-6">
      <h1 className="font-display text-3xl font-semibold text-primary sm:text-4xl">De winkels</h1>
      <p className="text-sm text-stone-500">Van boekhandel tot bloemist: dit zijn de winkels die meedoen.</p>
      <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {shops.map((s) => {
          const prods = shopProducts(db, s.id).slice(0, 3)
          const today = openToday(s.openingHours)
          return (
            <li key={s.id}>
              <Link href={`/winkel/${s.slug}`} className="block overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-lg">
                <div className="grid h-28 grid-cols-3 gap-0.5">
                  {prods.map((p) => (
                    <ProductImage key={p.id} product={p} color={s.coverColor} />
                  ))}
                </div>
                <div className="flex items-center gap-3 p-4">
                  <ShopLogo shop={s} size={52} className="-mt-10 ring-4 ring-white" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{s.name}</p>
                    <p className="truncate text-sm text-stone-500">{s.tagline}</p>
                    <p className="mt-0.5 text-xs font-semibold text-primary">{today ? `Vandaag ${today}` : "Vandaag gesloten"}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-stone-400" />
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
