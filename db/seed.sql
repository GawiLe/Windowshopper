-- Gegenereerd door scripts/generate-seed-sql.ts – niet met de hand bewerken.
-- Demo-data: alle winkels zijn fictief.
begin;

update site_settings set
  site_name = 'Windowshoppen', area_name = 'De Kempenaerstraat', town = 'Oegstgeest',
  hero_title = 'Feestelijk windowshoppen in De Kempenaerstraat', hero_subtitle = 'Struin door de online winkelstraat, maak je eigen kadolijstje en haal je cadeaus op bij de winkels in het dorp.',
  intro_text = 'Deze december zetten de winkeliers van De Kempenaerstraat hun mooiste kadotips voor je klaar. Zet wat je leuk vindt op je lijstje, laat het eventueel een dag reserveren en loop gezellig langs de etalages om alles op te halen.', footer_text = 'Een initiatief van de winkeliers van De Kempenaerstraat. Fijne feestdagen!',
  campaign_start = '2026-11-20', campaign_end = '2026-12-31',
  max_products_per_shop = 20, reservation_hours = 24,
  reservations_enabled = true, snow_enabled = true,
  colors = '{"primary":"#1f4d3a","accent":"#b3262e","gold":"#c9a24a","background":"#fbf6ec","text":"#2a2420"}'::jsonb, categories = array['Boeken & papier', 'Eten & drinken', 'Wonen & lifestyle', 'Kinderen & speelgoed', 'Bloemen & planten', 'Mode & sieraden', 'Beauty & verzorging', 'Overig']::text[], privacy = '{"controllerName":"Winkeliersvereniging De Kempenaerstraat","controllerAddress":"De Kempenaerstraat, Oegstgeest","contactEmail":"privacy@example.nl","kvk":"00000000","retentionDays":30}'::jsonb,
  updated_at = now()
where id = 1;

insert into shops (slug, name, tagline, bio, category, logo_url, cover_color, emoji, address, phone, email, website, instagram, opening_hours, map_x, map_y, lat, lng, allow_reservations, active)
values ('de-boekenhoek', 'De Boekenhoek', 'Boeken, kaarten & leesplezier', 'Al ruim dertig jaar dé boekwinkel van het dorp. Wij pakken elk boek gratis in met een strik van goudlint en helpen je graag aan het perfecte leescadeau.', 'Boeken & papier', null, '#2f5d50', '📚', 'De Kempenaerstraat 12', '071-0000001', 'boekenhoek@example.nl', '', '', '[{"day":0,"open":null,"close":null},{"day":1,"open":"13:00","close":"18:00"},{"day":2,"open":"09:30","close":"18:00"},{"day":3,"open":"09:30","close":"18:00"},{"day":4,"open":"09:30","close":"18:00"},{"day":5,"open":"09:30","close":"21:00"},{"day":6,"open":"09:30","close":"17:00"}]'::jsonb, 14, 58, null, null, true, true);
insert into users (email, name, role, shop_id) select 'boekenhoek@example.nl', 'De Boekenhoek', 'shop', id from shops where slug = 'de-boekenhoek';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Kerstverhalen voor bij de open haard', 'Een prachtig gebonden bundel met twaalf winterse verhalen van Nederlandse schrijvers. Ideaal om voor te lezen op kerstavond.', 2495, '{}'::text[], '📖', 'Boeken & papier', '{}'::text[], 'toggle', 0, true, true, true, 0
from shops where slug = 'de-boekenhoek';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Puzzel 1000 stukjes – Winters dorp', 'Een sfeervolle illustratie van een besneeuwde dorpsstraat. Voor lange winteravonden.', 1999, '{}'::text[], '🧩', 'Boeken & papier', '{}'::text[], 'count', 6, true, true, true, 1
from shops where slug = 'de-boekenhoek';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Notitieboek linnen, goudfolie', 'Linnen notitieboek met goudfolie op de cover, 192 pagina''s met stippen.', 1650, '{}'::text[], '📓', 'Boeken & papier', '{}'::text[], 'count', 2, true, true, true, 2
from shops where slug = 'de-boekenhoek';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Kerstkaarten set van 10', 'Set van tien illustratiekaarten met envelop, gedrukt op gerecycled papier.', 995, '{}'::text[], '💌', 'Boeken & papier', '{}'::text[], 'toggle', 0, true, true, true, 3
from shops where slug = 'de-boekenhoek';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Kookboek ‘Winterfeest’', 'Feestelijke recepten voor de hele decembermaand, van ontbijt tot dessert.', 2995, '{}'::text[], '🍲', 'Boeken & papier', '{}'::text[], 'toggle', 0, false, true, true, 4
from shops where slug = 'de-boekenhoek';

