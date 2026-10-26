"use client"

import Link from "next/link"
import { ArrowRight, Gift, ListChecks, MapPinned, Store } from "lucide-react"
import { useDB } from "@/lib/store"
import { visibleProducts, visibleShops } from "@/lib/selectors"
import { ProductRow } from "@/components/ProductCard"
import { Ornament, ShopLogo } from "@/components/Visuals"
import { SnowDrift } from "@/components/Snow"
import { StreetMap } from "@/components/StreetMap"
import { formatDate } from "@/lib/utils"

export default function HomePage() {
  const db = useDB()
  const { settings } = db
  const shops = visibleShops(db)
  const products = visibleProducts(db)
  // uitgelicht: van elke winkel het eerste product, daarna aangevuld
  const featured = shops
    .map((s) => products.filter((p) => p.shopId === s.id).sort((a, b) => a.sortOrder - b.sortOrder)[0])
    .filter(Boolean)
  const usedCats = settings.categories.filter((c) => products.some((p) => p.category === c))

  return (
    <>
      <section className="starry relative overflow-hidden bg-primary text-white">
        <div className="pointer-events-none absolute -right-16 -top-10 text-[180px] opacity-[0.07]">❄</div>
        <div className="pointer-events-none absolute -left-10 bottom-4 text-[120px] opacity-[0.06]">❄</div>
        <div className="relative mx-auto max-w-3xl px-5 pb-10 pt-10 text-center md:pb-16 md:pt-16">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-gold">
            ✦ December in {settings.town} ✦
          </p>
          <h1 className="font-display text-[34px] font-semibold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
            {settings.heroTitle.split(" ").map((w, i, arr) =>
              i >= arr.length - 2 ? (
                <span key={i} className="gold-text">
                  {w}{" "}
                </span>
              ) : (
                <span key={i}>{w} </span>
              ),
            )}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/85 sm:text-lg">{settings.heroSubtitle}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/winkelstraat"
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gold px-6 text-base font-bold text-ink shadow-lg shadow-black/20 active:scale-[0.98]"
            >
              <Gift className="h-5 w-5" /> Start met windowshoppen
            </Link>
            <Link
              href="/kaart"
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-white/10 px-6 text-base font-bold ring-1 ring-white/30 active:scale-[0.98]"
            >
              <MapPinned className="h-5 w-5" /> Wandel door de straat
            </Link>
          </div>
          <p className="mt-5 text-xs text-white/60">
            {formatDate(settings.campaignStart, { day: "numeric", month: "long" })} t/m{" "}
            {formatDate(settings.campaignEnd, { day: "numeric", month: "long" })} · {shops.length} winkels ·{" "}
            {products.length} kadotips
          </p>
        </div>
        <SnowDrift />
      </section>

      <section className="px-4 pt-6">
        <ol className="grid grid-cols-3 gap-2 text-center sm:gap-4">
          {[
            { icon: Gift, t: "Ontdek", d: "Kadotips van de winkels" },
            { icon: ListChecks, t: "Verzamel", d: "Op je eigen lijstje" },
            { icon: Store, t: "Ophalen", d: "Bij de winkel in het dorp" },
          ].map((s, i) => (
            <li key={s.t} className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
              <span className="mx-auto mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
                <s.icon className="h-5 w-5" />
              </span>
              <p className="text-sm font-bold">
                {i + 1}. {s.t}
              </p>
              <p className="text-[11px] leading-tight text-stone-500 sm:text-xs">{s.d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-center text-xs text-stone-500">
          Geen account nodig.{" "}
          <Link href="/hoe-werkt-het" className="font-semibold text-primary underline">
            Hoe werkt het?
          </Link>
        </p>
      </section>

      {usedCats.length > 0 && (
        <section className="mt-8 px-4">
          <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4">
            {usedCats.map((c) => (
              <Link
                key={c}
                href={`/winkelstraat?cat=${encodeURIComponent(c)}`}
                className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-black/5"
              >
                {c}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8 px-4">
        <SectionTitle title="Uitgelichte kadotips" href="/winkelstraat" />
        <ProductRow products={featured} shops={shops} />
      </section>

      <section className="mt-10 px-4">
        <SectionTitle title="De winkels" href="/winkels" />
        <div className="scrollbar-none -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
          {shops.map((s) => (
            <Link key={s.id} href={`/winkel/${s.slug}`} className="flex w-20 shrink-0 flex-col items-center gap-1.5 text-center">
              <ShopLogo shop={s} size={68} />
              <span className="line-clamp-2 text-xs font-semibold leading-tight">{s.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 px-4">
        <SectionTitle title="Wandel door de straat" href="/kaart" linkText="Open kaart" />
        <Link href="/kaart" className="block overflow-hidden rounded-3xl shadow-md ring-1 ring-black/5">
          <StreetMap shops={shops} compact />
        </Link>
      </section>

      <section className="mt-10 px-4">
        <div className="relative overflow-hidden rounded-3xl bg-accent p-6 text-white shadow-md">
          <span className="pointer-events-none absolute -right-4 -top-6 text-8xl opacity-15">🎁</span>
          <Ornament className="mb-3 justify-start" />
          <h2 className="font-display text-2xl font-semibold">Even laten apart leggen?</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/90">
            {settings.introText}
          </p>
          <p className="mt-3 text-sm font-semibold">
            Reserveren is gratis en blijft {settings.reservationHours} uur geldig. Je betaalt gewoon in de winkel.
          </p>
          <Link href="/lijstje" className="mt-4 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-5 font-bold text-accent">
            Naar mijn lijstje <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  )
}

function SectionTitle({ title, href, linkText = "Bekijk alles" }: { title: string; href: string; linkText?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <h2 className="font-display text-2xl font-semibold text-primary">{title}</h2>
      <Link href={href} className="flex items-center gap-1 text-sm font-bold text-accent">
        {linkText} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
