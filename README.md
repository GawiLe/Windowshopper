# Windowshoppen – Winkelgebied De Kempenaer

Een feestelijke, mobiel-first multi-winkel webshop voor de decembermaand. Winkeliers uit één
winkelgebied plaatsen elk maximaal 20 kadotips; bezoekers windowshoppen door de online straat,
maken zonder account een kadolijstje, laten producten een dag reserveren en halen ze op in het dorp.

## Starten op je laptop
Nodig: [Node.js](https://nodejs.org) versie 20 of hoger (LTS).

**Mac (Terminal)** – zip uitgepakt in Downloads:
```bash
cd ~/Downloads/windowshopper
npm install
npm run dev
```
**Windows (PowerShell):**
```powershell
cd $HOME\Downloads\windowshopper
npm install
npm run dev
```
Open daarna http://localhost:3000. Stoppen: `Ctrl + C`.

Mails echt versturen? Maak een bestand `.env.local` (zie `.env.example`) met `RESEND_API_KEY` en `MAIL_FROM`.

| Rol | Waar | Demo-inlog |
|---|---|---|
| Bezoeker | `/` | geen account nodig |
| Winkelier | `/winkelier` | kies winkel + code (bv. De Boekenhoek → `boek2026`; alle codes staan op het inlogscherm) |
| Beheerder | `/admin` | `lgawi@connect-create.nl` + het afgesproken wachtwoord (wijzigen via Instellingen) |

> De demo bewaart alles in de browser (localStorage). Mails gaan via [Resend](https://resend.com)
> zodra `RESEND_API_KEY` (en `MAIL_FROM`) in `.env.local` staan; zonder sleutel verschijnen ze alleen
> in **Admin → Mails**. **Naar v0?** Upload de zip en plak [`V0-PROMPT.md`](V0-PROMPT.md). Zie [`docs/V0-MIGRATIE.md`](docs/V0-MIGRATIE.md) om live te gaan
> met **Neon** (database), Vercel Blob (foto's) en Resend (mail). De database staat in
> [`db/schema.sql`](db/schema.sql), demo-data in [`db/seed.sql`](db/seed.sql) (`npm run db:seed-sql`).

## Functies
**Bezoekers**
- Online winkelstraat met zoeken, categorieën, prijsfilter en voorraadfilter
- Productpagina met foto-swipe, voorraadstatus, "meer van deze winkel" en "ook leuk bij andere winkels"
- Winkelpagina met logo, bio, openingstijden en alle producten
- Echte kaart (Leaflet + OpenStreetMap) met pins in huisstijl; winkels worden automatisch op hun adres geplaatst (PDOK)
- Kadolijstje zonder account: gegroepeerd per winkel als looproute, afvinken, aantallen, en per kado of het te reserveren is
- Lijstje bewaren/delen: mail naar mezelf, WhatsApp/delen, link kopiëren, printen — via een link
  die alleen product-ID's bevat
- Reserveren: kies ophaaldag, gegevens + expliciete toestemming → per winkel een ophaalcode
- Uitgebreide privacyverklaring, geen tracking-cookies

**Winkeliers** (`/winkelier`, gebouwd voor de telefoon)
- Overzicht: vandaag ophalen, aantal producten x/20
- Product toevoegen met **direct een foto maken** of uit de galerij (automatisch verkleind)
- Voorraad als aantal óf simpel aan/uit, met snelle knoppen in de lijst
- Reserveringen per ophaaldag, met zoeken; "Opgehaald" afvinken, bellen/mailen, annuleren
- Eigen winkelprofiel: logo, bio, contact, openingstijden

**Beheer** (`/admin`)
- Winkels toevoegen, wijzigen, verwijderen, op de kaart plaatsen (adres opzoeken of op de kaart tikken), meekijken als winkelier
- Alle producten modereren, alle reserveringen, verstuurde mails
- Instellingen: teksten, kleuren (met thema's, live), sneeuw aan/uit, actieperiode, max. producten,
  reserveringsduur, categorieën, privacygegevens, export/import, opschonen persoonsgegevens

## Techniek
Next.js (App Router) · React · Tailwind CSS v4 · lucide-react · Leaflet. Huisstijl en logo in `public/brand/`. Geen externe diensten nodig voor de demo.

```
app/(shop)/        publieke webshop (home, winkelstraat, product, winkel, kaart, lijstje, reserveren, privacy)
app/winkelier/     winkeliersomgeving
app/admin/         beheeromgeving
components/        UI-componenten (kaart, productkaart, formulieren, iconen, sneeuw)
lib/               types, demo-store, seed-data, e-mailtemplates, helpers
db/                Neon/Postgres-schema (triggers, reserveerfunctie, opschonen) + seed
scripts/           generator voor db/seed.sql
docs/              stappenplan naar live
```