insert into shops (slug, name, tagline, bio, category, logo_url, cover_color, emoji, address, phone, email, website, instagram, opening_hours, map_x, map_y, lat, lng, allow_reservations, active)
values ('kaas-en-zo', 'Kaas & Zo', 'Delicatessen en kerstpakketten', 'Ambachtelijke kazen, lokale lekkernijen en de mooiste kerstpakketten op maat. Proeven mag altijd!', 'Eten & drinken', null, '#c9a24a', '🧀', 'De Kempenaerstraat 21', '071-0000002', 'kaasenzo@example.nl', '', '', '[{"day":0,"open":null,"close":null},{"day":1,"open":"13:00","close":"18:00"},{"day":2,"open":"09:30","close":"18:00"},{"day":3,"open":"09:30","close":"18:00"},{"day":4,"open":"09:30","close":"18:00"},{"day":5,"open":"09:30","close":"21:00"},{"day":6,"open":"09:30","close":"17:00"}]'::jsonb, 27, 40, null, null, true, true);
insert into users (email, name, role, shop_id) select 'kaasenzo@example.nl', 'Kaas & Zo', 'shop', id from shops where slug = 'kaas-en-zo';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Kerstpakket ‘Proeverij’', 'Vier ambachtelijke kazen, vijgenbrood, chutney en een fles huiswijn in een houten kistje.', 3995, '{}'::text[], '🎁', 'Eten & drinken', '{}'::text[], 'count', 8, true, true, true, 0
from shops where slug = 'kaas-en-zo';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Truffelkaas 400 gram', 'Romige Goudse kaas met zwarte truffel, met de hand gesneden.', 1450, '{}'::text[], '🧀', 'Eten & drinken', '{}'::text[], 'toggle', 0, true, true, true, 1
from shops where slug = 'kaas-en-zo';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Kaasplank eikenhout met messen', 'Robuuste kaasplank van Nederlands eikenhout met drie kaasmesjes.', 3495, '{}'::text[], '🔪', 'Eten & drinken', '{}'::text[], 'toggle', 0, true, true, true, 2
from shops where slug = 'kaas-en-zo';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Vijgenchutney', 'Huisgemaakte chutney van vijgen en port. Heerlijk bij oude kaas.', 695, '{}'::text[], '🍯', 'Eten & drinken', '{}'::text[], 'toggle', 0, true, true, true, 3
from shops where slug = 'kaas-en-zo';

insert into shops (slug, name, tagline, bio, category, logo_url, cover_color, emoji, address, phone, email, website, instagram, opening_hours, map_x, map_y, lat, lng, allow_reservations, active)
values ('studio-linde', 'Studio Linde', 'Woonaccessoires met een verhaal', 'Een conceptstore vol duurzame woonaccessoires, kaarsen en handgemaakte keramiek van Nederlandse makers.', 'Wonen & lifestyle', null, '#8c3b3b', '🕯️', 'De Kempenaerstraat 30', '071-0000003', 'studiolinde@example.nl', '', '', '[{"day":0,"open":null,"close":null},{"day":1,"open":"13:00","close":"18:00"},{"day":2,"open":"09:30","close":"18:00"},{"day":3,"open":"09:30","close":"18:00"},{"day":4,"open":"09:30","close":"18:00"},{"day":5,"open":"09:30","close":"21:00"},{"day":6,"open":"09:30","close":"17:00"}]'::jsonb, 40, 62, null, null, true, true);
insert into users (email, name, role, shop_id) select 'studiolinde@example.nl', 'Studio Linde', 'shop', id from shops where slug = 'studio-linde';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Geurkaars ‘Dennenbos’', 'Handgegoten sojawaskaars met de geur van dennennaalden en ceder. Brandtijd ±45 uur.', 2450, '{}'::text[], '🕯️', 'Wonen & lifestyle', '{}'::text[], 'toggle', 0, true, true, true, 0
from shops where slug = 'studio-linde';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Keramiek mok, goudrand', 'Handgedraaide mok met een randje bladgoud. Ieder exemplaar is uniek.', 1995, '{}'::text[], '☕', 'Wonen & lifestyle', '{}'::text[], 'count', 4, true, true, true, 1
from shops where slug = 'studio-linde';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Plaid wol, oker', 'Zachte plaid van gerecyclede wol in warm oker, 130x170 cm.', 7900, '{}'::text[], '🧶', 'Wonen & lifestyle', '{}'::text[], 'toggle', 0, true, true, true, 2
from shops where slug = 'studio-linde';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Kerstster messing', 'Minimalistische ster om in de boom of aan het raam te hangen.', 2995, '{}'::text[], '⭐', 'Wonen & lifestyle', '{}'::text[], 'toggle', 0, true, true, true, 3
from shops where slug = 'studio-linde';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Vaasje ‘Ijsbloem’', 'Mondgeblazen glazen vaasje met een subtiele ijsbloem-textuur.', 3450, '{}'::text[], '🏺', 'Wonen & lifestyle', '{}'::text[], 'toggle', 0, true, true, true, 4
from shops where slug = 'studio-linde';

