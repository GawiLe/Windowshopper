-- =====================================================================
-- Windowshoppen De Kempenaerstraat – databaseschema (Supabase / Postgres)
-- =====================================================================
-- Draai dit in de Supabase SQL-editor. Het spiegelt de types in lib/types.ts.
-- Auth: winkeliers en admin loggen in via Supabase Auth (magic link).
-- Bezoekers hebben GEEN account: hun lijstje leeft in de browser / deel-link.
-- ---------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- ---------- Rollen ----------------------------------------------------
-- Koppelt een auth-gebruiker aan een rol en (voor winkeliers) een winkel.
create table public.profiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('admin', 'shop')),
  shop_id     uuid,                         -- verplicht voor role = 'shop'
  full_name   text,
  created_at  timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where user_id = auth.uid() and role = 'admin');
$$;

create or replace function public.my_shop_id() returns uuid
language sql stable security definer set search_path = public as $$
  select shop_id from profiles where user_id = auth.uid() and role = 'shop';
$$;

-- ---------- Instellingen (1 rij) ---------------------------------------
create table public.site_settings (
  id                     int primary key default 1 check (id = 1),
  site_name              text not null default 'Windowshoppen',
  area_name              text not null default 'De Kempenaerstraat',
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
  colors                 jsonb not null default '{"primary":"#1f4d3a","accent":"#b3262e","gold":"#c9a24a","background":"#fbf6ec","text":"#2a2420"}',
  categories             text[] not null default array['Boeken & papier','Eten & drinken','Wonen & lifestyle','Kinderen & speelgoed','Bloemen & planten','Mode & sieraden','Beauty & verzorging','Overig'],
  privacy                jsonb not null default '{"controllerName":"","controllerAddress":"","contactEmail":"","kvk":"","retentionDays":30}',
  updated_at             timestamptz not null default now()
);
insert into public.site_settings (id) values (1) on conflict do nothing;

