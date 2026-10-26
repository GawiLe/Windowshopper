# Prompt voor v0

Upload de zip van dit project in v0 en plak **alles tussen de twee lijnen** als eerste bericht.

---

Dit project is een werkende Next.js 16-app (App Router, React 19, Tailwind v4, lucide-react, Leaflet): **"Windowshoppen"**, een mobiel-first kerstwebshop voor **meerdere winkelgebieden (multi-tenant)**. Elk winkelgebied draait op een eigen domein (bv. `shoppenkempenaer.nl` en `shoppenmijdrecht.nl`) met eigen winkels, producten, reserveringen, huisstijl en beheerders. Gegevens van verschillende gebieden mogen elkaar **nooit** raken of kruisen.

Alles werkt al, maar de data staat nog in `localStorage` van de browser (`lib/store.ts`). Maak er een echte, live app van met een **Neon**-database, **Resend** voor e-mail en **Vercel Blob** voor foto's. **Behoud het bestaande design, de teksten (Nederlands) en de mobiele bediening precies zoals ze zijn.** Gebruik geen emoji's; iconen komen uit `lucide-react` via `lib/icons.ts`. Let op: in Next.js 16 heet middleware `proxy.ts` (staat er al).

Lees eerst `README.md`, `docs/V0-MIGRATIE.md`, `db/schema.sql`, `lib/types.ts`, `lib/store.ts` en `proxy.ts`.

## 1. Integraties
- Koppel **Neon** (Vercel Marketplace, regio EU Frankfurt) en **Vercel Blob**. Zet Vercel Functions in regio `fra1`.
- Env-variabelen staan in `.env.example`.
- Packages: `@neondatabase/serverless`, `@vercel/blob`, `resend` (staat er al).
- Draai `db/schema.sql` en daarna `db/seed.sql` met de **eigenaar**-verbinding (`DATABASE_URL_OWNER`). Pas de SQL niet inhoudelijk aan: scheiding tussen gebieden, max. 20 producten per winkel, voorraad, reserveren en opschonen zitten in de database. `npm run db:test` bewijst dat de scheiding werkt.
- Maak in Neon een rol **`windowshop_app`** aan (geen eigenaar, geen BYPASSRLS). De app gebruikt díe verbindingsstring als `DATABASE_URL`. Draai daarna het laatste blok van `db/schema.sql` (rechten) opnieuw.

## 2. Winkelgebied bepalen (tenant)
- `proxy.ts` zet de header `x-ws-host` (domein zonder `www.`). Zoek het gebied op met `select area_id from area_domains where domain = $1`. Onbekend domein → 404, behalve op localhost/preview: daar kiest `?gebied=<slug>` (cookie `ws-gebied`) het gebied.
- **Elke** databasetoegang gaat via één helper `withArea(areaId, fn)` die een transactie opent en als eerste `select set_config('app.area_id', $1, true)` uitvoert (Neon `Pool` of `sql.transaction`). Row Level Security laat dan alleen rijen van dat gebied zien; zonder deze instelling ziet een query niets. Schrijf nooit queries buiten deze helper.
- Alleen de superadmin-schermen gebruiken `withPlatform(fn)` die `set_config('app.platform', 'super', true)` zet, en alleen na controle dat de ingelogde gebruiker `is_super_admin` is.
- `generateMetadata` in `app/layout.tsx` gebruikt per domein de naam, beschrijving en `brand.favicon` uit `area_settings`.