insert into shops (slug, name, tagline, bio, category, logo_url, cover_color, emoji, address, phone, email, website, instagram, opening_hours, map_x, map_y, lat, lng, allow_reservations, active)
values ('speelgoed-de-tol', 'Speelgoed De Tol', 'Houten speelgoed & spelletjes', 'Klassiek en duurzaam speelgoed voor groot en klein. Bij ons mag je alles even uitproberen.', 'Kinderen & speelgoed', null, '#b3262e', '🧸', 'De Kempenaerstraat 37', '071-0000004', 'detol@example.nl', '', '', '[{"day":0,"open":null,"close":null},{"day":1,"open":"13:00","close":"18:00"},{"day":2,"open":"09:30","close":"18:00"},{"day":3,"open":"09:30","close":"18:00"},{"day":4,"open":"09:30","close":"18:00"},{"day":5,"open":"09:30","close":"21:00"},{"day":6,"open":"09:30","close":"17:00"}]'::jsonb, 52, 38, null, null, true, true);
insert into users (email, name, role, shop_id) select 'detol@example.nl', 'Speelgoed De Tol', 'shop', id from shops where slug = 'speelgoed-de-tol';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Houten treinset', 'Klassieke houten trein met rails, brug en drie wagons. Vanaf 3 jaar.', 4995, '{}'::text[], '🚂', 'Kinderen & speelgoed', '{}'::text[], 'count', 3, true, true, true, 0
from shops where slug = 'speelgoed-de-tol';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Knuffel ijsbeer', 'Superzachte ijsbeer van 35 cm, wasbaar op 30 graden.', 2250, '{}'::text[], '🐻‍❄️', 'Kinderen & speelgoed', '{}'::text[], 'toggle', 0, true, true, true, 1
from shops where slug = 'speelgoed-de-tol';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Familiespel ‘Sneeuwballen’', 'Een razendsnel kaartspel voor 2–6 spelers vanaf 7 jaar.', 2795, '{}'::text[], '🎲', 'Kinderen & speelgoed', '{}'::text[], 'toggle', 0, true, true, true, 2
from shops where slug = 'speelgoed-de-tol';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Knutselset kerstversiering', 'Maak je eigen vilten kersthangers. Inclusief naald, draad en patronen.', 1495, '{}'::text[], '✂️', 'Kinderen & speelgoed', '{}'::text[], 'toggle', 0, true, true, true, 3
from shops where slug = 'speelgoed-de-tol';

