import type { Product, Shop } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Productfoto, of een feestelijke illustratie met emoji als er (nog) geen foto is. */
export function ProductImage({
  product,
  color,
  className,
  index = 0,
  sizes,
}: {
  product: Pick<Product, "images" | "emoji" | "title">
  color?: string
  className?: string
  index?: number
  sizes?: string
}) {
  const src = product.images[index]
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={product.title} sizes={sizes} className={cn("h-full w-full object-cover", className)} loading="lazy" />
    )
  }
  const c = color ?? "var(--c-primary)"
  return (
    <div
      role="img"
      aria-label={product.title}
      className={cn("relative flex h-full w-full items-center justify-center overflow-hidden", className)}
      style={{
        background: `radial-gradient(circle at 30% 25%, color-mix(in srgb, ${c} 18%, white), color-mix(in srgb, ${c} 38%, white) 70%)`,
      }}
    >
      <span className="absolute -right-3 -top-3 text-5xl opacity-20">❄</span>
      <span className="absolute -bottom-2 left-2 text-3xl opacity-15">❄</span>
      <span className="text-6xl drop-shadow-sm sm:text-7xl">{product.emoji || "🎁"}</span>
    </div>
  )
}

export function ShopLogo({ shop, size = 48, className }: { shop: Pick<Shop, "logo" | "emoji" | "name" | "coverColor">; size?: number; className?: string }) {
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
          className="flex h-full w-full items-center justify-center"
          style={{ background: `color-mix(in srgb, ${shop.coverColor} 14%, white)`, fontSize: size * 0.48 }}
          aria-label={`Logo ${shop.name}`}
        >
          {shop.emoji}
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
