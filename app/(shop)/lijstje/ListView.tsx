"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CalendarCheck, Check, Copy, Mail, MapPin, Minus, Plus, Printer, Share2, Trash2 } from "lucide-react"
import { decodeList, encodeList, listActions, useDB, useHydrated, useList } from "@/lib/store"
import { listEmailBody } from "@/lib/emails"
import { ProductImage, ShopLogo } from "@/components/Visuals"
import { toast } from "@/components/Toast"
import { cn, euro, isAvailable, openToday } from "@/lib/utils"
import type { ListEntry } from "@/lib/types"

export function ListView() {
  const db = useDB()
  const list = useList()
  const hydrated = useHydrated()
  const params = useSearchParams()
  const router = useRouter()
  const shared = params.get("l")
  const sharedEntries = useMemo(() => (shared ? decodeList(shared) : null), [shared])

  if (!hydrated) return <div className="h-[60vh]" />

  // Gedeelde link geopend: lijstje overnemen of samenvoegen
  if (sharedEntries && encodeList(sharedEntries) !== encodeList(list)) {
    const valid = sharedEntries.filter((e) => db.products.some((p) => p.id === e.productId))
    return (
      <div className="px-4 pt-8">
        <div className="rounded-3xl bg-white p-6 text-center shadow-md ring-1 ring-black/5">
          <p className="text-5xl">💌</p>
          <h1 className="mt-3 font-display text-2xl font-semibold text-primary">Een kadolijstje voor jou</h1>
          <p className="mt-2 text-sm text-stone-600">
            Deze link bevat een lijstje met {valid.length} kado{valid.length === 1 ? "" : "'s"}. Wil je het in deze browser openen?
          </p>
          <div className="mt-5 grid gap-2">
            <button
              onClick={() => {
                listActions.replace(valid)
                router.replace("/lijstje")
              }}
              className="h-12 rounded-xl bg-primary font-bold text-white"
            >
              {list.length ? "Vervang mijn huidige lijstje" : "Open dit lijstje"}
            </button>
            {list.length > 0 && (
              <button
                onClick={() => {
                  listActions.merge(valid)
                  router.replace("/lijstje")
                }}
                className="h-12 rounded-xl bg-gold-soft font-bold text-ink"
              >
                Voeg toe aan mijn lijstje ({list.length})
              </button>
            )}
            <button onClick={() => router.replace("/lijstje")} className="h-11 text-sm font-semibold text-stone-500">
              Nee, bedankt
            </button>
          </div>
        </div>
      </div>
    )
  }

  const items = list
    .map((e) => {
      const product = db.products.find((p) => p.id === e.productId)
      const shop = product && db.shops.find((s) => s.id === product.shopId)
      return product && shop ? { entry: e, product, shop } : null
    })
    .filter((x): x is NonNullable<typeof x> => !!x)

  if (!items.length) {
    return (
      <div className="px-4 pt-10 text-center">
        <p className="text-6xl">🎄</p>
        <h1 className="mt-4 font-display text-3xl font-semibold text-primary">Je lijstje is nog leeg</h1>
        <p className="mx-auto mt-2 max-w-sm text-stone-600">
          Tik op de <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white align-middle text-accent shadow"><Plus className="h-4 w-4" /></span> bij een kado om het op je lijstje te zetten. Geen account nodig!
        </p>
        <Link href="/winkelstraat" className="mt-6 inline-flex h-14 items-center rounded-2xl bg-accent px-6 font-bold text-white shadow-md">
          Ga windowshoppen
        </Link>
      </div>
    )
  }

  // groeperen per winkel, in volgorde van de straat = handige looproute
  const groups = [...new Set(items.map((i) => i.shop.id))]
    .map((id) => items.filter((i) => i.shop.id === id))
    .sort((a, b) => a[0].shop.mapX - b[0].shop.mapX)

  const done = items.filter((i) => i.entry.checked).length
  const total = items.reduce((s, i) => s + i.product.price * i.entry.qty, 0)
  const open = items.filter((i) => !i.entry.checked)
  const reservable = open.filter(
    (i) => db.settings.reservationsEnabled && i.shop.allowReservations && i.product.reservable && isAvailable(i.product),
  )

  const shareUrl = () => `${window.location.origin}/lijstje?l=${encodeList(list)}`
  const lines = () =>
    groups.flatMap((g) => [
      `\n${g[0].shop.name} (${g[0].shop.address})`,
      ...g.map((i) => `${i.entry.checked ? "✔" : "☐"} ${i.entry.qty > 1 ? `${i.entry.qty}× ` : ""}${i.product.title} – ${euro(i.product.price)}`),
    ])

  const mailSelf = () => {
    const body = listEmailBody(db.settings, shareUrl(), lines())
    window.location.assign(`mailto:?subject=${encodeURIComponent(`Mijn kadolijstje – ${db.settings.areaName}`)}&body=${encodeURIComponent(body)}`)
  }
  const shareNative = async () => {
    const url = shareUrl()
    try {
      if (navigator.share) await navigator.share({ title: "Mijn kadolijstje", text: `Mijn kadolijstje van ${db.settings.areaName} 🎁`, url })
      else window.open(`https://wa.me/?text=${encodeURIComponent(`Mijn kadolijstje 🎁 ${url}`)}`, "_blank")
    } catch {
      /* geannuleerd */
    }
  }
  const copy = async () => {
    await navigator.clipboard.writeText(shareUrl())
    toast("Link gekopieerd – bewaar hem goed!")
  }

  return (
    <div className="px-4 pt-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">Mijn kadolijstje</h1>
          <p className="text-sm text-stone-500">Je looproute door {groups.length} winkel{groups.length === 1 ? "" : "s"}</p>
        </div>
        <button
          onClick={() => confirm("Weet je zeker dat je je hele lijstje wilt wissen?") && listActions.clear()}
          className="no-print text-xs font-semibold text-stone-400 underline"
        >
          Wis lijstje
        </button>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="flex justify-between text-sm font-semibold">
          <span>
            {done} van {items.length} afgevinkt
          </span>
          <span className="text-primary">{euro(total)}</span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-stone-100">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-gold transition-all" style={{ width: `${(done / items.length) * 100}%` }} />
        </div>
        {done === items.length && <p className="mt-2 text-sm font-semibold text-primary">🎉 Alles binnen! Fijne feestdagen!</p>}
      </div>

      <div className="mt-5 space-y-5">
        {groups.map((g, idx) => {
          const shop = g[0].shop
          const today = openToday(shop.openingHours)
          return (
            <section key={shop.id} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
              <Link href={`/winkel/${shop.slug}`} className="flex items-center gap-3 border-b border-stone-100 p-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">{idx + 1}</span>
                <ShopLogo shop={shop} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{shop.name}</span>
                  <span className="flex items-center gap-1 truncate text-xs text-stone-500">
                    <MapPin className="h-3 w-3" /> {shop.address} · {today ? `open ${today}` : "vandaag dicht"}
                  </span>
                </span>
              </Link>
              <ul>
                {g.map(({ entry, product }) => (
                  <ListRow key={product.id} entry={entry} product={product} color={shop.coverColor} />
                ))}
              </ul>
            </section>
          )
        })}
      </div>

      {reservable.length > 0 && (
        <div className="no-print mt-6 rounded-3xl bg-accent p-5 text-white shadow-md">
          <p className="font-display text-xl font-semibold">Laat het apart leggen 🎁</p>
          <p className="mt-1 text-sm text-white/90">
            {reservable.length} kado{reservable.length === 1 ? "" : "'s"} kun je gratis laten reserveren. De winkel legt het {db.settings.reservationHours} uur voor je klaar; je betaalt in de winkel.
          </p>
          <Link href="/reserveren" className="mt-4 flex h-14 items-center justify-center gap-2 rounded-2xl bg-white text-base font-bold text-accent">
            <CalendarCheck className="h-5 w-5" /> Reserveren en ophalen
          </Link>
        </div>
      )}

      <div className="no-print mt-6 rounded-3xl bg-gold-soft p-5">
        <p className="font-display text-xl font-semibold">Bewaar of deel je lijstje</p>
        <p className="mt-1 text-sm text-stone-600">
          Je lijstje wordt automatisch in deze browser bewaard. Wil je het op een andere telefoon of later terugvinden? Stuur jezelf de link.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <ShareBtn icon={Mail} onClick={mailSelf} label="Mail naar mezelf" primary />
          <ShareBtn icon={Share2} onClick={shareNative} label="Delen / WhatsApp" />
          <ShareBtn icon={Copy} onClick={copy} label="Kopieer link" />
          <ShareBtn icon={Printer} onClick={() => window.print()} label="Print / PDF" />
        </div>
        <p className="mt-3 text-xs text-stone-500">
          Je e-mailadres wordt hiervoor niet door ons opgeslagen: de mail wordt verstuurd vanuit je eigen mail-app.{" "}
          <Link href="/privacy" className="underline">Privacy</Link>
        </p>
      </div>
    </div>
  )
}

