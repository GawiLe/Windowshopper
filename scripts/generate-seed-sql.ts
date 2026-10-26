// Genereert db/seed.sql uit de demo-data in lib/seed.ts.
// Gebruik: npm run db:seed-sql   →   psql "$DATABASE_URL" -f db/seed.sql
import { writeFileSync } from "node:fs"
import { createSeed } from "../lib/seed"

const q = (v: unknown): string => {
  if (v === null || v === undefined) return "null"
  if (typeof v === "number") return String(v)
  if (typeof v === "boolean") return v ? "true" : "false"
  return `'${String(v).replace(/'/g, "''")}'`
}
const arr = (xs: string[]) => (xs.length ? `array[${xs.map(q).join(", ")}]::text[]` : "'{}'::text[]")
const json = (v: unknown) => `${q(JSON.stringify(v))}::jsonb`

const db = createSeed()
const s = db.settings
const out: string[] = [
  "-- Gegenereerd door scripts/generate-seed-sql.ts – niet met de hand bewerken.",
  "-- Demo-data: alle winkels zijn fictief.",
  "begin;",
  "",
  `update site_settings set
  site_name = ${q(s.siteName)}, area_name = ${q(s.areaName)}, town = ${q(s.town)},
  hero_title = ${q(s.heroTitle)}, hero_subtitle = ${q(s.heroSubtitle)},
  intro_text = ${q(s.introText)}, footer_text = ${q(s.footerText)},
  campaign_start = ${q(s.campaignStart)}, campaign_end = ${q(s.campaignEnd)},
  max_products_per_shop = ${s.maxProductsPerShop}, reservation_hours = ${s.reservationHours},
  reservations_enabled = ${s.reservationsEnabled}, snow_enabled = ${s.snowEnabled},
  colors = ${json(s.colors)}, categories = ${arr(s.categories)}, privacy = ${json(s.privacy)},
  updated_at = now()
where id = 1;`,
  "",
]

for (const shop of db.shops) {
  out.push(
    `insert into shops (slug, name, tagline, bio, category, logo_url, cover_color, emoji, address, phone, email, website, instagram, opening_hours, map_x, map_y, lat, lng, allow_reservations, active)
values (${[
      shop.slug, shop.name, shop.tagline, shop.bio, shop.category, shop.logo, shop.coverColor, shop.emoji, shop.address,
      shop.phone, shop.email, shop.website, shop.instagram,
    ].map(q).join(", ")}, ${json(shop.openingHours)}, ${shop.mapX}, ${shop.mapY}, ${q(shop.lat)}, ${q(shop.lng)}, ${shop.allowReservations}, ${shop.active});`,
  )
  out.push(`insert into users (email, name, role, shop_id) select ${q(shop.email)}, ${q(shop.name)}, 'shop', id from shops where slug = ${q(shop.slug)};`)
  for (const p of db.products.filter((x) => x.shopId === shop.id)) {
    out.push(
      `insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, ${q(p.title)}, ${q(p.description)}, ${Math.round(p.price * 100)}, ${arr(p.images)}, ${q(p.emoji)}, ${q(p.category)}, ${arr(p.tags)}, ${q(p.stockMode)}, ${p.stock}, ${p.inStock}, ${p.reservable}, ${p.active}, ${p.sortOrder}
from shops where slug = ${q(shop.slug)};`,
    )
  }
  out.push("")
}

out.push(
  "-- Beheerder: vervang door je eigen e-mailadres; daarmee log je in via een inloglink.",
  `insert into users (email, name, role) values ('admin@example.nl', 'Beheerder', 'admin');`,
  "",
  "commit;",
  "",
)

writeFileSync(new URL("../db/seed.sql", import.meta.url), out.join("\n"))
console.log(`db/seed.sql geschreven: ${db.shops.length} winkels, ${db.products.length} producten`)