## 3. Datalaag
- Vervang `useDB()` en alle functies in `actions.*` en `platformActions.*` uit `lib/store.ts` door **server components** (lezen) en **server actions** (schrijven). De tabel in `docs/V0-MIGRATIE.md` laat per functie zien welke query hoort. Kolommen zijn snake_case, prijzen in **centen** (`price_cents`); zet ze om naar de types in `lib/types.ts` (camelCase, euro's).
- Publieke pagina's lezen `area_settings`, `shops where active` en de view `public_products` (binnen `withArea`).
- Reserveren: server action → `select * from create_reservations($1,$2,$3,$4::date,$5,$6::jsonb)` binnen `withArea`. Toon databasefouten (bv. "Onvoldoende voorraad") netjes in het formulier.
- **Het kadolijstje van bezoekers (`useList`, `listActions`, deel-links) blijft in localStorage**, per gebied. Bezoekers hebben geen account.
- Verwijder daarna de demo-onderdelen: seed-gebruik in de app, "Demo resetten", de gebiedswisselaar in de footer, export/import via localStorage en de demo-inlogcodes.

## 4. Inloggen, rollen en rechten
- Rollen: **superadmin** (`users.is_super_admin`), **gebiedsbeheerder** (`memberships.role='admin'`, één of meer per gebied) en **winkelier** (`memberships.role='shop'` met `shop_id`).
- **Beheerders en superadmin**: e-mail + wachtwoord op `/admin` en `/superadmin`. Controle: `select … from users where lower(email)=lower($1) and password_hash = crypt($2, password_hash)`, daarna in `withArea`: bestaat er een `memberships`-rij `role='admin'` voor dit gebied (of is de gebruiker superadmin)? Wachtwoord wijzigen: `update users set password_hash = crypt($1, gen_salt('bf', 12))`. Log mislukte pogingen in `login_attempts` en blokkeer na 5 per 15 minuten.
- **Winkeliers**: inloglink per e-mail via `login_tokens` en `sessions` (zie `docs/V0-MIGRATIE.md`). Sla alleen sha256-hashes op.
- **Sessies horen bij één gebied** (`sessions.area_id`). Een sessie is alleen geldig op het domein van dat gebied; superadmin-sessies hebben `area_id = null`. Cookie: `httpOnly`, `secure`, `sameSite=lax`, per domein.
- **Rechten in elke server action**: winkelier alleen eigen `shop_id`; gebiedsbeheerder alleen het eigen gebied (winkels, producten, reserveringen, instellingen, beheerders van dat gebied); superadmin alles, inclusief winkelgebieden aanmaken/wijzigen/verwijderen, domeinen koppelen en beheerders per gebied aanstellen (`/superadmin`).
- Winkel aangemaakt → maak `users` + `memberships(role='shop')` en stuur de welkomstmail met inloglink. Beheerder toegevoegd → `users` + `memberships(role='admin')` en een welkomstmail.

## 5. E-mail via Resend
- Teksten in `lib/emails.ts`, HTML in `lib/mail-html.ts`, met naam en kleuren van het gebied.
- Verstuur vanuit de server actions (niet vanuit de browser). Afzender per gebied: `area_settings.mail_from`, of `MAIL_FROM` waarin `{domain}` wordt vervangen door het domein van het gebied.
- Log in `email_log` (zonder inhoud). Verwijder daarna `app/api/mail/route.ts` (alleen voor de demo).

## 6. Kaart
- `components/ShopMap.tsx` (Leaflet + OpenStreetMap) blijft. Bij opslaan van een winkel zonder `lat`/`lng` of met nieuw adres: zoek op de server de coördinaten op via PDOK (`geocodeAddress()` in `lib/geo.ts`) en sla ze op; verwijder het opzoeken in de browser uit `ShopMap`.

## 7. Foto's en logo's
- Upload naar Vercel Blob onder `areas/<area_id>/products/<shop_id>/…`, `areas/<area_id>/shops/<shop_id>/…` en `areas/<area_id>/brand/…` (logo, beeldmerk, favicon). Controleer in de upload-actie gebied en winkel. Behoud "Maak foto" en "Kies uit galerij".

## 8. Opschonen (privacy)
- `app/api/cron/route.ts` controleert `Authorization: Bearer ${CRON_SECRET}` en draait `select expire_reservations(); select purge_personal_data();` (werkt voor alle gebieden).
- `vercel.json`: `{"crons":[{"path":"/api/cron","schedule":"*/10 * * * *"}]}`.

## 9. Klaar is als
- Op `shoppenkempenaer.nl` zie je alleen De Kempenaer, op `shoppenmijdrecht.nl` alleen Mijdrecht – inclusief eigen logo, kleuren, favicon en teksten.
- Een beheerder van gebied A kan op geen enkele manier gegevens van gebied B zien of wijzigen; `npm run db:test` slaagt.
- De superadmin kan op `/superadmin` winkelgebieden aanmaken, domeinen koppelen, beheerders per gebied aanstellen en elk gebied beheren.
- Bezoekers kunnen zonder account kado's bekijken, op hun lijstje zetten, delen en reserveren; winkels en klant krijgen echte mails.
- Winkeliers loggen in via een mail-link, plaatsen producten met een foto en vinken reserveringen af.
- Design, Nederlandse teksten, sneeuw en mobiele navigatie zijn onveranderd.

---

## Na het plakken: zelf instellen
1. **Domeinen**: voeg `shoppenkempenaer.nl`, `shoppenmijdrecht.nl` (en `www.`-varianten) toe in Vercel → Project → Domains. Koppel ze in `/superadmin` aan het juiste winkelgebied.
2. **Resend**: verifieer elk domein in Resend (DNS-records), maak een API-key (`RESEND_API_KEY`) en zet `MAIL_FROM="Windowshoppen <kado@{domain}>"`.
3. **Superadmin**: `lgawi@connect-create.nl` staat in `db/seed.sql` (wachtwoord alleen als hash; maak de seed met `SUPER_ADMIN_PASSWORD='…' npm run db:seed-sql`). Wijzig het wachtwoord na de eerste keer inloggen.
4. Vul per gebied in Beheer → Instellingen de privacygegevens in (vereniging, adres, KvK, contact) en stel beheerders aan.
