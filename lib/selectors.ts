import type { Database, Product, Shop } from "./types"

export function visibleShops(db: Database): Shop[] {
  return db.shops.filter((s) => s.active).sort((a, b) => a.mapX - b.mapX)
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
