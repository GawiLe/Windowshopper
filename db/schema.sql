-- =====================================================================
-- Windowshoppen – multi-tenant databaseschema voor Neon (Postgres 16+)
-- =====================================================================
-- Eén database, meerdere winkelgebieden (tenants), bv. shoppenkempenaer.nl en shoppenmijdrecht.nl.
--
-- Scheiding tussen winkelgebieden, in drie lagen:
--   1. Elke tabel met gebiedsgegevens heeft een kolom area_id.
--   2. Samengestelde foreign keys (id, area_id) maken het onmogelijk om bv. een product van
--      gebied A aan een winkel van gebied B te koppelen, of een reservering te kruisen.
--   3. Row Level Security (FORCE): elke query ziet en wijzigt alleen rijen van het gebied dat de
--      app per transactie instelt met  select set_config('app.area_id', '<uuid>', true).
--      Zonder die instelling ziet een query niets. Alleen de superadmin-schermen en de
--      opschoonjobs zetten bewust  app.platform = 'super'  om over alle gebieden te werken.
--
-- Rollen:
--   * superadmin (users.is_super_admin) – beheert alle gebieden
--   * admin van een gebied (memberships.role = 'admin') – één of meer per gebied
--   * winkelier (memberships.role = 'shop', met shop_id)
--   Bezoekers hebben GEEN account: hun lijstje leeft in de browser / deel-link.
--
-- Laat de app verbinden met een eigen rol zonder BYPASSRLS (zie onderaan en docs/V0-MIGRATIE.md).
-- ---------------------------------------------------------------------

create extension if not exists pgcrypto; -- bcrypt voor wachtwoorden (crypt / gen_salt)

-- ---------- Context van het huidige verzoek ----------------------------
create function current_area_id() returns uuid
language sql stable as $$
  select nullif(current_setting('app.area_id', true), '')::uuid
$$;

create function is_platform_scope() returns boolean
language sql stable as $$
  select coalesce(current_setting('app.platform', true), '') = 'super'
$$;

