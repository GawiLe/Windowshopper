"use client"

import { useParams } from "next/navigation"
import { useCurrentShop } from "../../useShop"
import { ProductForm } from "../../ProductForm"

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const { db, shop } = useCurrentShop()
  const product = db.products.find((p) => p.id === id && p.shopId === shop?.id)
  if (!shop) return null
  if (!product) return <p className="text-center text-stone-500">Product niet gevonden.</p>
  return (
    <div>
      <h1 className="mb-5 font-display text-2xl font-semibold text-primary">Product bewerken</h1>
      <ProductForm key={product.id} shop={shop} product={product} />
    </div>
  )
}
