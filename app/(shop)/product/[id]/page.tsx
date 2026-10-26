"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, CalendarClock, Clock, MapPin, PackageX, Share2 } from "lucide-react"
import { useDB, useHydrated } from "@/lib/store"
import { relatedProducts, shopProducts } from "@/lib/selectors"
import { ListToggle, ProductRow } from "@/components/ProductCard"
import { IconBadge, ProductImage, ShopLogo, StockBadge } from "@/components/Visuals"
import { toast } from "@/components/Toast"
import { cn, euro, isAvailable, openToday, stockLabel } from "@/lib/utils"

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const db = useDB()
  const hydrated = useHydrated()
  const [slide, setSlide] = useState(0)

  const product = db.products.find((p) => p.id === id)
  const shop = product && db.shops.find((s) => s.id === product.shopId)

  if (!product || !shop || !product.active || !shop.active) {
    if (!hydrated) return <div className="h-[60vh]" />
    return (
      <div className="px-4 py-20 text-center">
        <IconBadge icon={PackageX} />
        <h1 className="mt-3 font-display text-2xl">Dit kado is niet (meer) te vinden</h1>
        <Link href="/winkelstraat" className="mt-4 inline-block font-bold text-accent underline">
          Terug naar alle kado&apos;s
        </Link>
      </div>
    )
  }

  const stock = stockLabel(product)
  const fromShop = shopProducts(db, shop.id).filter((p) => p.id !== product.id)
  const related = relatedProducts(db, product)
  const images = product.images.length ? product.images : [""]
  const today = openToday(shop.openingHours)
  const canReserve = db.settings.reservationsEnabled && shop.allowReservations && product.reservable && isAvailable(product)

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: product.title, text: `${product.title} bij ${shop.name}`, url })
      else {
        await navigator.clipboard.writeText(url)
        toast("Link gekopieerd")
      }
    } catch {
      /* geannuleerd */
    }
  }

  return (
    <article className="md:wrap md:grid md:grid-cols-2 md:gap-10 md:pt-8 lg:gap-14">
      <div className="relative md:sticky md:top-28 md:self-start md:overflow-hidden md:rounded-3xl md:shadow-sm md:ring-1 md:ring-black/5">
        <div
          className="scrollbar-none flex aspect-square snap-x snap-mandatory overflow-x-auto bg-white"
          onScroll={(e) => {
            const el = e.currentTarget
            setSlide(Math.round(el.scrollLeft / el.clientWidth))
          }}
        >
          {images.map((_, i) => (
            <div key={i} className="h-full w-full shrink-0 snap-center">
              <ProductImage product={product} color={shop.coverColor} index={i} />
            </div>
          ))}
        </div>
        <button
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/winkelstraat"))}
          className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md"
          aria-label="Terug"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          onClick={share}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md"
          aria-label="Delen"
        >
          <Share2 className="h-5 w-5" />
        </button>
        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <span key={i} className={cn("h-2 rounded-full transition-all", i === slide ? "w-5 bg-white" : "w-2 bg-white/60")} />
            ))}
          </div>
        )}
      </div>

      <div className="relative -mt-5 rounded-t-3xl bg-cream px-4 pt-5 md:mt-0 md:rounded-none md:px-0 md:pt-0">
        <Link href={`/winkel/${shop.slug}`} className="flex items-center gap-2.5">
          <ShopLogo shop={shop} size={36} />
          <span>
            <span className="block text-sm font-bold">{shop.name}</span>
            <span className="block text-xs text-stone-500">{shop.address}</span>
          </span>
        </Link>

        <h1 className="mt-3 font-display text-[28px] font-semibold leading-tight">{product.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="font-display text-2xl font-semibold text-primary">{euro(product.price)}</span>
          <StockBadge {...stock} />
        </div>

        <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-stone-700">{product.description}</p>

        <div className="mt-5 hidden md:block">
          <ListToggle product={product} variant="full" />
        </div>

        <ul className="mt-5 space-y-2.5 rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-black/5">
          <li className="flex gap-3">
            <MapPin className="h-5 w-5 shrink-0 text-accent" />
            <span>
              Te koop bij <b>{shop.name}</b>, {shop.address}
            </span>
          </li>
          <li className="flex gap-3">
            <Clock className="h-5 w-5 shrink-0 text-accent" />
            <span>{today ? `Vandaag open ${today}` : "Vandaag gesloten"}</span>
          </li>
          <li className="flex gap-3">
            <CalendarClock className="h-5 w-5 shrink-0 text-accent" />
            <span>
              {canReserve
                ? `Je kunt dit gratis ${db.settings.reservationHours} uur laten reserveren via je lijstje.`
                : "Dit product kun je niet reserveren, maar wel op je lijstje zetten."}
            </span>
          </li>
        </ul>

        {fromShop.length > 0 && (
          <section className="mt-8">
            <div className="mb-3 flex items-end justify-between">
              <h2 className="font-display text-xl font-semibold text-primary">Meer van {shop.name}</h2>
              <Link href={`/winkel/${shop.slug}`} className="text-sm font-bold text-accent">
                Naar winkel
              </Link>
            </div>
            <ProductRow products={fromShop} shops={db.shops} />
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 font-display text-xl font-semibold text-primary">Ook leuk, bij andere winkels</h2>
            <ProductRow products={related} shops={db.shops} />
          </section>
        )}
      </div>

      {/* vaste actieknop boven de navigatie op mobiel */}
      <div className="no-print fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 bg-gradient-to-t from-cream via-cream/95 to-transparent px-4 pb-3 pt-6 md:hidden">
        <ListToggle product={product} variant="full" />
      </div>
      <div className="h-24 md:hidden" />
    </article>
  )
}
