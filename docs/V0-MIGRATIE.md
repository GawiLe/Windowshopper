# Van demo naar live (via v0 / Vercel)

Deze app werkt nu volledig in de browser: alle data staat in `localStorage` (zie `lib/store.ts`).
Zo kun je alles klikken en testen zonder server. Om hem echt online te zetten met meerdere
winkeliers op hun eigen telefoon, heb je een gedeelde database, inloggen en e-mail nodig.

## Aanbevolen stack
| Onderdeel | Dienst | Waarom |
|---|---|---|
| Hosting | Vercel (via v0) | Next.js, 1 klik |
| Database + inloggen + foto's | **Supabase** (regio EU / Frankfurt) | Postgres, magic-link login, Storage, Row Level Security |
| E-mail | **Resend** (EU) | Simpele API, eigen afzenderdomein |

## Stappen
1. **Importeer de repo in v0** (of koppel GitHub aan Vercel).
2. **Supabase-project** aanmaken (regio EU). Draai `supabase/schema.sql` in de SQL-editor.
   Zet daarna `pg_cron` aan en plan de twee opschoon-jobs (staat onderaan het schema).
3. **Env-variabelen** in Vercel:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...        # alleen server-side!
   RESEND_API_KEY=...
   MAIL_FROM="Windowshoppen <kado@jouwdomein.nl>"
   NEXT_PUBLIC_SITE_URL=https://...
   ```
4. **Vervang `lib/store.ts`** door Supabase-calls. Alle schrijfacties zitten al gebundeld in
   `actions.*` — vervang ze 1-op-1:
   | Demo-functie | Live |
   |---|---|
   | `useDB()` | server components die `shops`, `products`, `site_settings` lezen (publiek) |
   | `actions.upsertProduct` / `deleteProduct` / `moveProduct` | `supabase.from('products')…` (RLS beperkt tot eigen winkel; trigger bewaakt max. 20) |
   | `actions.upsertShop` / `deleteShop` | admin: `shops`; winkelier: server action die alleen tagline/bio/contact/openingstijden/logo doorlaat |
   | `actions.createReservations` | **server action** → `rpc('create_reservations')` met service role, daarna mails via Resend |
   | `actions.setReservationStatus` | `update reservations set status = …` (trigger zet voorraad terug) |
   | `actions.sweepExpired` / `purgeOldPersonalData` | pg_cron jobs |
   | `actions.updateSettings` | `update site_settings` (admin) |
   | `sessionActions.*` | Supabase Auth magic link + tabel `profiles` (rol `admin` / `shop`) |
5. **Foto's**: `resizeImage()` in `lib/utils.ts` blijft bruikbaar; upload het resultaat (als Blob)
   naar Storage-bucket `products/<shop_id>/<uuid>.jpg` en sla de publieke URL op in `products.images`.
6. **E-mails**: de teksten staan klaar in `lib/emails.ts`. Verstuur ze in de server action na
   een geslaagde reservering. Sla in `email_log` geen mailinhoud op (privacy).
7. **Winkeliers uitnodigen**: admin maakt een winkel aan → maak een auth-gebruiker met het
   winkel-e-mailadres en een `profiles`-rij (`role='shop'`, `shop_id`). De winkelier logt in met een link.
8. **Kaart**: de geïllustreerde kaart (`components/StreetMap.tsx`) werkt zonder externe dienst.
   Wil je later ook een echte kaart: `lat`/`lng` per winkel staan al in het schema (bijv. Leaflet + OpenStreetMap).

## Prompt-suggestie voor v0
> "Dit is een werkende Next.js-app met lokale opslag in `lib/store.ts`. Koppel Supabase volgens
> `supabase/schema.sql` en `docs/V0-MIGRATIE.md`: vervang `useDB`/`actions` door Supabase-queries
> en server actions, gebruik Supabase Auth magic links voor `/winkelier` en `/admin`, upload
> foto's naar Storage en verstuur de mails uit `lib/emails.ts` met Resend. Behoud het design."

## Privacy-checklist voor livegang
- [ ] Gegevens in de privacyverklaring invullen (Admin → Instellingen → Privacy) en laten checken.
- [ ] Verwerkersovereenkomsten afsluiten met Supabase, Vercel en Resend (staan op hun sites).
- [ ] Afspraken met deelnemende winkels vastleggen (gegevens alleen voor de reservering gebruiken).
- [ ] Supabase in EU-regio; opschoon-jobs actief.
- [ ] Geen analytics/cookies toevoegen zonder de verklaring aan te passen.
