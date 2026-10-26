import type { Database, Product, Shop } from "./types"
import { houseNumber } from "./geo"

/** Actieve winkels in de volgorde van de straat (op huisnummer), handig als looproute. */
export function visibleShops(db: Database): Shop[] {
  return db.shops.filter((s) => s.active).sort(byStreetOrder)
}

export function byStreetOrder(a: Shop, b: Shop) {
  return houseNumber(a.address) - houseNumber(b.address) || a.name.localeCompare(b.name)
}

export function visibleProducts(db: Database): Product[] {
  const active = new Set(db.shops.filter((s) => s.active).map((s) => s.id))
  return db.products.filter((p) => p.active && active.has(p.shopId))
}

export function shopProducts(db: Database, shopId: string, includeHidden = false): Product[] {
  return db.products
    .filter((p) => p.shopId === shopId && (includeHidden || p.active))
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

/** Gerelateerd: zelfde categorie of overlappende woorden, van andere winkels. */
export function relatedProducts(db: Database, product: Product, limit = 8): Product[] {
  const words = new Set(product.title.toLowerCase().split(/\W+/).filter((w) => w.length > 3))
  return visibleProducts(db)
    .filter((p) => p.shopId !== product.shopId)
    .map((p) => {
      let score = p.category === product.category ? 3 : 0
      p.title
        .toLowerCase()
        .split(/\W+/)
        .forEach((w) => words.has(w) && (score += 2))
      score += Math.abs(p.price - product.price) < 15 ? 1 : 0
      // deterministische spreiding zodat verschillende winkels aan bod komen
      score += (p.id.charCodeAt(p.id.length - 1) % 3) / 10
      return { p, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p)
}

export function shopBySlug(db: Database, slug: string) {
  return db.shops.find((s) => s.slug === slug)
}

/** Kan dit product gereserveerd worden? Zo niet: korte uitleg voor de bezoeker. */
export function reserveStatus(db: Database, product: Product, shop: Shop): { ok: true } | { ok: false; reason: string } {
  if (!db.settings.reservationsEnabled) return { ok: false, reason: "Reserveren is op dit moment niet mogelijk" }
  if (!shop.allowReservations) return { ok: false, reason: "Deze winkel werkt niet met reserveringen" }
  if (!product.reservable) return { ok: false, reason: "Dit product is alleen in de winkel te koop" }
  if (!(product.stockMode === "count" ? product.stock > 0 : product.inStock)) return { ok: false, reason: "Op dit moment uitverkocht" }
  return { ok: true }
}
