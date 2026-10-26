"use client"

import Link from "next/link"
import { ArrowRight, Camera, CalendarCheck, Package, PackageX } from "lucide-react"
import { isAvailable, todayISO } from "@/lib/utils"
import { useCurrentShop } from "./useShop"
import { ReservationCard } from "./ReservationCard"

export default function ShopDashboard() {
  const { db, shop } = useCurrentShop()
  if (!shop) return null
  const products = db.products.filter((p) => p.shopId === shop.id)
  const max = db.settings.maxProductsPerShop
  const open = db.reservations.filter((r) => r.shopId === shop.id && r.status === "reserved")
  const today = open.filter((r) => r.pickupDate <= todayISO())
  const soldOut = products.filter((p) => p.active && !isAvailable(p))
  const hour = new Date().getHours()
  const greet = hour < 12 ? "Goedemorgen" : hour < 18 ? "Goedemiddag" : "Goedenavond"

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">{greet}!</h1>
        <p className="text-stone-500">Dit gebeurt er vandaag bij {shop.name}.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/winkelier/reserveringen" className="rounded-3xl bg-gold-soft p-4">
          <CalendarCheck className="h-6 w-6 text-[#7a5c17]" />
          <p className="mt-2 text-3xl font-bold">{today.length}</p>
          <p className="text-sm font-semibold">vandaag ophalen</p>
          <p className="text-xs text-stone-500">{open.length} open in totaal</p>
        </Link>
        <Link href="/winkelier/producten" className="rounded-3xl bg-primary-soft p-4">
          <Package className="h-6 w-6 text-primary" />
          <p className="mt-2 text-3xl font-bold">
            {products.length}
            <span className="text-base font-semibold text-stone-500">/{max}</span>
          </p>
          <p className="text-sm font-semibold">producten</p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white">
            <div className="h-full bg-primary" style={{ width: `${(products.length / max) * 100}%` }} />
          </div>
        </Link>
      </div>

      {products.length < max ? (
        <Link href="/winkelier/producten/nieuw" className="flex items-center gap-4 rounded-3xl bg-accent p-5 text-white shadow-md active:scale-[0.99]">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <Camera className="h-7 w-7" />
          </span>
          <span className="flex-1">
            <span className="block text-lg font-bold">Product toevoegen</span>
            <span className="block text-sm text-white/85">Maak een foto en je staat binnen een minuut online</span>
          </span>
          <ArrowRight className="h-5 w-5" />
        </Link>
      ) : (
        <p className="rounded-2xl bg-stone-100 p-4 text-sm">Je hebt het maximum van {max} producten bereikt. Verwijder of vervang een product om iets nieuws toe te voegen.</p>
      )}

      {soldOut.length > 0 && (
        <Link href="/winkelier/producten" className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <PackageX className="h-6 w-6 text-stone-500" />
          <span className="flex-1 text-sm">
            <b>{soldOut.length}</b> product{soldOut.length === 1 ? " staat" : "en staan"} op uitverkocht. Weer binnen? Zet de voorraad aan.
          </span>
          <ArrowRight className="h-4 w-4 text-stone-400" />
        </Link>
      )}

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold text-primary">Vandaag ophalen</h2>
        {today.length ? (
          <ul className="space-y-3">
            {today.map((r) => (
              <ReservationCard key={r.id} r={r} />
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-stone-500 shadow-sm">Geen ophaalafspraken voor vandaag.</p>
        )}
      </section>
    </div>
  )
}
