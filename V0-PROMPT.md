# Prompt voor v0

Upload de zip van dit project in v0 en plak **alles tussen de twee lijnen** als eerste bericht.

---

Dit project is een werkende Next.js-app (App Router, React 19, Tailwind v4, lucide-react, Leaflet): **"Windowshoppen – Winkelgebied De Kempenaer"** (Oegstgeest), een mobiel-first kerstwebshop van meerdere winkels uit één winkelgebied. Alles werkt al, maar de data staat nog in `localStorage` van de browser (`lib/store.ts`). Maak er een echte, live app van met een **Neon**-database, **Resend** voor e-mail en **Vercel Blob** voor foto's. **Behoud het bestaande design, de teksten (Nederlands) en de mobiele bediening precies zoals ze zijn.** De huisstijl komt uit het logo in `public/brand/` (groen #023934, goud #c09a5e, Playfair Display + Jost). Gebruik geen emoji's; iconen komen uit `lucide-react` via `lib/icons.ts`.

Lees eerst `README.md`, `docs/V0-MIGRATIE.md`, `db/schema.sql`, `lib/types.ts` en `lib/store.ts`.

## 1. Integraties
- Koppel **Neon** (Vercel Marketplace, regio EU Frankfurt) en **Vercel Blob**. Zet Vercel Functions in regio `fra1`.
- Env-variabelen staan in `.env.example`: `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `MAIL_FROM`, `NEXT_PUBLIC_SITE_URL`, `AUTH_SECRET`, `CRON_SECRET`.
- Packages: `@neondatabase/serverless`, `@vercel/blob`, `resend` (staat er al).
- Draai `db/schema.sql` en daarna `db/seed.sql` op de Neon-database. Pas de SQL niet inhoudelijk aan: alle regels (max. 20 producten per winkel, voorraad, reserveren, opschonen) zitten in de database.

## 2. Datalaag
- Maak `lib/db.ts` met `neon(process.env.DATABASE_URL!)`.
- Vervang `useDB()` en alle functies in `actions.*` uit `lib/store.ts` door **server components** (lezen) en **server actions** (schrijven). De tabel in `docs/V0-MIGRATIE.md` laat per functie zien welke query hoort. Database-kolommen zijn snake_case en prijzen staan in **centen** (`price_cents`); zet ze om naar de bestaande types in `lib/types.ts` (camelCase, prijs in euro's).
- Publieke pagina's lezen `site_settings`, `shops where active` en de view `public_products`.
- Reserveren: server action die `select * from create_reservations($1,$2,$3,$4::date,$5,$6::jsonb)` aanroept. Toon bij een fout de foutmelding uit de database (bv. "Onvoldoende voorraad") netjes in het formulier.
- Statussen van reserveringen wijzigen met `update reservations set status = … where id = … and shop_id = <shop uit sessie>`; triggers regelen de voorraad.
- **Het kadolijstje van bezoekers (`useList`, `listActions`, deel-links) blijft in localStorage.** Bezoekers hebben geen account; sla hun lijstje niet op in de database.
- Verwijder daarna de demo-onderdelen: `lib/seed.ts`-gebruik in de app, "Demo resetten", export/import van localStorage, de demo-inlogcodes op het inlogscherm voor winkeliers.

## 3. Inloggen en rechten
- **Beheerder** (`/admin`): inloggen met e-mail + wachtwoord. Controle in SQL: `select … from users where lower(email)=lower($1) and role='admin' and password_hash = crypt($2, password_hash)`. Wachtwoord wijzigen in Admin → Instellingen: `update users set password_hash = crypt($1, gen_salt('bf', 12))`. Log mislukte pogingen in `login_attempts` en blokkeer na 5 mislukte pogingen per 15 minuten.
- **Winkeliers** (`/winkelier`): inloggen met een **inloglink per e-mail** (magic link) via de tabellen `users`, `login_tokens` en `sessions` (zie `docs/V0-MIGRATIE.md`, "Inloglink"). Sla alleen sha256-hashes van tokens op. Sessie in een `httpOnly`, `secure`, `sameSite=lax` cookie, 30 dagen geldig.
- **Rechten in elke server action controleren**: een winkelier mag alleen producten, reserveringen en het profiel van zijn eigen `shop_id` lezen/wijzigen. Een winkelier mag in zijn profiel alleen logo, tagline, bio, categorie, telefoon, e-mail, website, instagram, openingstijden, kleur, icoon en `allow_reservations` wijzigen. Alleen de beheerder beheert winkels, instellingen, alle producten en alle reserveringen, en kan "meekijken" bij een winkel.
- Als de beheerder een winkel aanmaakt: maak ook een `users`-rij (`role='shop'`, `shop_id`) voor het e-mailadres van de winkel en stuur de welkomstmail met inloglink.

## 4. E-mail via Resend
- Gebruik de bestaande teksten uit `lib/emails.ts` en de HTML-opmaak uit `lib/mail-html.ts`.
- Verstuur mails **vanuit de server actions** (niet vanuit de browser): na een geslaagde reservering één mail per winkel (`replyTo` = e-mail van de klant) en één bevestiging aan de klant; verder de welkomstmail en inloglinks.
- Log elke verstuurde mail in `email_log` (zonder mailinhoud) en toon dat overzicht in Admin → Mails.
- Verwijder daarna `app/api/mail/route.ts`: die publieke route is alleen voor de demo.

## 5. Kaart
- `components/ShopMap.tsx` (Leaflet + OpenStreetMap-kaart) blijft zoals hij is. Winkels hebben `lat`/`lng`.
- Zet de coördinaten op de **server** zodra de beheerder een winkel opslaat zonder `lat`/`lng` (of met een gewijzigd adres): roep de PDOK Locatieserver aan (`https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=<adres plaats>&fq=type:adres&rows=1&fl=centroide_ll`, zie `geocodeAddress()` in `lib/geo.ts`) en sla het resultaat op. Verwijder daarna het automatisch opzoeken in de browser uit `ShopMap` (de beheerder kan de pin nog steeds verplaatsen door op de kaart te tikken).

## 6. Foto's
- Productfoto's (max. 4) en logo's: verklein in de browser met de bestaande `resizeImage()` uit `lib/utils.ts`, upload naar Vercel Blob onder `products/<shop_id>/…` of `logos/<shop_id>/…` en sla de URL's op. Controleer in de upload-actie dat de winkelier bij die `shop_id` hoort. Behoud de knoppen "Maak foto" (camera) en "Kies uit galerij".

## 7. Opschonen (privacy)
- Voeg `app/api/cron/route.ts` toe die `Authorization: Bearer ${CRON_SECRET}` controleert en `select expire_reservations(); select purge_personal_data();` uitvoert.
- Voeg `vercel.json` toe met `{"crons":[{"path":"/api/cron","schedule":"*/10 * * * *"}]}`.

## 8. Klaar is als
- Bezoekers kunnen zonder account kado's bekijken, op hun lijstje zetten, delen en reserveren; winkels en klant krijgen echte mails via Resend.
- Een winkelier logt in via een mail-link op zijn telefoon, plaatst producten met een foto, beheert voorraad en vinkt reserveringen af als opgehaald; hij ziet nooit gegevens van andere winkels.
- De beheerder logt in met e-mail en wachtwoord en kan winkels toevoegen, wijzigen en verwijderen en alle instellingen, kleuren en teksten aanpassen; die wijzigingen zijn direct zichtbaar voor iedereen.
- De kaart toont alle winkels op hun echte adres met pins in huisstijl.
- Design, Nederlandse teksten, sneeuw en mobiele navigatie zijn onveranderd.

---

## Na het plakken: zelf instellen
1. **Resend**: maak een account op https://resend.com, voeg je domein toe (bv. `connect-create.nl` of een domein voor de winkelstraat) en zet de DNS-records die Resend geeft. Maak een API-key en zet die als `RESEND_API_KEY`. Zet `MAIL_FROM` op bv. `Windowshoppen <kado@jouwdomein.nl>`.
   *Zonder geverifieerd domein kan Resend alleen naar je eigen account-e-mailadres sturen.*
2. **Beheerder**: `lgawi@connect-create.nl` staat al in `db/seed.sql` (wachtwoord alleen als versleutelde hash). Wijzig het wachtwoord na de eerste keer inloggen.
3. Vul in Admin → Instellingen → Privacy de echte gegevens in (vereniging, adres, KvK, contact).
