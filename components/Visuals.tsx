import { createElement, useId } from "react"
import type { Product, Shop } from "@/lib/types"
import { cn } from "@/lib/utils"
import { iconFor, monogram } from "@/lib/icons"
import type { LucideIcon } from "lucide-react"

/** Productfoto, of een rustige illustratie met icoon zolang er (nog) geen foto is. */
export function ProductImage({
  product,
  color,
  className,
  index = 0,
  sizes,
}: {
  product: Pick<Product, "images" | "icon" | "title">
  color?: string
  className?: string
  index?: number
  sizes?: string
}) {
  const uid = useId()
  const src = product.images[index]
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={product.title} sizes={sizes} className={cn("h-full w-full object-cover", className)} loading="lazy" />
    )
  }
  const c = color ?? "var(--c-primary)"
  const patternId = `wrap-${uid.replace(/:/g, "")}`
  return (
    <div
      role="img"
      aria-label={product.title}
      className={cn("relative flex h-full w-full items-center justify-center overflow-hidden", className)}
      style={{ background: `linear-gradient(160deg, color-mix(in srgb, ${c} 7%, #fffdf8), color-mix(in srgb, ${c} 16%, #f7f1e6))` }}
    >
      {/* fijn ruitpatroon, als cadeaupapier */}
      <svg aria-hidden className="absolute inset-0 h-full w-full opacity-[0.07]">
        <defs>
          <pattern id={patternId} width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <path d="M0 11h22M11 0v22" stroke={c} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
      <span
        className="relative flex aspect-square w-[46%] items-center justify-center rounded-full bg-white/80 shadow-sm"
        style={{ boxShadow: `0 0 0 1.5px color-mix(in srgb, var(--c-gold) 70%, transparent), 0 10px 30px -12px ${c}` }}
      >
        {createElement(iconFor(product.icon), { className: "h-[46%] w-[46%]", strokeWidth: 1.25, style: { color: c } })}
      </span>
    </div>
  )
}

export function ShopLogo({
  shop,
  size = 48,
  className,
}: {
  shop: Pick<Shop, "logo" | "name" | "coverColor">
  size?: number
  className?: string
}) {
  return (
    <div
      className={cn("gold-border flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white", className)}
      style={{ width: size, height: size, ["--card-bg" as string]: "white" }}
    >
      {shop.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shop.logo} alt={`Logo ${shop.name}`} className="h-full w-full object-cover" />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center font-display font-semibold tracking-tight"
          style={{ background: `color-mix(in srgb, ${shop.coverColor} 9%, white)`, color: shop.coverColor, fontSize: Math.max(9, size * 0.36) }}
          aria-label={`Logo ${shop.name}`}
        >
          {monogram(shop.name)}
        </span>
      )}
    </div>
  )
}

export function StockBadge({ tone, text, className }: { tone: "ok" | "low" | "out"; text: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        tone === "ok" && "bg-primary-soft text-primary",
        tone === "low" && "bg-gold-soft text-[#7a5c17]",
        tone === "out" && "bg-stone-200 text-stone-600",
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "ok" && "bg-primary",
          tone === "low" && "bg-gold",
          tone === "out" && "bg-stone-400",
        )}
      />
      {text}
    </span>
  )
}

/** Klein gouden ornament als scheiding */
export function Ornament({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-3", className)} aria-hidden>
      <span className="gold-line w-12" />
      <span className="gold-text text-lg">✦</span>
      <span className="gold-line w-12" />
    </div>
  )
}

/** Rond icoon met gouden rand, voor lege schermen en uitleg. */
export function IconBadge({ icon: Icon, size = 64, className }: { icon: LucideIcon; size?: number; className?: string }) {
  return (
    <span
      className={cn("gold-border mx-auto flex items-center justify-center rounded-full bg-white text-primary", className)}
      style={{ width: size, height: size, ["--card-bg" as string]: "white" }}
      aria-hidden
    >
      <Icon style={{ width: size * 0.42, height: size * 0.42 }} strokeWidth={1.5} />
    </span>
  )
}
