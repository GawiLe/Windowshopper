"use client"

import Link from "next/link"
import { ArrowRight, CalendarCheck, Gift, ListChecks, MapPinned, Snowflake, Store } from "lucide-react"
import { useState } from "react"
import { useDB, useHydrated } from "@/lib/store"
import type { Product } from "@/lib/types"
import { visibleProducts, visibleShops } from "@/lib/selectors"
import { ProductCard, ProductRow } from "@/components/ProductCard"
import { Ornament, ProductImage, ShopLogo } from "@/components/Visuals"
import { SnowDrift } from "@/components/Snow"
import { ShopMap } from "@/components/ShopMap"
import { euro, formatDate } from "@/lib/utils"

export default function HomePage() {
  const db = useDB()
  const hydrated = useHydrated()
  const [seed] = useState(() => Math.random())
  const { settings } = db
  const shops = visibleShops(db)
  const products = visibleProducts(db)
  // uitgelicht: van elke winkel het eerste product
  const featured = shops
    .map((s) => products.filter((p) => p.shopId === s.id).sort((a, b) => a.sortOrder - b.sortOrder)[0])
    .filter(Boolean)
  // elke keer dat de pagina opent drie willekeurige producten, van verschillende winkels
  const collage = hydrated ? pickRandom(products, seed) : []
  const usedCats = settings.categories.filter((c) => products.some((p) => p.category === c))
  const words = settings.heroTitle.split(" ")
  const goldFrom = Math.max(0, words.length - 2)

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="starry relative overflow-hidden bg-primary text-white">
        <Snowflake aria-hidden className="pointer-events-none absolute -right-20 -top-16 h-80 w-80 text-white opacity-[0.05]" strokeWidth={0.6} />
        <Snowflake aria-hidden className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 text-white opacity-[0.04]" strokeWidth={0.6} />
        <div className="wrap relative grid items-center gap-10 pb-12 pt-10 md:pb-20 md:pt-16 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.25em] text-gold">
              <span className="gold-line w-8" />
              December in {settings.town}
            </p>
            <h1 className="font-display text-[38px] font-semibold leading-[1.05] sm:text-5xl lg:text-[64px]">
              {words.map((w, i) => (
                <span key={i} className={i >= goldFrom ? "gold-text" : undefined}>
                  {w}{" "}
                </span>
              ))}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">{settings.heroSubtitle}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/winkelstraat"
                className="flex h-14 items-center justify-center gap-2 rounded-xl bg-gold px-7 text-base font-semibold text-primary shadow-lg shadow-black/20 transition hover:brightness-105 active:scale-[0.98]"
              >
                <Gift className="h-5 w-5" /> Start met windowshoppen
              </Link>
              <Link
                href="/kaart"
                className="flex h-14 items-center justify-center gap-2 rounded-xl px-7 text-base font-semibold ring-1 ring-white/30 transition hover:bg-white/10 active:scale-[0.98]"
              >
                <MapPinned className="h-5 w-5" /> Bekijk de kaart
              </Link>
            </div>
            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-sm text-white/70">
              <div>
                <dt className="sr-only">Periode</dt>
                <dd>
                  {formatDate(settings.campaignStart, { day: "numeric", month: "long" })} t/m{" "}
                  {formatDate(settings.campaignEnd, { day: "numeric", month: "long" })}
                </dd>
              </div>
              <div>
                <dt className="sr-only">Winkels</dt>
                <dd>
                  <b className="text-white">{shops.length}</b> winkels
                </dd>
              </div>
              <div>
                <dt className="sr-only">Kadotips</dt>
                <dd>
                  <b className="text-white">{products.length}</b> kadotips
                </dd>
              </div>
            </dl>
          </div>

          {/* etalage-collage, alleen vanaf tablet */}
          <div className="relative hidden h-[440px] md:block">
            {settings.brand.mark && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.brand.mark} alt="" className="absolute left-1/2 top-1/2 w-[80%] -translate-x-1/2 -translate-y-1/2 opacity-10" />
            )}
            {collage.map((p, i) => {
              const shop = shops.find((s) => s.id === p.shopId)!
              const pos = [
                "left-[4%] top-[6%] -rotate-3 w-[46%]",
                "right-[2%] top-0 rotate-2 w-[44%]",
                "left-[28%] bottom-0 rotate-1 w-[46%]",
              ][i]
              return (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className={`absolute ${pos} overflow-hidden rounded-2xl bg-white p-2 text-ink shadow-2xl ring-1 ring-gold/50 transition hover:rotate-0 hover:scale-[1.03]`}
                >
                  <div className="aspect-[4/3] overflow-hidden rounded-xl">
                    <ProductImage product={p} color={shop.coverColor} />
                  </div>
                  <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2">
                    <span className="truncate text-sm font-medium">{p.title}</span>
                    <span className="shrink-0 font-display text-sm font-semibold text-primary">{euro(p.price)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
        <SnowDrift />
      </section>

      {/* ---------- Hoe werkt het ---------- */}
      <section className="wrap pt-8">
        <ol className="grid gap-3 sm:grid-cols-3 sm:gap-5">
          {[
            { icon: Gift, t: "Ontdek", d: "Bekijk de kadotips uit de etalages van de winkels." },
            { icon: ListChecks, t: "Verzamel", d: "Zet je favorieten op je eigen kadolijstje. Geen account nodig." },
            { icon: Store, t: "Ophalen", d: "Laat het eventueel reserveren en haal het op in de winkel." },
          ].map((s, i) => (
            <li key={s.t} className="flex items-start gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-gold">
                <s.icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <span>
                <span className="block font-semibold">
                  {i + 1}. {s.t}
                </span>
                <span className="block text-sm leading-snug text-stone-500">{s.d}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Categorieën ---------- */}
      {usedCats.length > 0 && (
        <section className="wrap mt-8">
          <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {usedCats.map((c) => (
              <Link
                key={c}
                href={`/winkelstraat?cat=${encodeURIComponent(c)}`}
                className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-black/5 transition hover:ring-gold"
              >
                {c}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---------- Uitgelicht ---------- */}
      <section className="wrap mt-10">
        <SectionTitle title="Uitgelichte kadotips" sub="Uit elke etalage één favoriet" href="/winkelstraat" />
        <div className="md:hidden">
          <ProductRow products={featured} shops={shops} />
        </div>
        <div className="hidden grid-cols-3 gap-5 md:grid lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} shop={shops.find((s) => s.id === p.shopId)} />
          ))}
        </div>
      </section>

      {/* ---------- Winkels ---------- */}
      <section className="wrap mt-14">
        <SectionTitle title="De winkels" sub={`${shops.length} winkels uit het winkelgebied doen mee`} href="/winkels" />
        <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 lg:grid-cols-8">
          {shops.map((s) => (
            <Link
              key={s.id}
              href={`/winkel/${s.slug}`}
              className="flex w-28 shrink-0 flex-col items-center gap-2 rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-black/5 transition hover:ring-gold sm:w-auto"
            >
              <ShopLogo shop={s} size={60} />
              <span className="line-clamp-2 text-xs font-medium leading-tight">{s.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Kaart ---------- */}
      <section className="wrap mt-14">
        <div className="grid overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 lg:grid-cols-[1fr_1.6fr]">
          <div className="flex flex-col justify-center p-6 lg:p-10">
            <Ornament className="mb-4 justify-start" />
            <h2 className="font-display text-3xl font-semibold text-primary">Wandel door het winkelgebied</h2>
            <p className="mt-3 text-stone-600">
              Op de kaart zie je precies waar elke winkel zit. Je lijstje zet de winkels automatisch in een handige looproute.
            </p>
            <Link href="/kaart" className="mt-6 inline-flex h-12 w-fit items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-white">
              Open de kaart <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative">
            <ShopMap shops={shops} compact className="h-64 sm:h-80 lg:h-full lg:min-h-[380px]" />
            <Link href="/kaart" aria-label="Open de kaart" className="absolute inset-0 z-[500]" />
          </div>
        </div>
      </section>

      {/* ---------- Reserveren ---------- */}
      <section className="wrap mt-14">
        <div className="relative grid gap-6 overflow-hidden rounded-3xl bg-primary p-6 text-white shadow-md sm:p-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <CalendarCheck aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 text-gold opacity-10" strokeWidth={1} />
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold">Gratis reserveren</p>
            <h2 className="mt-2 font-display text-3xl font-semibold">Even laten apart leggen?</h2>
            <p className="mt-3 max-w-xl leading-relaxed text-white/85">{settings.introText}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15">
            <p className="text-sm text-white/85">
              Reserveren is gratis en blijft <b className="text-white">{settings.reservationHours} uur</b> geldig. Je betaalt gewoon in de winkel.
            </p>
            <Link href="/lijstje" className="mt-4 flex h-12 items-center justify-center gap-2 rounded-xl bg-gold font-semibold text-primary">
              Naar mijn lijstje <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

function SectionTitle({ title, sub, href, linkText = "Bekijk alles" }: { title: string; sub?: string; href: string; linkText?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl font-semibold text-primary sm:text-3xl">{title}</h2>
        {sub && <p className="text-sm text-stone-500">{sub}</p>}
      </div>
      <Link href={href} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-accent">
        {linkText} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

/** Kies 3 producten in willekeurige volgorde, liefst van 3 verschillende winkels. */
function pickRandom(products: Product[], seed: number): Product[] {
  let x = Math.floor(seed * 2 ** 31) || 1
  const rand = () => ((x = (x * 48271) % 2147483647) / 2147483647)
  const shuffled = products.map((p) => ({ p, r: rand() })).sort((a, b) => a.r - b.r).map((e) => e.p)
  const out: Product[] = []
  for (const p of shuffled) if (out.length < 3 && !out.some((o) => o.shopId === p.shopId)) out.push(p)
  for (const p of shuffled) if (out.length < 3 && !out.includes(p)) out.push(p)
  return out
}