-- ---------- Winkels ----------------------------------------------------
create table public.shops (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  name                text not null,
  tagline             text not null default '',
  bio                 text not null default '',
  category            text not null default 'Overig',
  logo_url            text,                     -- Supabase Storage: bucket 'logos'
  cover_color         text not null default '#1f4d3a',
  emoji               text not null default '🎁',
  address             text not null default '',
  phone               text not null default '',
  email               text not null,            -- ontvangt reserveringsmails
  website             text not null default '',
  instagram           text not null default '',
  opening_hours       jsonb not null default '[]', -- [{day:0-6, open:"09:30", close:"18:00"}]
  map_x               numeric(5,2) not null default 50,  -- positie op geïllustreerde kaart (%)
  map_y               numeric(5,2) not null default 40,
  lat                 double precision,
  lng                 double precision,
  allow_reservations  boolean not null default true,
  active              boolean not null default true,
  created_at          timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_shop_fk foreign key (shop_id) references public.shops(id) on delete cascade;

-- ---------- Producten --------------------------------------------------
create table public.products (
  id           uuid primary key default gen_random_uuid(),
  shop_id      uuid not null references public.shops(id) on delete cascade,
  title        text not null check (char_length(title) between 2 and 80),
  description  text not null default '' check (char_length(description) <= 800),
  price_cents  int  not null check (price_cents > 0),
  images       text[] not null default '{}',    -- Supabase Storage: bucket 'products' (max 4)
  emoji        text not null default '🎁',
  category     text not null default 'Overig',
  tags         text[] not null default '{}',
  stock_mode   text not null default 'toggle' check (stock_mode in ('toggle','count')),
  stock        int  not null default 0 check (stock >= 0),
  in_stock     boolean not null default true,
  reservable   boolean not null default true,
  active       boolean not null default true,
  sort_order   bigint not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint max_four_images check (cardinality(images) <= 4)
);
create index products_shop_idx on public.products (shop_id, sort_order);

-- Maximaal N producten per winkel (N uit site_settings)
create or replace function public.enforce_product_limit() returns trigger
language plpgsql as $$
declare
  lim int;
  cnt int;
begin
  select max_products_per_shop into lim from site_settings where id = 1;
  select count(*) into cnt from products where shop_id = new.shop_id;
  if cnt >= lim then
    raise exception 'Maximaal % producten per winkel', lim using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger products_limit before insert on public.products
  for each row execute function public.enforce_product_limit();

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- ---------- Reserveringen ----------------------------------------------
-- Eén checkout (order_id) kan meerdere reserveringen opleveren: één per winkel.
create table public.reservations (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,                -- ophaalcode, bv. KS-4F7Q
  order_id        uuid not null,
  shop_id         uuid not null references public.shops(id) on delete cascade,
  customer_name   text not null,
  customer_email  text not null,
  customer_phone  text not null default '',
  pickup_date     date not null,
  note            text not null default '' check (char_length(note) <= 300),
  status          text not null default 'reserved' check (status in ('reserved','picked_up','expired','cancelled')),
  consent_at      timestamptz not null default now(),  -- moment van toestemming (AVG)
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null,
  picked_up_at    timestamptz
);
create index reservations_shop_idx on public.reservations (shop_id, status, pickup_date);

create table public.reservation_items (
  id              uuid primary key default gen_random_uuid(),
  reservation_id  uuid not null references public.reservations(id) on delete cascade,
  product_id      uuid references public.products(id) on delete set null,
  title           text not null,       -- kopie, zodat het overzicht klopt als het product wijzigt
  price_cents     int  not null,
  quantity        int  not null default 1 check (quantity between 1 and 9)
);

-- ---------- Mail-log ---------------------------------------------------
create table public.email_log (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null,
  to_email    text not null,
  subject     text not null,
  shop_id     uuid references public.shops(id) on delete cascade,
  provider_id text,                     -- id van Resend/Postmark
  created_at  timestamptz not null default now()
  -- bewust GEEN body: geen dubbele opslag van persoonsgegevens
);

-- ---------- Reserveren als één atomaire actie --------------------------
-- Aangeroepen vanuit een server action (met service role) zodat voorraad en
-- reserveringen altijd kloppen, ook als twee mensen tegelijk reserveren.
create or replace function public.create_reservations(
  p_name text, p_email text, p_phone text, p_pickup date, p_note text,
  p_items jsonb  -- [{"product_id": "...", "quantity": 1}]
) returns setof public.reservations
language plpgsql security definer set search_path = public as $$
declare
  v_order uuid := gen_random_uuid();
  v_hours int;
  v_expires timestamptz;
  it jsonb;
  prod products%rowtype;
  res reservations%rowtype;
  shop_res jsonb := '{}';
begin
  select reservation_hours into v_hours from site_settings where id = 1;
  v_expires := greatest((p_pickup + time '23:59') at time zone 'Europe/Amsterdam', now() + make_interval(hours => v_hours));

  for it in select * from jsonb_array_elements(p_items) loop
    select * into prod from products where id = (it->>'product_id')::uuid for update;
    if not found or not prod.active or not prod.reservable then
      raise exception 'Product niet beschikbaar';
    end if;
    if prod.stock_mode = 'count' then
      if prod.stock < (it->>'quantity')::int then raise exception 'Onvoldoende voorraad: %', prod.title; end if;
      update products set stock = stock - (it->>'quantity')::int where id = prod.id;
    elsif not prod.in_stock then
      raise exception 'Niet op voorraad: %', prod.title;
    end if;

    if shop_res ? prod.shop_id::text then
      select * into res from reservations where id = (shop_res->>prod.shop_id::text)::uuid;
    else
      insert into reservations (code, order_id, shop_id, customer_name, customer_email, customer_phone, pickup_date, note, expires_at)
      values ('KS-' || upper(substr(md5(random()::text), 1, 4)), v_order, prod.shop_id, p_name, p_email, coalesce(p_phone,''), p_pickup, coalesce(p_note,''), v_expires)
      returning * into res;
      shop_res := shop_res || jsonb_build_object(prod.shop_id::text, res.id);
    end if;

    insert into reservation_items (reservation_id, product_id, title, price_cents, quantity)
    values (res.id, prod.id, prod.title, prod.price_cents, (it->>'quantity')::int);
  end loop;

  return query select * from reservations where order_id = v_order;
end $$;

-- Voorraad terugzetten bij annuleren/verlopen
create or replace function public.release_stock() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.status in ('reserved','picked_up') and new.status in ('expired','cancelled') then
    update products p set stock = p.stock + ri.quantity
      from reservation_items ri
     where ri.reservation_id = new.id and ri.product_id = p.id and p.stock_mode = 'count';
  end if;
  if new.status = 'picked_up' and old.status <> 'picked_up' then
    new.picked_up_at := now();
  end if;
  return new;
end $$;

create trigger reservations_release before update of status on public.reservations
  for each row execute function public.release_stock();

-- ---------- Opschonen (AVG) --------------------------------------------
-- Plan met pg_cron (Database → Extensions → pg_cron):
--   select cron.schedule('expire-reservations', '*/10 * * * *', $$select public.expire_reservations()$$);
--   select cron.schedule('purge-personal-data', '0 3 * * *',   $$select public.purge_personal_data()$$);
create or replace function public.expire_reservations() returns void
language sql security definer set search_path = public as $$
  update reservations set status = 'expired' where status = 'reserved' and expires_at < now();
$$;

create or replace function public.purge_personal_data() returns void
language sql security definer set search_path = public as $$
  delete from reservations
   where status <> 'reserved'
     and created_at < now() - make_interval(days => (select (privacy->>'retentionDays')::int from site_settings where id = 1));
  delete from email_log
   where created_at < now() - make_interval(days => (select (privacy->>'retentionDays')::int from site_settings where id = 1));
$$;

-- ---------- Row Level Security -----------------------------------------
alter table public.profiles          enable row level security;
alter table public.site_settings     enable row level security;
alter table public.shops             enable row level security;
alter table public.products          enable row level security;
alter table public.reservations      enable row level security;
alter table public.reservation_items enable row level security;
alter table public.email_log         enable row level security;

-- Publiek leesbaar
create policy "settings: iedereen leest"   on public.site_settings for select using (true);
create policy "settings: admin schrijft"   on public.site_settings for update using (is_admin());

create policy "shops: publiek leest actieve" on public.shops for select using (active or is_admin() or id = my_shop_id());
create policy "shops: admin beheert"         on public.shops for all    using (is_admin()) with check (is_admin());
create policy "shops: winkelier wijzigt eigen" on public.shops for update using (id = my_shop_id()) with check (id = my_shop_id());
-- Let op: kolommen als name/slug/address/active wil je alleen door admin laten wijzigen.
-- Doe winkelier-updates daarom via een server action die alleen de toegestane velden doorgeeft.

create policy "products: publiek leest actieve" on public.products for select
  using ((active and exists (select 1 from shops s where s.id = shop_id and s.active)) or is_admin() or shop_id = my_shop_id());
create policy "products: winkelier beheert eigen" on public.products for all
  using (shop_id = my_shop_id() or is_admin()) with check (shop_id = my_shop_id() or is_admin());

-- Reserveringen: NOOIT publiek leesbaar. Aanmaken gaat via create_reservations() (server, service role).
create policy "reservations: winkelier ziet eigen" on public.reservations for select using (shop_id = my_shop_id() or is_admin());
create policy "reservations: winkelier zet status" on public.reservations for update using (shop_id = my_shop_id() or is_admin());
create policy "items: via reservering" on public.reservation_items for select
  using (exists (select 1 from reservations r where r.id = reservation_id and (r.shop_id = my_shop_id() or is_admin())));

create policy "profiles: eigen profiel" on public.profiles for select using (user_id = auth.uid() or is_admin());
create policy "profiles: admin beheert" on public.profiles for all using (is_admin()) with check (is_admin());

create policy "email_log: admin" on public.email_log for select using (is_admin());

-- ---------- Storage ----------------------------------------------------
-- Maak in Storage twee publieke buckets: 'products' en 'logos'.
-- Bestandspad: <shop_id>/<uuid>.jpg  → policy: winkelier mag alleen in eigen map schrijven.
insert into storage.buckets (id, name, public) values ('products','products', true), ('logos','logos', true)
  on conflict do nothing;

create policy "storage: publiek lezen" on storage.objects for select using (bucket_id in ('products','logos'));
create policy "storage: winkelier eigen map" on storage.objects for insert
  with check (bucket_id in ('products','logos') and ((storage.foldername(name))[1] = my_shop_id()::text or is_admin()));
create policy "storage: winkelier verwijdert eigen" on storage.objects for delete
  using (bucket_id in ('products','logos') and ((storage.foldername(name))[1] = my_shop_id()::text or is_admin()));
