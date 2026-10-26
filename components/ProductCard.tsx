"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { Check, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { listActions, useHydrated, useList } from "@/lib/store"
import type { Product, Shop } from "@/lib/types"
import { cn, euro, isAvailable, stockLabel } from "@/lib/utils"
import { ProductImage, ShopLogo, StockBadge } from "./Visuals"
import { toast } from "./Toast"

export function useOnList(productId: string) {
  const list = useList()
  const hydrated = useHydrated()
  return hydrated && list.some((e) => e.productId === productId)
}

export function ListToggle({ product, variant = "icon" }: { product: Product; variant?: "icon" | "full" }) {
  const on = useOnList(product.id)
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    listActions.toggle(product.id)
    toast(on ? "Van je lijstje gehaald" : "Op je lijstje gezet")
  }
  if (variant === "full") {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold shadow-md transition active:scale-[0.98]",
          on ? "bg-white text-primary ring-2 ring-primary" : "bg-accent text-white",
        )}
      >
        {on ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
        {on ? "Staat op je lijstje" : "Zet op mijn lijstje"}
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      aria-label={on ? `${product.title} van lijstje halen` : `${product.title} op lijstje zetten`}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full shadow-md transition active:scale-90",
        on ? "bg-primary text-white" : "bg-white text-accent",
      )}
    >
      {on ? <Check key="c" className="animate-pop h-5 w-5" /> : <Plus className="h-5 w-5" />}
    </button>
  )
}

export function ProductCard({ product, shop, showShop = true }: { product: Product; shop?: Shop; showShop?: boolean }) {
  const stock = stockLabel(product)
  const available = isAvailable(product)
  return (
    <Link
      href={`/product/${product.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-lg"
    >
      <div className={cn("relative aspect-square overflow-hidden", !available && "opacity-60 grayscale-[40%]")}>
        <ProductImage product={product} color={shop?.coverColor} className="transition duration-500 group-hover:scale-105" />
        <div className="absolute right-2 top-2">
          <ListToggle product={product} />
        </div>
        {!available && (
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-stone-600">
            Uitverkocht
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        {showShop && shop && (
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
            <ShopLogo shop={shop} size={18} />
            <span className="truncate">{shop.name}</span>
          </span>
        )}
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug">{product.title}</h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <span className="font-display text-lg font-semibold text-primary">{euro(product.price)}</span>
          {stock.tone !== "ok" && available && <StockBadge {...stock} className="hidden sm:inline-flex" />}
        </div>
      </div>
    </Link>
  )
}

export function ProductGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5", className)}>{children}</div>
}

/** Horizontale scroll-rij, fijn op de telefoon */
export function ProductRow({ products, shops }: { products: Product[]; shops: Shop[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ left: false, right: false })

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setEdges({ left: el.scrollLeft > 8, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 8 })
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [update, products.length])

  const scroll = (dir: -1 | 1) => {
    const el = ref.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" })
  }

  return (
    <div className="relative">
      <div
        ref={ref}
        onScroll={update}
        className="scrollbar-none -mx-4 flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 sm:gap-4"
      >
        {products.map((p) => (
          <div key={p.id} className="w-[44%] shrink-0 snap-start sm:w-56 lg:w-60">
            <ProductCard product={p} shop={shops.find((s) => s.id === p.shopId)} />
          </div>
        ))}
      </div>
      {edges.left && <RowArrow dir={-1} onClick={() => scroll(-1)} />}
      {edges.right && <RowArrow dir={1} onClick={() => scroll(1)} />}
    </div>
  )
}

function RowArrow({ dir, onClick }: { dir: -1 | 1; onClick: () => void }) {
  const Icon = dir === -1 ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === -1 ? "Vorige producten" : "Volgende producten"}
      className={cn(
        "absolute top-[30%] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-primary shadow-lg ring-1 ring-black/10 transition hover:bg-primary hover:text-white",
        dir === -1 ? "-left-2 sm:-left-4" : "-right-2 sm:-right-4",
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}
