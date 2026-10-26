-- =====================================================================
-- Windowshoppen – Winkelgebied De Kempenaer – databaseschema voor Neon (Postgres 16+)
-- =====================================================================
-- Draai dit in de Neon SQL Editor (of: psql "$DATABASE_URL" -f db/schema.sql),
-- daarna eventueel db/seed.sql voor de demo-winkels.
--
-- Neon is "gewone" Postgres: er is geen ingebouwde login of bestandsopslag.
--   * Inloggen      → eigen magic-link login (tabellen users / login_tokens / sessions hieronder)
--   * Toegang       → in de server actions: elke query van een winkelier filtert op zijn shop_id
--   * Foto's        → Vercel Blob; in de database staan alleen de URL's
--   * Opschonen     → Vercel Cron roept /api/cron aan, die de functies onderaan uitvoert
-- Bezoekers hebben GEEN account: hun lijstje leeft in de browser / deel-link.
--
-- Mail: via Resend (https://resend.com), aangeroepen vanuit de server actions.
--
-- De tabellen spiegelen de types in lib/types.ts (camelCase → snake_case, prijzen in centen).
-- ---------------------------------------------------------------------

-- pgcrypto: voor bcrypt-wachtwoordcontrole van de beheerder (crypt / gen_salt)
create extension if not exists pgcrypto;

-- ---------- Instellingen (precies 1 rij) -------------------------------
create table site_settings (
  id                     int primary key default 1 check (id = 1),
  site_name              text not null default 'Windowshoppen',
  area_name              text not null default 'De Kempenaer',
  town                   text not null default 'Oegstgeest',
  hero_title             text not null default '',
  hero_subtitle          text not null default '',
  intro_text             text not null default '',
  footer_text            text not null default '',
  campaign_start         date,
  campaign_end           date,
  max_products_per_shop  int  not null default 20 check (max_products_per_shop between 1 and 100),
  reservation_hours      int  not null default 24 check (reservation_hours between 1 and 168),
  reservations_enabled   boolean not null default true,
  snow_enabled           boolean not null default true,
  map                    jsonb not null default '{"lat":52.1806,"lng":4.4706,"zoom":17}', -- middelpunt kaart
  colors                 jsonb not null default '{"primary":"#023934","accent":"#9b2c2c","gold":"#c09a5e","background":"#f8f4ec","text":"#1f2a28"}',
  categories             text[] not null default array['Boeken & papier','Eten & drinken','Wonen & lifestyle','Kinderen & speelgoed','Bloemen & planten','Mode & sieraden','Beauty & verzorging','Overig'],
  privacy                jsonb not null default '{"controllerName":"","controllerAddress":"","contactEmail":"","kvk":"","retentionDays":30}',
  updated_at             timestamptz not null default now()
);
insert into site_settings (id) values (1) on conflict do nothing;

-- ---------- Winkels ----------------------------------------------------
create table shops (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name                text not null,
  tagline             text not null default '',
  bio                 text not null default '',
  category            text not null default 'Overig',
  logo_url            text,                        -- Vercel Blob URL
  cover_color         text not null default '#1f4d3a',
  icon                text not null default 'gift',  -- sleutel uit lib/icons.ts
  address             text not null default '',
  phone               text not null default '',
  email               text not null,               -- ontvangt reserveringsmails
  website             text not null default '',
  instagram           text not null default '',
  opening_hours       jsonb not null default '[]', -- [{"day":0-6,"open":"09:30","close":"18:00"}]
  lat                 double precision check (lat between -90 and 90),    -- plek op de kaart; leeg = opzoeken via adres (PDOK)
  lng                 double precision check (lng between -180 and 180),
  allow_reservations  boolean not null default true,
  active              boolean not null default true,
  created_at          timestamptz not null default now()
);

-- ---------- Gebruikers & inloggen ---------------------------------------
-- Admin en winkeliers. Een winkel kan meerdere gebruikers hebben (bv. eigenaar + medewerker).
-- Beheerder: e-mail + wachtwoord (bcrypt in password_hash). Winkeliers: inloglink per e-mail
-- (password_hash leeg), of optioneel ook een wachtwoord.
--   Controleren:  select * from users where lower(email) = lower($1) and password_hash = crypt($2, password_hash)
--   Wijzigen:     update users set password_hash = crypt($2, gen_salt('bf', 12)) where id = $1
create table users (
  id             uuid primary key default gen_random_uuid(),
  email          text not null,
  name           text not null default '',
  password_hash  text,
  role        text not null check (role in ('admin', 'shop')),
  shop_id     uuid references shops(id) on delete cascade,
  created_at  timestamptz not null default now(),
  last_login  timestamptz,
  constraint shop_user_has_shop check (role = 'admin' or shop_id is not null)
);
create unique index users_email_idx on users (lower(email));

-- Mislukte inlogpogingen (rem op wachtwoord raden: bv. max. 5 per 15 min per e-mail)
create table login_attempts (
  email       text not null,
  ip          text,
  created_at  timestamptz not null default now()
);
create index login_attempts_idx on login_attempts (lower(email), created_at);

-- Eenmalige inloglinks. Sla alleen een hash van het token op (sha256), nooit het token zelf.
create table login_tokens (
  token_hash  text primary key,
  user_id     uuid not null references users(id) on delete cascade,
  expires_at  timestamptz not null,            -- bv. now() + 15 minuten
  used_at     timestamptz
);

-- Sessies (cookie bevat het ruwe sessie-token, de database alleen de hash).
create table sessions (
  token_hash  text primary key,
  user_id     uuid not null references users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null             -- bv. now() + 30 dagen
);
create index sessions_user_idx on sessions (user_id);

-- ---------- Producten --------------------------------------------------
create table products (
  id           uuid primary key default gen_random_uuid(),
  shop_id      uuid not null references shops(id) on delete cascade,
  title        text not null check (char_length(title) between 2 and 80),
  description  text not null default '' check (char_length(description) <= 800),
  price_cents  int  not null check (price_cents > 0),
  images       text[] not null default '{}' check (cardinality(images) <= 4), -- Vercel Blob URL's
  icon         text not null default 'gift',   -- illustratie zolang er geen foto is (lib/icons.ts)
  category     text not null default 'Overig',
  tags         text[] not null default '{}',
  stock_mode   text not null default 'toggle' check (stock_mode in ('toggle', 'count')),
  stock        int  not null default 0 check (stock >= 0),
  in_stock     boolean not null default true,
  reservable   boolean not null default true,
  active       boolean not null default true,
  sort_order   bigint not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index products_shop_idx on products (shop_id, sort_order);

-- Maximaal N producten per winkel (N uit site_settings). De lock voorkomt dat twee
-- gelijktijdige inserts samen over de grens gaan.
create function enforce_product_limit() returns trigger
language plpgsql as $$
declare
  lim int;
  cnt int;
begin
  perform pg_advisory_xact_lock(hashtext(new.shop_id::text));
  select max_products_per_shop into lim from site_settings where id = 1;
  select count(*) into cnt from products where shop_id = new.shop_id;
  if cnt >= lim then
    raise exception 'Maximaal % producten per winkel', lim using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger products_limit before insert on products
  for each row execute function enforce_product_limit();

create function touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

create trigger products_touch before update on products
  for each row execute function touch_updated_at();

-- ---------- Reserveringen ----------------------------------------------
-- Eén checkout (order_id) levert één reservering per winkel op.
create table reservations (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,              -- ophaalcode, bv. KS-4F7Q
  order_id        uuid not null,
  shop_id         uuid not null references shops(id) on delete cascade,
  customer_name   text not null,
  customer_email  text not null,
  customer_phone  text not null default '',
  pickup_date     date not null,
  note            text not null default '' check (char_length(note) <= 300),
  status          text not null default 'reserved' check (status in ('reserved', 'picked_up', 'expired', 'cancelled')),
  consent_at      timestamptz not null default now(), -- moment van toestemming (AVG)
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null,
  picked_up_at    timestamptz
);
create index reservations_shop_idx on reservations (shop_id, status, pickup_date);
create index reservations_order_idx on reservations (order_id);

create table reservation_items (
  id              uuid primary key default gen_random_uuid(),
  reservation_id  uuid not null references reservations(id) on delete cascade,
  product_id      uuid references products(id) on delete set null,
  title           text not null,      -- kopie, zodat het overzicht klopt als het product later wijzigt
  price_cents     int  not null,
  quantity        int  not null default 1 check (quantity between 1 and 9)
);
create index reservation_items_res_idx on reservation_items (reservation_id);

-- ---------- Mail-log ---------------------------------------------------
create table email_log (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('shop_new_reservation', 'customer_confirmation', 'customer_list', 'shop_welcome', 'login_link')),
  to_email    text not null,
  subject     text not null,
  shop_id     uuid references shops(id) on delete cascade,
  provider_id text,                   -- id van Resend
  created_at  timestamptz not null default now()
  -- bewust GEEN mailinhoud: geen dubbele opslag van persoonsgegevens
);

-- ---------- Reserveren als één atomaire actie --------------------------
-- Aanroepen vanuit de server action:
--   select * from create_reservations($1, $2, $3, $4::date, $5, $6::jsonb)
-- met p_items = '[{"product_id":"…","quantity":1}, …]'.
-- Voorraad en reserveringen kloppen zo altijd, ook als twee mensen tegelijk reserveren.
create function create_reservations(
  p_name text, p_email text, p_phone text, p_pickup date, p_note text, p_items jsonb
) returns setof reservations
language plpgsql as $$
declare
  v_order   uuid := gen_random_uuid();
  v_set     site_settings%rowtype;
  v_expires timestamptz;
  v_qty     int;
  v_res_id  uuid;
  it        jsonb;
  prod      products%rowtype;
  shop      shops%rowtype;
  shop_res  jsonb := '{}';
begin
  select * into v_set from site_settings where id = 1;
  if not v_set.reservations_enabled then
    raise exception 'Reserveren is op dit moment niet mogelijk';
  end if;
  if p_pickup < (now() at time zone 'Europe/Amsterdam')::date then
    raise exception 'Ophaaldag ligt in het verleden';
  end if;
  -- geldig tot het einde van de ophaaldag, en minimaal reservation_hours
  v_expires := greatest((p_pickup + time '23:59') at time zone 'Europe/Amsterdam',
                        now() + make_interval(hours => v_set.reservation_hours));

  for it in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(1, least(9, coalesce((it->>'quantity')::int, 1)));
    select * into prod from products where id = (it->>'product_id')::uuid for update;
    select * into shop from shops where id = prod.shop_id;
    if prod.id is null or not prod.active or not prod.reservable or not shop.active or not shop.allow_reservations then
      raise exception 'Product niet beschikbaar';
    end if;
    if prod.stock_mode = 'count' then
      if prod.stock < v_qty then raise exception 'Onvoldoende voorraad: %', prod.title; end if;
      update products set stock = stock - v_qty where id = prod.id;
    elsif not prod.in_stock then
      raise exception 'Niet op voorraad: %', prod.title;
    end if;

    if shop_res ? prod.shop_id::text then
      v_res_id := (shop_res->>prod.shop_id::text)::uuid;
    else
      insert into reservations (code, order_id, shop_id, customer_name, customer_email, customer_phone, pickup_date, note, expires_at)
      values (new_pickup_code(), v_order, prod.shop_id, p_name, p_email, coalesce(p_phone, ''), p_pickup, coalesce(p_note, ''), v_expires)
      returning id into v_res_id;
      shop_res := shop_res || jsonb_build_object(prod.shop_id::text, v_res_id);
    end if;

    insert into reservation_items (reservation_id, product_id, title, price_cents, quantity)
    values (v_res_id, prod.id, prod.title, prod.price_cents, v_qty);
  end loop;

  return query select * from reservations where order_id = v_order;
end $$;

-- Korte, goed leesbare ophaalcode zonder verwarrende tekens (0/O, 1/I)
create function new_pickup_code() returns text
language plpgsql as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  c text;
begin
  loop
    c := 'KS-' || (select string_agg(substr(alphabet, 1 + floor(random() * 32)::int, 1), '') from generate_series(1, 4));
    exit when not exists (select 1 from reservations where code = c);
  end loop;
  return c;
end $$;

-- Statuswissel: voorraad terug bij annuleren/verlopen, weer af bij terugzetten
create function on_reservation_status() returns trigger
language plpgsql as $$
declare
  holding_old boolean := old.status in ('reserved', 'picked_up');
  holding_new boolean := new.status in ('reserved', 'picked_up');
begin
  if holding_old and not holding_new then
    update products p set stock = p.stock + ri.quantity
      from reservation_items ri
     where ri.reservation_id = new.id and ri.product_id = p.id and p.stock_mode = 'count';
  elsif holding_new and not holding_old then
    update products p set stock = greatest(0, p.stock - ri.quantity)
      from reservation_items ri
     where ri.reservation_id = new.id and ri.product_id = p.id and p.stock_mode = 'count';
  end if;
  new.picked_up_at := case when new.status = 'picked_up' then coalesce(old.picked_up_at, now()) else null end;
  return new;
end $$;

create trigger reservations_status before update of status on reservations
  for each row when (old.status is distinct from new.status)
  execute function on_reservation_status();

-- ---------- Opschonen (AVG) --------------------------------------------
-- Laat Vercel Cron elke 10 minuten /api/cron aanroepen; die route draait:
--   select expire_reservations();  select purge_personal_data();
create function expire_reservations() returns int
language sql as $$
  with x as (
    update reservations set status = 'expired'
     where status = 'reserved' and expires_at < now()
    returning 1
  ) select count(*)::int from x;
$$;

create function purge_personal_data() returns void
language plpgsql as $$
declare
  days int := (select coalesce((privacy->>'retentionDays')::int, 30) from site_settings where id = 1);
begin
  delete from reservations where status <> 'reserved' and created_at < now() - make_interval(days => days);
  delete from email_log    where created_at < now() - make_interval(days => days);
  delete from login_tokens where expires_at < now();
  delete from login_attempts where created_at < now() - interval '1 day';
  delete from sessions     where expires_at < now();
end $$;

-- ---------- Handige views ----------------------------------------------
-- Publieke etalage: alleen zichtbare producten van zichtbare winkels.
create view public_products as
  select p.* from products p join shops s on s.id = p.shop_id
   where p.active and s.active;

-- Overzicht voor de winkelier: reservering + items als JSON (filter altijd op shop_id!)
create view reservation_overview as
  select r.*,
         coalesce(jsonb_agg(jsonb_build_object(
           'productId', ri.product_id, 'title', ri.title,
           'price', ri.price_cents / 100.0, 'quantity', ri.quantity) order by ri.title)
           filter (where ri.id is not null), '[]') as items
    from reservations r
    left join reservation_items ri on ri.reservation_id = r.id
   group by r.id;
