// Genereert db/seed.sql uit de demo-data (alle winkelgebieden uit lib/platform-seed.ts).
// Gebruik: SUPER_ADMIN_PASSWORD='…' npm run db:seed-sql   →   psql "$DATABASE_URL_OWNER" -f db/seed.sql
// Het wachtwoord komt alleen als bcrypt-hash in de SQL terecht.
import { writeFileSync } from "node:fs"
import bcrypt from "bcryptjs"
import { createPlatform } from "../lib/platform-seed"

const q = (v: unknown): string => {
  if (v === null || v === undefined) return "null"
  if (typeof v === "number") return String(v)
  if (typeof v === "boolean") return v ? "true" : "false"
  return `'${String(v).replace(/'/g, "''")}'`
}
const arr = (xs: string[]) => (xs.length ? `array[${xs.map(q).join(", ")}]::text[]` : "'{}'::text[]")
const json = (v: unknown) => `${q(JSON.stringify(v))}::jsonb`
// pgcrypto herkent het $2a$-voorvoegsel; bcryptjs maakt $2b$ (zelfde algoritme)
const bcryptHash = (pw: string) => bcrypt.hashSync(pw, 12).replace(/^\$2b\$/, "$2a$")

const platform = createPlatform()
const out: string[] = [
  "-- Gegenereerd door scripts/generate-seed-sql.ts – niet met de hand bewerken.",
  "-- Demo-data: alle winkels zijn fictief.",
  "begin;",
  "-- seed werkt over alle gebieden heen",
  "select set_config('app.platform', 'super', true);",
  "",
]

for (const area of platform.areas) {
  const s = area.settings
  const areaRef = `(select id from areas where slug = ${q(area.slug)})`
  // logo's in /public kunnen als relatieve URL blijven; geüploade data-URL's horen in Vercel Blob
  const brand = Object.fromEntries(Object.entries(s.brand).map(([k, v]) => [k, v && v.startsWith("data:") ? null : v]))
  out.push(
    `-- ===== Winkelgebied: ${s.areaName} =====`,
    `insert into areas (slug, name) values (${q(area.slug)}, ${q(s.areaName)});`,
    ...area.domains.map((d) => `insert into area_domains (domain, area_id) values (${q(d.replace(/^www\./, ""))}, ${areaRef}) on conflict do nothing;`),
    `update area_settings set
  site_name = ${q(s.siteName)}, area_name = ${q(s.areaName)}, town = ${q(s.town)},
  hero_title = ${q(s.heroTitle)}, hero_subtitle = ${q(s.heroSubtitle)},
  intro_text = ${q(s.introText)}, footer_text = ${q(s.footerText)},
  campaign_start = ${q(s.campaignStart)}, campaign_end = ${q(s.campaignEnd)},
  max_products_per_shop = ${s.maxProductsPerShop}, reservation_hours = ${s.reservationHours},
  reservations_enabled = ${s.reservationsEnabled}, snow_enabled = ${s.snowEnabled}, map = ${json(s.map)},
  colors = ${json(s.colors)}, brand = ${json(brand)}, categories = ${arr(s.categories)}, privacy = ${json(s.privacy)},
  updated_at = now()
where area_id = ${areaRef};`,
    "",
  )

  for (const shop of area.shops) {
    const shopRef = `(select id from shops where area_id = ${areaRef} and slug = ${q(shop.slug)})`
    out.push(
      `insert into shops (area_id, slug, name, tagline, bio, category, logo_url, cover_color, icon, address, phone, email, website, instagram, opening_hours, lat, lng, allow_reservations, active)
values (${areaRef}, ${[
        shop.slug, shop.name, shop.tagline, shop.bio, shop.category, shop.logo, shop.coverColor, shop.icon, shop.address,
        shop.phone, shop.email, shop.website, shop.instagram,
      ].map(q).join(", ")}, ${json(shop.openingHours)}, ${q(shop.lat)}, ${q(shop.lng)}, ${shop.allowReservations}, ${shop.active});`,
      `insert into users (email, name) values (${q(shop.email)}, ${q(shop.name)}) on conflict do nothing;`,
      `insert into memberships (user_id, area_id, role, shop_id)
select u.id, ${areaRef}, 'shop', ${shopRef} from users u where lower(u.email) = lower(${q(shop.email)});`,
    )
    for (const p of area.products.filter((x) => x.shopId === shop.id)) {
      out.push(
        `insert into products (area_id, shop_id, title, description, price_cents, images, icon, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
values (${areaRef}, ${shopRef}, ${q(p.title)}, ${q(p.description)}, ${Math.round(p.price * 100)}, ${arr(p.images)}, ${q(p.icon)}, ${q(p.category)}, ${arr(p.tags)}, ${q(p.stockMode)}, ${p.stock}, ${p.inStock}, ${p.reservable}, ${p.active}, ${p.sortOrder});`,
      )
    }
    out.push("")
  }
}

const superPw = process.env.SUPER_ADMIN_PASSWORD
if (!superPw) console.warn("Let op: SUPER_ADMIN_PASSWORD niet gezet; de superadmin krijgt geen wachtwoord (alleen inloglink).")
out.push("-- Superadmin(s): beheer van alle winkelgebieden (wachtwoord als bcrypt-hash; wijzig het na de eerste keer inloggen).")
for (const sa of platform.superAdmins) {
  out.push(
    `insert into users (email, name, is_super_admin, password_hash) values (${q(sa.email)}, ${q(sa.name)}, true, ${q(superPw ? bcryptHash(superPw) : null)})
  on conflict ((lower(email))) do update set is_super_admin = true, password_hash = excluded.password_hash;`,
  )
}
out.push("", "commit;", "")

writeFileSync(new URL("../db/seed.sql", import.meta.url), out.join("\n"))
console.log(
  `db/seed.sql geschreven: ${platform.areas.length} winkelgebieden, ${platform.areas.reduce((n, a) => n + a.shops.length, 0)} winkels, ${platform.areas.reduce((n, a) => n + a.products.length, 0)} producten`,
)