-- ---------- Winkelgebieden (tenants) -----------------------------------
create table areas (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name        text not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Welk domein hoort bij welk gebied. Wordt gelezen vóórdat het gebied bekend is (geen RLS).
create table area_domains (
  domain   text primary key check (domain = lower(domain) and domain !~ '^www\.' and domain ~ '^[a-z0-9.-]+\.[a-z]{2,}$'),
  area_id  uuid not null references areas(id) on delete cascade
);
create index area_domains_area_idx on area_domains (area_id);

-- Instellingen per gebied (teksten, kleuren, logo's, regels, privacy)
create table area_settings (
  area_id                uuid primary key references areas(id) on delete cascade,
  site_name              text not null default 'Windowshoppen',
  area_name              text not null default '',
  town                   text not null default '',
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
  map                    jsonb not null default '{"lat":52.18,"lng":4.47,"zoom":16}',
  colors                 jsonb not null default '{"primary":"#023934","accent":"#9b2c2c","gold":"#c09a5e","background":"#f8f4ec","text":"#1f2a28"}',
  brand                  jsonb not null default '{"logo":null,"mark":null,"favicon":null}', -- URL's (Vercel Blob)
  categories             text[] not null default array['Boeken & papier','Eten & drinken','Wonen & lifestyle','Kinderen & speelgoed','Bloemen & planten','Mode & sieraden','Beauty & verzorging','Overig'],
  privacy                jsonb not null default '{"controllerName":"","controllerAddress":"","contactEmail":"","kvk":"","retentionDays":30}',
  mail_from              text,  -- bv. 'Windowshoppen <kado@shoppenkempenaer.nl>' (domein geverifieerd in Resend)
  updated_at             timestamptz not null default now()
);

-- elk nieuw gebied krijgt automatisch een instellingenrij
create function create_area_settings() returns trigger
language plpgsql as $$
begin
  insert into area_settings (area_id, area_name) values (new.id, new.name);
  return new;
end $$;
create trigger areas_settings after insert on areas
  for each row execute function create_area_settings();

-- ---------- Winkels ----------------------------------------------------
create table shops (
  id                  uuid primary key default gen_random_uuid(),
  area_id             uuid not null references areas(id) on delete cascade,
  slug                text not null check (slug ~ '^[a-z0-9-]+$'),
  name                text not null,
  tagline             text not null default '',
  bio                 text not null default '',
  category            text not null default 'Overig',
  logo_url            text,
  cover_color         text not null default '#023934',
  icon                text not null default 'gift',
  address             text not null default '',
  phone               text not null default '',
  email               text not null,               -- ontvangt reserveringsmails
  website             text not null default '',
  instagram           text not null default '',
  opening_hours       jsonb not null default '[]',
  lat                 double precision check (lat between -90 and 90),
  lng                 double precision check (lng between -180 and 180),
  allow_reservations  boolean not null default true,
  active              boolean not null default true,
  created_at          timestamptz not null default now(),
  unique (area_id, slug),
  unique (id, area_id)                              -- doel voor samengestelde foreign keys
);

-- ---------- Gebruikers, rollen & inloggen -------------------------------
create table users (
  id              uuid primary key default gen_random_uuid(),
  email           text not null,
  name            text not null default '',
  password_hash   text,                     -- bcrypt; leeg = alleen inloglink
  is_super_admin  boolean not null default false,
  created_at      timestamptz not null default now(),
  last_login      timestamptz
);
create unique index users_email_idx on users (lower(email));

-- Wie mag wat in welk gebied. Eén gebruiker kan in meerdere gebieden een rol hebben.
create table memberships (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  area_id     uuid not null references areas(id) on delete cascade,
  role        text not null check (role in ('admin', 'shop')),
  shop_id     uuid,
  created_at  timestamptz not null default now(),
  constraint role_shop check ((role = 'admin' and shop_id is null) or (role = 'shop' and shop_id is not null)),
  constraint shop_same_area foreign key (shop_id, area_id) references shops (id, area_id) on delete cascade
);
create unique index memberships_admin_idx on memberships (user_id, area_id) where role = 'admin';
create unique index memberships_shop_idx on memberships (user_id, shop_id) where role = 'shop';
create index memberships_area_idx on memberships (area_id);

-- Eenmalige inloglinks; gebonden aan het gebied (domein) waar ze zijn aangevraagd.
create table login_tokens (
  token_hash  text primary key,                -- sha256 van het token
  user_id     uuid not null references users(id) on delete cascade,
  area_id     uuid references areas(id) on delete cascade, -- null = superadmin-login
  expires_at  timestamptz not null,
  used_at     timestamptz
);

-- Sessies, eveneens per gebied. Een sessie van gebied A is op het domein van gebied B ongeldig.
create table sessions (
  token_hash  text primary key,
  user_id     uuid not null references users(id) on delete cascade,
  area_id     uuid references areas(id) on delete cascade, -- null = superadmin-sessie
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null
);
create index sessions_user_idx on sessions (user_id);

create table login_attempts (
  email       text not null,
  ip          text,
  area_id     uuid references areas(id) on delete cascade,
  created_at  timestamptz not null default now()
);
create index login_attempts_idx on login_attempts (lower(email), created_at);

-- ---------- Producten --------------------------------------------------
create table products (
  id           uuid primary key default gen_random_uuid(),
  area_id      uuid not null references areas(id) on delete cascade,
  shop_id      uuid not null,
  title        text not null check (char_length(title) between 2 and 80),
  description  text not null default '' check (char_length(description) <= 800),
  price_cents  int  not null check (price_cents > 0),
  images       text[] not null default '{}' check (cardinality(images) <= 4),
  icon         text not null default 'gift',
  category     text not null default 'Overig',
  tags         text[] not null default '{}',
  stock_mode   text not null default 'toggle' check (stock_mode in ('toggle', 'count')),
  stock        int  not null default 0 check (stock >= 0),
  in_stock     boolean not null default true,
  reservable   boolean not null default true,
  active       boolean not null default true,
  sort_order   bigint not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (id, area_id),
  constraint product_shop_same_area foreign key (shop_id, area_id) references shops (id, area_id) on delete cascade
);
create index products_shop_idx on products (shop_id, sort_order);
create index products_area_idx on products (area_id);

create function enforce_product_limit() returns trigger
language plpgsql as $$
declare
  lim int;
  cnt int;
begin
  perform pg_advisory_xact_lock(hashtext(new.shop_id::text));
  select max_products_per_shop into lim from area_settings where area_id = new.area_id;
  select count(*) into cnt from products where shop_id = new.shop_id;
  if cnt >= coalesce(lim, 20) then
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
create table reservations (
  id              uuid primary key default gen_random_uuid(),
  area_id         uuid not null references areas(id) on delete cascade,
  code            text not null,                    -- ophaalcode, uniek binnen het gebied
  order_id        uuid not null,
  shop_id         uuid not null,
  customer_name   text not null,
  customer_email  text not null,
  customer_phone  text not null default '',
  pickup_date     date not null,
  note            text not null default '' check (char_length(note) <= 300),
  status          text not null default 'reserved' check (status in ('reserved', 'picked_up', 'expired', 'cancelled')),
  consent_at      timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null,
  picked_up_at    timestamptz,
  unique (area_id, code),
  unique (id, area_id),
  constraint reservation_shop_same_area foreign key (shop_id, area_id) references shops (id, area_id) on delete cascade
);
create index reservations_shop_idx on reservations (shop_id, status, pickup_date);
create index reservations_order_idx on reservations (order_id);

create table reservation_items (
  id              uuid primary key default gen_random_uuid(),
  area_id         uuid not null references areas(id) on delete cascade,
  reservation_id  uuid not null,
  product_id      uuid,
  title           text not null,
  price_cents     int  not null,
  quantity        int  not null default 1 check (quantity between 1 and 9),
  constraint item_reservation_same_area foreign key (reservation_id, area_id) references reservations (id, area_id) on delete cascade,
  constraint item_product_same_area foreign key (product_id, area_id) references products (id, area_id) on delete set null (product_id)
);
create index reservation_items_res_idx on reservation_items (reservation_id);

-- ---------- Mail-log ---------------------------------------------------
create table email_log (
  id          uuid primary key default gen_random_uuid(),
  area_id     uuid not null references areas(id) on delete cascade,
  kind        text not null check (kind in ('shop_new_reservation', 'customer_confirmation', 'customer_list', 'shop_welcome', 'login_link', 'admin_welcome')),
  to_email    text not null,
  subject     text not null,
  shop_id     uuid,
  provider_id text,
  created_at  timestamptz not null default now(),
  constraint mail_shop_same_area foreign key (shop_id, area_id) references shops (id, area_id) on delete cascade
  -- bewust GEEN mailinhoud: geen dubbele opslag van persoonsgegevens
);

-- ---------- Row Level Security -----------------------------------------
-- FORCE zorgt dat RLS ook geldt voor de eigenaar van de tabellen.
do $$
declare t text;
begin
  foreach t in array array['area_settings', 'shops', 'products', 'reservations', 'reservation_items', 'email_log', 'memberships'] loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
    execute format(
      'create policy tenant_isolation on %I using (area_id = current_area_id() or is_platform_scope()) '
      'with check (area_id = current_area_id() or is_platform_scope())', t);
  end loop;
end $$;

-- areas zelf: iedereen mag het eigen gebied lezen; aanmaken/wijzigen alleen in platform-scope
alter table areas enable row level security;
alter table areas force row level security;
create policy areas_read on areas for select using (id = current_area_id() or is_platform_scope());
create policy areas_write on areas for all using (is_platform_scope()) with check (is_platform_scope());

-- Nieuwe rijen krijgen automatisch het gebied van de context, zodat de app het niet kan vergeten.
create function set_area_from_context() returns trigger
language plpgsql as $$
begin
  if new.area_id is null then new.area_id := current_area_id(); end if;
  if new.area_id is null then raise exception 'Geen winkelgebied ingesteld (app.area_id)'; end if;
  return new;
end $$;
do $$
declare t text;
begin
  foreach t in array array['shops', 'products', 'reservations', 'reservation_items', 'email_log', 'memberships'] loop
    execute format('create trigger %I before insert on %I for each row execute function set_area_from_context()', t || '_area', t);
  end loop;
end $$;

-- ---------- Reserveren als één atomaire actie --------------------------
-- Draait binnen het gebied uit app.area_id. Producten van andere gebieden zijn door RLS
-- onzichtbaar, dus die kunnen hier nooit in een reservering terechtkomen.
--   select * from create_reservations($1, $2, $3, $4::date, $5, $6::jsonb)
create function new_pickup_code(p_area uuid) returns text
language plpgsql as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  c text;
begin
  loop
    c := 'KS-' || (select string_agg(substr(alphabet, 1 + floor(random() * 32)::int, 1), '') from generate_series(1, 4));
    exit when not exists (select 1 from reservations where area_id = p_area and code = c);
  end loop;
  return c;
end $$;

create function create_reservations(
  p_name text, p_email text, p_phone text, p_pickup date, p_note text, p_items jsonb
) returns setof reservations
language plpgsql as $$
declare
  v_area    uuid := current_area_id();
  v_order   uuid := gen_random_uuid();
  v_set     area_settings%rowtype;
  v_expires timestamptz;
  v_qty     int;
  v_res_id  uuid;
  it        jsonb;
  prod      products%rowtype;
  shop      shops%rowtype;
  shop_res  jsonb := '{}';
begin
  if v_area is null then raise exception 'Geen winkelgebied ingesteld'; end if;
  select * into v_set from area_settings where area_id = v_area;
  if not v_set.reservations_enabled then
    raise exception 'Reserveren is op dit moment niet mogelijk';
  end if;
  if p_pickup < (now() at time zone 'Europe/Amsterdam')::date then
    raise exception 'Ophaaldag ligt in het verleden';
  end if;
  v_expires := greatest((p_pickup + time '23:59') at time zone 'Europe/Amsterdam',
                        now() + make_interval(hours => v_set.reservation_hours));

  for it in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(1, least(9, coalesce((it->>'quantity')::int, 1)));
    select * into prod from products where id = (it->>'product_id')::uuid and area_id = v_area for update;
    select * into shop from shops where id = prod.shop_id and area_id = v_area;
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
      insert into reservations (area_id, code, order_id, shop_id, customer_name, customer_email, customer_phone, pickup_date, note, expires_at)
      values (v_area, new_pickup_code(v_area), v_order, prod.shop_id, p_name, p_email, coalesce(p_phone, ''), p_pickup, coalesce(p_note, ''), v_expires)
      returning id into v_res_id;
      shop_res := shop_res || jsonb_build_object(prod.shop_id::text, v_res_id);
    end if;

    insert into reservation_items (area_id, reservation_id, product_id, title, price_cents, quantity)
    values (v_area, v_res_id, prod.id, prod.title, prod.price_cents, v_qty);
  end loop;

  return query select * from reservations where order_id = v_order;
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
     where ri.reservation_id = new.id and ri.product_id = p.id and p.area_id = new.area_id and p.stock_mode = 'count';
  elsif holding_new and not holding_old then
    update products p set stock = greatest(0, p.stock - ri.quantity)
      from reservation_items ri
     where ri.reservation_id = new.id and ri.product_id = p.id and p.area_id = new.area_id and p.stock_mode = 'count';
  end if;
  new.picked_up_at := case when new.status = 'picked_up' then coalesce(old.picked_up_at, now()) else null end;
  return new;
end $$;
create trigger reservations_status before update of status on reservations
  for each row when (old.status is distinct from new.status)
  execute function on_reservation_status();

-- ---------- Opschonen (AVG) – voor alle gebieden -----------------------
-- Vercel Cron roept /api/cron aan, die draait:  select expire_reservations(); select purge_personal_data();
create function expire_reservations() returns int
language plpgsql as $$
declare n int;
begin
  perform set_config('app.platform', 'super', true);
  update reservations set status = 'expired' where status = 'reserved' and expires_at < now();
  get diagnostics n = row_count;
  return n;
end $$;

create function purge_personal_data() returns void
language plpgsql as $$
begin
  perform set_config('app.platform', 'super', true);
  -- bewaartermijn per gebied
  delete from reservations r using area_settings s
   where s.area_id = r.area_id and r.status <> 'reserved'
     and r.created_at < now() - make_interval(days => coalesce((s.privacy->>'retentionDays')::int, 30));
  delete from email_log m using area_settings s
   where s.area_id = m.area_id
     and m.created_at < now() - make_interval(days => coalesce((s.privacy->>'retentionDays')::int, 30));
  delete from login_tokens where expires_at < now();
  delete from sessions where expires_at < now();
  delete from login_attempts where created_at < now() - interval '1 day';
end $$;

-- ---------- Handige views (respecteren RLS van de onderliggende tabellen) ----
create view public_products with (security_invoker = true) as
  select p.* from products p join shops s on s.id = p.shop_id and s.area_id = p.area_id
   where p.active and s.active;

create view reservation_overview with (security_invoker = true) as
  select r.*,
         coalesce(jsonb_agg(jsonb_build_object(
           'productId', ri.product_id, 'title', ri.title,
           'price', ri.price_cents / 100.0, 'quantity', ri.quantity) order by ri.title)
           filter (where ri.id is not null), '[]') as items
    from reservations r
    left join reservation_items ri on ri.reservation_id = r.id and ri.area_id = r.area_id
   group by r.id;

-- ---------- Rechten voor de app-rol ------------------------------------
-- Maak in Neon (Roles) een rol 'windowshop_app' aan en gebruik díe verbindingsstring in de app.
-- Deze rol is geen eigenaar en heeft geen BYPASSRLS, dus RLS geldt altijd.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'windowshop_app') then
    grant usage on schema public to windowshop_app;
    grant select, insert, update, delete on all tables in schema public to windowshop_app;
    grant execute on all functions in schema public to windowshop_app;
    alter default privileges in schema public grant select, insert, update, delete on tables to windowshop_app;
    alter default privileges in schema public grant execute on functions to windowshop_app;
  end if;
end $$;
