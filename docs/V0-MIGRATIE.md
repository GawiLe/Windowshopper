# Van demo naar live met Neon (via v0 / Vercel)

Deze app werkt nu volledig in de browser: alle data staat in `localStorage` (zie `lib/store.ts`).
Zo kun je alles klikken en testen zonder server. Om hem echt online te zetten met meerdere
winkeliers op hun eigen telefoon heb je een gedeelde database, inloggen, foto-opslag en e-mail nodig.

## Stack
| Onderdeel | Dienst | Opmerking |
|---|---|---|
| Hosting | Vercel (via v0) | Next.js |
| Database | **Neon** Postgres (regio **EU – Frankfurt**) | Koppelen via Vercel Marketplace → `DATABASE_URL` wordt automatisch gezet |
| Database-driver | `@neondatabase/serverless` | Werkt in server actions en route handlers |
| Inloggen | Beheerder: e-mail + wachtwoord (bcrypt via pgcrypto). Winkeliers: inloglink per e-mail | Tabellen `users`, `login_tokens`, `sessions`, `login_attempts` staan al in het schema |
| Foto's & logo's | **Vercel Blob** | In de database staan alleen URL's |
| E-mail | **[Resend](https://resend.com)** | Werkt al in de demo via `app/api/mail/route.ts`; teksten in `lib/emails.ts`, HTML in `lib/mail-html.ts` |
| Opschonen (AVG) | **Vercel Cron** → `/api/cron` | Roept `expire_reservations()` en `purge_personal_data()` aan |

> Neon is "gewone" Postgres. Er is geen ingebouwde login of Row Level Security op basis van
> gebruikers zoals bij Supabase. Toegangscontrole gebeurt daarom **in de server actions**:
> elke query van een winkelier filtert op de `shop_id` uit zijn sessie; alleen `role = 'admin'`
> mag winkels, instellingen en alle reserveringen beheren.

## Stappen
1. **Repo in v0 importeren** (of GitHub koppelen aan Vercel).
2. **Neon koppelen**: Vercel → Storage / Marketplace → Neon → regio Frankfurt.
3. **Database vullen** in de Neon SQL Editor (of met psql):
   ```bash
   psql "$DATABASE_URL" -f db/schema.sql
   psql "$DATABASE_URL" -f db/seed.sql     # optioneel: de demo-winkels
   ```
   De beheerder `lgawi@connect-create.nl` staat er al in (wachtwoord alleen als bcrypt-hash).
   Na wijzigingen in `lib/seed.ts` maak je de seed opnieuw met
   `ADMIN_PASSWORD='…' npm run db:seed-sql`.
4. **Env-variabelen**: zie `.env.example` (`DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`,
   `MAIL_FROM`, `NEXT_PUBLIC_SITE_URL`, `AUTH_SECRET`, `CRON_SECRET`).
5. **Packages**: `npm i @neondatabase/serverless @vercel/blob resend`
6. **`lib/store.ts` vervangen**. Alle schrijfacties zitten gebundeld in `actions.*`; vervang ze 1-op-1:

   | Demo-functie | Live (server action / server component) |
   |---|---|
   | `useDB()` (publiek) | server components: `select … from site_settings`, `shops where active`, `public_products` |
   | `actions.upsertProduct` / `deleteProduct` / `moveProduct` | `insert/update/delete products … where shop_id = $sessieShopId` (trigger bewaakt max. 20) |
   | `actions.upsertShop` / `deleteShop` | admin: alle velden. Winkelier: alleen tagline, bio, contact, openingstijden, logo, `allow_reservations` |
   | `actions.createReservations` | `select * from create_reservations($1,$2,$3,$4::date,$5,$6::jsonb)` → daarna mails via Resend |
   | `actions.setReservationStatus` | `update reservations set status = $1 where id = $2 and shop_id = $sessieShopId` (trigger regelt voorraad) |
   | `actions.sweepExpired` / `purgeOldPersonalData` | `/api/cron` (Vercel Cron) |
   | `actions.updateSettings` | `update site_settings … where id = 1` (alleen admin) |
   | `actions.logEmail` | `insert into email_log (kind, to_email, subject, shop_id, provider_id)` — zonder mailinhoud |
   | `sessionActions.*` | inloglink + sessie-cookie (zie hieronder) |
   | `useList` / `listActions` | **blijft zoals het is**: het lijstje van bezoekers hoort niet in de database |

7. **Foto's**: `resizeImage()` in `lib/utils.ts` blijft bruikbaar. Upload het resultaat naar Vercel Blob
   (`products/<shop_id>/<uuid>.jpg`) en sla de URL op in `products.images` (max. 4).
8. **Kaart**: `components/StreetMap.tsx` werkt zonder externe dienst. `lat`/`lng` staan klaar voor een
   echte kaart later.

## Voorbeeldcode

**Databaseverbinding** – `lib/db.ts`
```ts
import { neon } from "@neondatabase/serverless"
export const sql = neon(process.env.DATABASE_URL!)
```

**Reserveren** – server action
```ts
"use server"
import { sql } from "@/lib/db"

export async function reserve(input: { name: string; email: string; phone: string; pickupDate: string; note: string
  items: { productId: string; quantity: number }[] }) {
  const items = JSON.stringify(input.items.map((i) => ({ product_id: i.productId, quantity: i.quantity })))
  const reservations = await sql`
    select * from create_reservations(${input.name}, ${input.email}, ${input.phone},
                                      ${input.pickupDate}::date, ${input.note}, ${items}::jsonb)`
  // → per reservering: shopReservationEmail(...) naar de winkel, en één customerConfirmationEmail(...) naar de klant
  return reservations
}
```

**Inloglink** (geen extra auth-dienst nodig)
1. Winkelier vult e-mail in → zoek `users` op `lower(email)`. Bestaat niet? Toon toch "check je mail" (lekt niets).
2. Maak een willekeurig token (`crypto.randomBytes(32)`), sla `sha256(token)` op in `login_tokens`
   met `expires_at = now() + 15 min`, en mail `…/winkelier/login?token=…` via Resend.
3. Op die URL: token hashen, controleren (niet verlopen, `used_at is null`), `used_at = now()`,
   nieuwe rij in `sessions` (30 dagen) en het ruwe sessie-token in een `httpOnly; secure; sameSite=lax` cookie.
4. In elke server action: cookie → hash → `sessions` join `users` → `role` en `shop_id`.

**Cron** – `vercel.json`
```json
{ "crons": [{ "path": "/api/cron", "schedule": "*/10 * * * *" }] }
```
`app/api/cron/route.ts` controleert `Authorization: Bearer ${CRON_SECRET}` en draait
`select expire_reservations(); select purge_personal_data();`.

## Prompt voor v0
Zie [`V0-PROMPT.md`](../V0-PROMPT.md) in de hoofdmap: die kun je in zijn geheel in v0 plakken.

## Resend instellen
1. Account op https://resend.com → **Domains** → voeg je domein toe en zet de DNS-records (SPF/DKIM).
2. **API Keys** → maak een key met "Sending access" → `RESEND_API_KEY`.
3. `MAIL_FROM="Windowshoppen <kado@jouwdomein.nl>"` (moet op het geverifieerde domein staan).
4. Zonder geverifieerd domein kun je testen met `onboarding@resend.dev`, maar dan alleen naar het
   e-mailadres van je eigen Resend-account.

## Privacy-checklist voor livegang
- [ ] Gegevens in de privacyverklaring invullen (Admin → Instellingen → Privacy) en laten checken.
- [ ] Verwerkersovereenkomsten (DPA) afsluiten met Neon, Vercel en Resend (Resend: EU-regio kiezen bij het domein).
- [ ] Neon-project in EU-regio (Frankfurt); Vercel-functies ook in EU (`fra1`).
- [ ] Cron voor opschonen actief.
- [ ] Afspraken met deelnemende winkels vastleggen (gegevens alleen voor de reservering gebruiken).
- [ ] Geen analytics/cookies toevoegen zonder de verklaring aan te passen.
