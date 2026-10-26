# Van demo naar live: multi-tenant met Neon (via v0 / Vercel)

De demo bewaart alles in `localStorage` (zie `lib/store.ts`) en kan zo zonder server getest worden.
Live draait één app voor **alle winkelgebieden**; het domein bepaalt welk gebied je ziet.
Kant-en-klare prompt voor v0: [`V0-PROMPT.md`](../V0-PROMPT.md).

## Stack
| Onderdeel | Dienst | Opmerking |
|---|---|---|
| Hosting | Vercel (via v0) | Eén project, meerdere domeinen |
| Database | **Neon** Postgres (EU – Frankfurt) | `db/schema.sql`: tenants, RLS, triggers |
| Driver | `@neondatabase/serverless` | Transacties voor `app.area_id` |
| Inloggen | Beheer: e-mail + wachtwoord (bcrypt via pgcrypto). Winkeliers: inloglink | `users`, `memberships`, `login_tokens`, `sessions` |
| Foto's & logo's | **Vercel Blob** | Paden per gebied: `areas/<area_id>/…` |
| E-mail | **[Resend](https://resend.com)** | Afzender per domein (`MAIL_FROM` met `{domain}`) |
| Kaart | Leaflet + OpenStreetMap, adressen via PDOK | |
| Opschonen | Vercel Cron → `/api/cron` | Voor alle gebieden |

## Hoe winkelgebieden gescheiden blijven
1. **Domein → gebied.** `proxy.ts` geeft het domein door (`x-ws-host`); de app zoekt het gebied op in
   `area_domains`. Elk gebied heeft één of meer domeinen (`www.` wordt automatisch weggelaten).
2. **Elke tabel heeft `area_id`.** Samengestelde foreign keys `(id, area_id)` maken koppelingen tussen
   gebieden onmogelijk: een product kan niet bij een winkel van een ander gebied horen, een reservering
   niet bij een product van een ander gebied, een winkelier niet bij een winkel van een ander gebied.
3. **Row Level Security (FORCE).** Per transactie zet de app `app.area_id`; queries zien en wijzigen dan
   alleen rijen van dat gebied. Zonder instelling: niets. Alleen superadmin-schermen en de opschoonjobs
   zetten `app.platform = 'super'`.
4. **Eigen app-rol.** De app verbindt als `windowshop_app` (geen eigenaar, geen BYPASSRLS), zodat RLS
   ook bij een programmeerfout in de app blijft gelden.
5. **Sessies per gebied.** Een sessie hoort bij één gebied en is op een ander domein ongeldig.

`npm run db:test` draait schema + seed in een tijdelijke Postgres en controleert o.a. dat gebied A geen
gegevens van gebied B kan lezen, wijzigen, koppelen of reserveren.

## Rollen
| Rol | Waar vastgelegd | Mag |
|---|---|---|
| Superadmin | `users.is_super_admin = true` | Alles: gebieden aanmaken/verwijderen, domeinen, beheerders per gebied, elk gebied beheren |
| Gebiedsbeheerder | `memberships (role='admin', area_id)` | Alleen dat gebied: winkels, producten, reserveringen, instellingen, eigen beheerders |
| Winkelier | `memberships (role='shop', area_id, shop_id)` | Alleen de eigen winkel |
| Bezoeker | – | Geen account; lijstje in de browser |

## Stappen
1. Repo/zip in v0, of GitHub koppelen aan Vercel.
2. Neon koppelen (Vercel Marketplace, Frankfurt). Maak in Neon de rol `windowshop_app`.
3. Database vullen met de **eigenaar**-verbinding:
   ```bash
   SUPER_ADMIN_PASSWORD='…' npm run db:seed-sql      # maakt db/seed.sql (wachtwoord alleen als hash)
   psql "$DATABASE_URL_OWNER" -f db/schema.sql
   psql "$DATABASE_URL_OWNER" -f db/seed.sql
   npm run db:test                                    # controle scheiding (lokaal, zonder Neon)
   ```
4. Env-variabelen: zie `.env.example`. `DATABASE_URL` = verbinding van `windowshop_app`.
5. Domeinen toevoegen in Vercel → Domains en in `/superadmin` koppelen aan het juiste gebied.
6. Resend: elk domein verifiëren, `RESEND_API_KEY` en `MAIL_FROM="Windowshoppen <kado@{domain}>"`.
7. `lib/store.ts` vervangen (zie tabel hieronder).

## Demo-functie → live
| Demo (`lib/store.ts`) | Live (server action / server component, altijd binnen `withArea`) |
|---|---|
| `useDB()` | `area_settings`, `shops where active`, `public_products` van het gebied van het domein |
| `actions.upsertProduct` / `deleteProduct` / `moveProduct` | `products … where shop_id = <sessie>` (trigger bewaakt max. 20) |
| `actions.upsertShop` / `deleteShop` / `setShopLocation` | beheerder: `shops`; winkelier: alleen toegestane profielvelden |
| `actions.createReservations` | `select * from create_reservations(…)` → mails via Resend |
| `actions.setReservationStatus` | `update reservations set status = …` (trigger regelt voorraad) |
| `actions.updateSettings` | `update area_settings … where area_id = current_area_id()` |
| `actions.sweepExpired` / `purgeOldPersonalData` | `/api/cron` |
| `platformActions.createArea` / `updateArea` / `deleteArea` | `withPlatform`: `areas`, `area_domains` |
| `platformActions.addAreaAdmin` / `removeAreaAdmin` | `users` + `memberships (role='admin')` |
| `platformActions.addSuperAdmin` / `changeOwnPassword` | `users.is_super_admin`, `password_hash = crypt(…)` |
| `sessionActions.*` | wachtwoord/inloglink + sessie-cookie per gebied |
| `useList` / `listActions` | **blijft zoals het is** (per gebied in de browser) |

## Voorbeeldcode

**Database per gebied** – `lib/db.ts`
```ts
import { Pool } from "@neondatabase/serverless"
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

/** Alle queries van een verzoek lopen hierdoor: RLS ziet alleen dit gebied. */
export async function withArea<T>(areaId: string, fn: (q: (sql: string, params?: unknown[]) => Promise<any[]>) => Promise<T>) {
  const client = await pool.connect()
  try {
    await client.query("begin")
    await client.query("select set_config('app.area_id', $1, true)", [areaId])
    const result = await fn(async (sql, params) => (await client.query(sql, params)).rows)
    await client.query("commit")
    return result
  } catch (e) {
    await client.query("rollback")
    throw e
  } finally {
    client.release()
  }
}
```

**Gebied bij het domein** – `lib/area.ts`
```ts
import { headers } from "next/headers"
export async function currentAreaId() {
  const host = (await headers()).get("x-ws-host") ?? ""
  const rows = await pool.query("select area_id from area_domains where domain = $1", [host])
  return rows.rows[0]?.area_id as string | undefined   // undefined → notFound()
}
```

**Inloglink voor winkeliers**
1. E-mail ingevuld → zoek `users` + `memberships` binnen het gebied. Bestaat niet? Toon toch "check je mail".
2. Token `crypto.randomBytes(32)`, sla `sha256(token)` op in `login_tokens` met `area_id` en 15 minuten geldigheid.
3. Link openen: token controleren (zelfde gebied, niet verlopen, ongebruikt) → `sessions` met `area_id`,
   ruwe token in een `httpOnly; secure; sameSite=lax` cookie.

**Cron** – `vercel.json`
```json
{ "crons": [{ "path": "/api/cron", "schedule": "*/10 * * * *" }] }
```

## Privacy-checklist voor livegang
- [ ] Per gebied de privacygegevens invullen (Beheer → Instellingen → Privacy); elk gebied is eigen verwerkingsverantwoordelijke.
- [ ] Verwerkersovereenkomsten met Neon, Vercel en Resend; met elke winkeliersvereniging afspraken over het platform.
- [ ] Neon en Vercel Functions in de EU (Frankfurt / `fra1`); cron actief.
- [ ] `npm run db:test` slaagt na elke wijziging aan het schema.