insert into shops (slug, name, tagline, bio, category, logo_url, cover_color, emoji, address, phone, email, website, instagram, opening_hours, map_x, map_y, lat, lng, allow_reservations, active)
values ('bloem-en-blad', 'Bloem & Blad', 'Bloemen, kransen & kerstgroen', 'Seizoensbloemen, handgebonden kerstkransen en groen voor op tafel. We bezorgen ook in het dorp.', 'Bloemen & planten', null, '#3e7a4f', '💐', 'De Kempenaerstraat 44', '071-0000005', 'bloemenblad@example.nl', '', '', '[{"day":0,"open":null,"close":null},{"day":1,"open":"13:00","close":"18:00"},{"day":2,"open":"09:30","close":"18:00"},{"day":3,"open":"09:30","close":"18:00"},{"day":4,"open":"09:30","close":"18:00"},{"day":5,"open":"09:30","close":"21:00"},{"day":6,"open":"09:30","close":"17:00"}]'::jsonb, 63, 60, null, null, true, true);
insert into users (email, name, role, shop_id) select 'bloemenblad@example.nl', 'Bloem & Blad', 'shop', id from shops where slug = 'bloem-en-blad';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Deurkrans ‘Winterbos’', 'Handgebonden krans van verse dennentakken, eucalyptus en gedroogde sinaasappel.', 3495, '{}'::text[], '🎄', 'Bloemen & planten', '{}'::text[], 'count', 10, true, true, true, 0
from shops where slug = 'bloem-en-blad';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Amaryllis in pot', 'Een rode amaryllis met bolletje in een zinken potje. Bloeit rond de kerst.', 1750, '{}'::text[], '🌺', 'Bloemen & planten', '{}'::text[], 'toggle', 0, true, true, true, 1
from shops where slug = 'bloem-en-blad';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Tafelstuk met kaars', 'Feestelijk tafelstuk met mos, kerstgroen en een witte stompkaars.', 2750, '{}'::text[], '🌿', 'Bloemen & planten', '{}'::text[], 'toggle', 0, true, true, true, 2
from shops where slug = 'bloem-en-blad';

insert into shops (slug, name, tagline, bio, category, logo_url, cover_color, emoji, address, phone, email, website, instagram, opening_hours, map_x, map_y, lat, lng, allow_reservations, active)
values ('atelier-goudsmid', 'Atelier Goudsmid', 'Sieraden, handgemaakt in het dorp', 'In ons atelier achter de winkel maken we sieraden van gerecycled goud en zilver. Graveren doen we ter plekke.', 'Mode & sieraden', null, '#a8812f', '💍', 'De Kempenaerstraat 51', '071-0000006', 'goudsmid@example.nl', '', '', '[{"day":0,"open":null,"close":null},{"day":1,"open":"13:00","close":"18:00"},{"day":2,"open":"09:30","close":"18:00"},{"day":3,"open":"09:30","close":"18:00"},{"day":4,"open":"09:30","close":"18:00"},{"day":5,"open":"09:30","close":"21:00"},{"day":6,"open":"09:30","close":"17:00"}]'::jsonb, 75, 40, null, null, true, true);
insert into users (email, name, role, shop_id) select 'goudsmid@example.nl', 'Atelier Goudsmid', 'shop', id from shops where slug = 'atelier-goudsmid';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Ketting ‘Sneeuwvlok’ zilver', 'Fijne zilveren ketting met handgezaagde sneeuwvlok-hanger.', 8900, '{}'::text[], '❄️', 'Mode & sieraden', '{}'::text[], 'count', 5, true, true, true, 0
from shops where slug = 'atelier-goudsmid';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Oorbellen goud, druppel', '14 karaat gouden oorbellen van gerecycled goud.', 12900, '{}'::text[], '✨', 'Mode & sieraden', '{}'::text[], 'toggle', 0, true, true, true, 1
from shops where slug = 'atelier-goudsmid';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Ring met graveerruimte', 'Zilveren ring; we graveren gratis een naam of datum terwijl je wacht.', 6900, '{}'::text[], '💍', 'Mode & sieraden', '{}'::text[], 'toggle', 0, true, true, true, 2
from shops where slug = 'atelier-goudsmid';