function ListRow({ entry, product, color }: { entry: ListEntry; product: import("@/lib/types").Product; color: string }) {
  const available = isAvailable(product)
  return (
    <li className={cn("flex items-center gap-3 border-b border-stone-100 p-3 last:border-0", entry.checked && "bg-primary-soft/50")}>
      <button
        onClick={() => {
          listActions.check(product.id, !entry.checked)
          if (!entry.checked) toast("✔ Afgevinkt!")
        }}
        aria-label={entry.checked ? "Markeer als niet gekocht" : "Afvinken: gekocht"}
        aria-pressed={entry.checked}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition",
          entry.checked ? "border-primary bg-primary text-white" : "border-stone-300 bg-white",
        )}
      >
        {entry.checked && <Check className="animate-pop h-5 w-5" />}
      </button>
      <Link href={`/product/${product.id}`} className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
        <ProductImage product={product} color={color} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/product/${product.id}`} className={cn("line-clamp-2 text-sm font-bold leading-snug", entry.checked && "text-stone-400 line-through")}>
          {product.title}
        </Link>
        <p className="text-sm text-primary">
          {euro(product.price)}
          {!available && <span className="ml-2 text-xs font-semibold text-stone-500">· uitverkocht</span>}
        </p>
      </div>
      <div className="no-print flex flex-col items-end gap-1">
        <div className="flex items-center rounded-full bg-stone-100">
          <button onClick={() => listActions.qty(product.id, entry.qty - 1)} className="flex h-8 w-8 items-center justify-center" aria-label="Minder">
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-4 text-center text-sm font-bold">{entry.qty}</span>
          <button onClick={() => listActions.qty(product.id, entry.qty + 1)} className="flex h-8 w-8 items-center justify-center" aria-label="Meer">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <button onClick={() => listActions.remove(product.id)} className="flex items-center gap-1 p-1 text-xs text-stone-400" aria-label="Verwijderen">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  )
}

function ShareBtn({ icon: Icon, label, onClick, primary }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-bold shadow-sm",
        primary ? "bg-primary text-white" : "bg-white text-ink ring-1 ring-black/5",
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  )
}
