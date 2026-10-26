"use client"

import Link from "next/link"
import { useCurrentShop } from "../../useShop"
import { ProductForm } from "../../ProductForm"

export default function NewProductPage() {
  const { db, shop } = useCurrentShop()
  if (!shop) return null
  const count = db.products.filter((p) => p.shopId === shop.id).length
  const max = db.settings.maxProductsPerShop
  if (count >= max)
    return (
      <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
        <p className="text-4xl">📦</p>
        <h1 className="mt-2 text-xl font-bold">Je etalage is vol</h1>
        <p className="mt-1 text-sm text-stone-500">Je hebt {max} producten. Verwijder er eerst één om iets nieuws toe te voegen.</p>
        <Link href="/winkelier/producten" className="mt-4 inline-block font-bold text-primary underline">
          Naar mijn producten
        </Link>
      </div>
    )
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-primary">Nieuw product</h1>
      <p className="mb-5 text-sm text-stone-500">
        Product {count + 1} van {max}
      </p>
      <ProductForm shop={shop} />
    </div>
  )
}