insert into shops (slug, name, tagline, bio, category, logo_url, cover_color, emoji, address, phone, email, website, instagram, opening_hours, map_x, map_y, lat, lng, allow_reservations, active)
values ('koffiebar-hazelaar', 'Koffiebar Hazelaar', 'Koffie, thee & lekkers', 'Zelfgebrande bonen, losse thee en de lekkerste kerstkoekjes. Drink ook een warme chocomel tijdens het shoppen!', 'Eten & drinken', null, '#6b4a34', '☕', 'De Kempenaerstraat 58', '071-0000007', 'hazelaar@example.nl', '', '', '[{"day":0,"open":null,"close":null},{"day":1,"open":"13:00","close":"18:00"},{"day":2,"open":"09:30","close":"18:00"},{"day":3,"open":"09:30","close":"18:00"},{"day":4,"open":"09:30","close":"18:00"},{"day":5,"open":"09:30","close":"21:00"},{"day":6,"open":"09:30","close":"17:00"}]'::jsonb, 86, 60, null, null, false, true);
insert into users (email, name, role, shop_id) select 'hazelaar@example.nl', 'Koffiebar Hazelaar', 'shop', id from shops where slug = 'koffiebar-hazelaar';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Kerstblend koffiebonen 250 g', 'Onze eigen kerstmelange met tonen van kaneel en pure chocolade.', 1195, '{}'::text[], '☕', 'Eten & drinken', '{}'::text[], 'toggle', 0, true, true, true, 0
from shops where slug = 'koffiebar-hazelaar';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Theedoos ‘Winteravond’', 'Drie losse theesoorten in een mooi blik, met theezeefje.', 1850, '{}'::text[], '🫖', 'Eten & drinken', '{}'::text[], 'toggle', 0, true, true, true, 1
from shops where slug = 'koffiebar-hazelaar';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Kerstkoekjestrommel', 'Trommel vol zelfgebakken kruidnoten, sterretjes en roomboterkransjes.', 1295, '{}'::text[], '🍪', 'Eten & drinken', '{}'::text[], 'toggle', 0, true, true, true, 2
from shops where slug = 'koffiebar-hazelaar';

insert into shops (slug, name, tagline, bio, category, logo_url, cover_color, emoji, address, phone, email, website, instagram, opening_hours, map_x, map_y, lat, lng, allow_reservations, active)
values ('mode-merel', 'Mode Merel', 'Dames- en herenmode', 'Warme truien, zachte sjaals en feestelijke outfits. Persoonlijk advies en gratis cadeauverpakking.', 'Mode & sieraden', null, '#1f3b5c', '🧣', 'De Kempenaerstraat 63', '071-0000008', 'merel@example.nl', '', '', '[{"day":0,"open":null,"close":null},{"day":1,"open":"13:00","close":"18:00"},{"day":2,"open":"09:30","close":"18:00"},{"day":3,"open":"09:30","close":"18:00"},{"day":4,"open":"09:30","close":"18:00"},{"day":5,"open":"09:30","close":"21:00"},{"day":6,"open":"09:30","close":"17:00"}]'::jsonb, 92, 36, null, null, true, true);
insert into users (email, name, role, shop_id) select 'merel@example.nl', 'Mode Merel', 'shop', id from shops where slug = 'mode-merel';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Sjaal kasjmier, bordeaux', 'Heerlijk zachte sjaal van 100% kasjmier in diep bordeaux.', 6995, '{}'::text[], '🧣', 'Mode & sieraden', '{}'::text[], 'count', 7, true, true, true, 0
from shops where slug = 'mode-merel';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Gebreide muts met pompon', 'Wollen muts met een pompon van imitatiebont.', 2995, '{}'::text[], '🧶', 'Mode & sieraden', '{}'::text[], 'toggle', 0, true, true, true, 1
from shops where slug = 'mode-merel';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Handschoenen leer', 'Leren handschoenen met kasjmier voering, dames en heren.', 4995, '{}'::text[], '🧤', 'Mode & sieraden', '{}'::text[], 'toggle', 0, true, true, true, 2
from shops where slug = 'mode-merel';
insert into products (shop_id, title, description, price_cents, images, emoji, category, tags, stock_mode, stock, in_stock, reservable, active, sort_order)
select id, 'Kerstsokken giftbox', 'Drie paar vrolijke kerstsokken in een cadeaudoos.', 1995, '{}'::text[], '🧦', 'Mode & sieraden', '{}'::text[], 'toggle', 0, true, true, true, 3
from shops where slug = 'mode-merel';

-- Beheerder: vervang door je eigen e-mailadres; daarmee log je in via een inloglink.
insert into users (email, name, role) values ('admin@example.nl', 'Beheerder', 'admin');

commit;
