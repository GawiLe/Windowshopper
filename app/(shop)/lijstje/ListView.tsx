"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  CalendarCheck, CalendarX, Check, Copy, Gift, Mail, MailOpen, MapPin, Minus, PartyPopper, Plus, Printer, Share2, Trash2,
} from "lucide-react"
import { decodeList, encodeList, listActions, useDB, useHydrated, useList } from "@/lib/store"
import { reserveStatus } from "@/lib/selectors"
import { listEmailBody } from "@/lib/emails"
import { IconBadge, ProductImage, ShopLogo } from "@/components/Visuals"
import { toast } from "@/components/Toast"
import { cn, euro, openToday } from "@/lib/utils"
import { houseNumber } from "@/lib/geo"
import type { ListEntry, Product } from "@/lib/types"

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
      <div className="wrap pt-8">
        <div className="max-w-lg rounded-3xl bg-white p-6 shadow-md ring-1 ring-black/5 sm:p-8">
          <IconBadge icon={MailOpen} className="mx-0" />
          <h1 className="mt-4 font-display text-2xl font-semibold text-primary">Een kadolijstje voor jou</h1>
          <p className="mt-2 text-sm text-stone-600">
            Deze link bevat een lijstje met {valid.length} kado{valid.length === 1 ? "" : "'s"}. Wil je het in deze browser openen?
          </p>
          <div className="mt-5 grid gap-2">
            <button
              onClick={() => {
                listActions.replace(valid)
                router.replace("/lijstje")
              }}
              className="h-12 rounded-xl bg-primary font-semibold text-white"
            >
              {list.length ? "Vervang mijn huidige lijstje" : "Open dit lijstje"}
            </button>
            {list.length > 0 && (
              <button
                onClick={() => {
                  listActions.merge(valid)
                  router.replace("/lijstje")
                }}
                className="h-12 rounded-xl bg-gold-soft font-semibold text-ink"
              >
                Voeg toe aan mijn lijstje ({list.length})
              </button>
            )}
            <button onClick={() => router.replace("/lijstje")} className="h-11 text-sm font-medium text-stone-500">
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
      return product && shop ? { entry: e, product, shop, status: reserveStatus(db, product, shop) } : null
    })
    .filter((x): x is NonNullable<typeof x> => !!x)

  if (!items.length) {
    return (
      <div className="wrap pt-10">
        <div className="max-w-lg">
          <IconBadge icon={Gift} size={72} className="mx-0" />
          <h1 className="mt-5 font-display text-3xl font-semibold text-primary sm:text-4xl">Je lijstje is nog leeg</h1>
          <p className="mt-2 text-stone-600">
            Tik op de{" "}
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white align-middle text-accent shadow">
              <Plus className="h-4 w-4" />
            </span>{" "}
            bij een kado om het op je lijstje te zetten. Je hebt geen account nodig.
          </p>
          <Link href="/winkelstraat" className="mt-6 inline-flex h-14 items-center rounded-xl bg-primary px-6 font-semibold text-white shadow-md">
            Ga windowshoppen
          </Link>
        </div>
      </div>
    )
  }

  // groeperen per winkel, in volgorde van de straat = handige looproute
  const groups = [...new Set(items.map((i) => i.shop.id))]
    .map((id) => items.filter((i) => i.shop.id === id))
    .sort((a, b) => houseNumber(a[0].shop.address) - houseNumber(b[0].shop.address))

  const done = items.filter((i) => i.entry.checked).length
  const total = items.reduce((s, i) => s + i.product.price * i.entry.qty, 0)
  const open = items.filter((i) => !i.entry.checked)
  const reservable = open.filter((i) => i.status.ok)
  const notReservable = open.filter((i) => !i.status.ok)

  const shareUrl = () => `${window.location.origin}/lijstje?l=${encodeList(list)}`
  const lines = () =>
    groups.flatMap((g) => [
      `\n${g[0].shop.name} (${g[0].shop.address})`,
      ...g.map((i) => `${i.entry.checked ? "[x]" : "[ ]"} ${i.entry.qty > 1 ? `${i.entry.qty}× ` : ""}${i.product.title} – ${euro(i.product.price)}`),
    ])

  const mailSelf = () => {
    const body = listEmailBody(db.settings, shareUrl(), lines())
    window.location.assign(`mailto:?subject=${encodeURIComponent(`Mijn kadolijstje – ${db.settings.areaName}`)}&body=${encodeURIComponent(body)}`)
  }
  const shareNative = async () => {
    const url = shareUrl()
    try {
      if (navigator.share) await navigator.share({ title: "Mijn kadolijstje", text: `Mijn kadolijstje van ${db.settings.areaName}`, url })
      else window.open(`https://wa.me/?text=${encodeURIComponent(`Mijn kadolijstje: ${url}`)}`, "_blank")
    } catch {
      /* geannuleerd */
    }
  }
  const copy = async () => {
    await navigator.clipboard.writeText(shareUrl())
    toast("Link gekopieerd – bewaar hem goed")
  }

  return (
    <div className="wrap pt-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary sm:text-4xl">Mijn kadolijstje</h1>
          <p className="text-sm text-stone-500">
            Je looproute langs {groups.length} winkel{groups.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          onClick={() => confirm("Weet je zeker dat je je hele lijstje wilt wissen?") && listActions.clear()}
          className="no-print text-xs font-medium text-stone-400 underline"
        >
          Wis lijstje
        </button>
      </div>

      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        {/* ---------- lijst ---------- */}
        <div className="space-y-5">
          {groups.map((g, idx) => {
            const shop = g[0].shop
            const today = openToday(shop.openingHours)
            return (
              <section key={shop.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                <Link href={`/winkel/${shop.slug}`} className="flex items-center gap-3 border-b border-stone-100 p-3.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-white">
                    {idx + 1}
                  </span>
                  <ShopLogo shop={shop} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{shop.name}</span>
                    <span className="flex items-center gap-1 truncate text-xs text-stone-500">
                      <MapPin className="h-3 w-3" /> {shop.address} · {today ? `open ${today}` : "vandaag dicht"}
                    </span>
                  </span>
                  {!shop.allowReservations && (
                    <span className="hidden shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-600 sm:inline">
                      Geen reserveringen
                    </span>
                  )}
                </Link>
                <ul>
                  {g.map(({ entry, product, status }) => (
                    <ListRow key={product.id} entry={entry} product={product} color={shop.coverColor} status={status} />
                  ))}
                </ul>
              </section>
            )
          })}
        </div>

        {/* ---------- zijkolom ---------- */}
        <aside className="no-print space-y-4 lg:sticky lg:top-24">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex justify-between text-sm font-medium">
              <span>
                {done} van {items.length} afgevinkt
              </span>
              <span className="font-display text-base font-semibold text-primary">{euro(total)}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-gold transition-all" style={{ width: `${(done / items.length) * 100}%` }} />
            </div>
            {done === items.length && (
              <p className="mt-3 flex items-center gap-2 text-sm font-medium text-primary">
                <PartyPopper className="h-4 w-4" /> Alles binnen. Fijne feestdagen!
              </p>
            )}
          </div>

          {open.length > 0 && (
            <div className="overflow-hidden rounded-2xl bg-primary text-white shadow-md">
              <div className="p-5">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">Gratis reserveren</p>
                <p className="mt-1 font-display text-xl font-semibold">Laat het apart leggen</p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 shrink-0 text-gold" />
                    <span>
                      <b>{reservable.length}</b> kado{reservable.length === 1 ? "" : "'s"} kun{reservable.length === 1 ? "" : "nen"} gereserveerd worden
                    </span>
                  </li>
                  {notReservable.length > 0 && (
                    <li className="flex items-center gap-2 text-white/75">
                      <CalendarX className="h-4 w-4 shrink-0" />
                      <span>
                        <b>{notReservable.length}</b> alleen in de winkel te koop
                      </span>
                    </li>
                  )}
                </ul>
                <p className="mt-3 text-xs text-white/70">
                  De winkel legt het {db.settings.reservationHours} uur voor je klaar. Je betaalt in de winkel.
                </p>
              </div>
              {reservable.length > 0 ? (
                <Link href="/reserveren" className="flex h-14 items-center justify-center gap-2 bg-gold text-base font-semibold text-primary">
                  <CalendarCheck className="h-5 w-5" /> Reserveren en ophalen
                </Link>
              ) : (
                <p className="bg-white/10 px-5 py-3 text-sm text-white/80">Niets op je lijstje kan op dit moment gereserveerd worden.</p>
              )}
            </div>
          )}

          <div className="rounded-2xl bg-gold-soft p-5">
            <p className="font-display text-lg font-semibold">Bewaar of deel je lijstje</p>
            <p className="mt-1 text-sm text-stone-600">
              Je lijstje blijft in deze browser bewaard. Op een andere telefoon of later terugvinden? Stuur jezelf de link.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <ShareBtn icon={Mail} onClick={mailSelf} label="Mail naar mezelf" primary />
              <ShareBtn icon={Share2} onClick={shareNative} label="Delen" />
              <ShareBtn icon={Copy} onClick={copy} label="Kopieer link" />
              <ShareBtn icon={Printer} onClick={() => window.print()} label="Print / PDF" />
            </div>
            <p className="mt-3 text-xs text-stone-500">
              Je e-mailadres wordt hiervoor niet door ons opgeslagen: de mail gaat via je eigen mail-app.{" "}
              <Link href="/privacy" className="underline">
                Privacy
              </Link>
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

function ListRow({
  entry,
  product,
  color,
  status,
}: {
  entry: ListEntry
  product: Product
  color: string
  status: { ok: true } | { ok: false; reason: string }
}) {
  return (
    <li className={cn("flex items-start gap-3 border-b border-stone-100 p-3 last:border-0 sm:items-center", entry.checked && "bg-primary-soft/50")}>
      <button
        onClick={() => {
          listActions.check(product.id, !entry.checked)
          if (!entry.checked) toast("Afgevinkt")
        }}
        aria-label={entry.checked ? "Markeer als niet gekocht" : "Afvinken: gekocht"}
        aria-pressed={entry.checked}
        className={cn(
          "mt-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition sm:mt-0",
          entry.checked ? "border-primary bg-primary text-white" : "border-stone-300 bg-white hover:border-primary",
        )}
      >
        {entry.checked && <Check className="animate-pop h-5 w-5" />}
      </button>
      <Link href={`/product/${product.id}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
        <ProductImage product={product} color={color} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/product/${product.id}`} className={cn("line-clamp-2 text-[15px] font-medium leading-snug", entry.checked && "text-stone-400 line-through")}>
          {product.title}
        </Link>
        <p className="text-sm font-medium text-primary">{euro(product.price)}</p>
        {!entry.checked &&
          (status.ok ? (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">
              <CalendarCheck className="h-3 w-3" /> Te reserveren
            </span>
          ) : (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
              <CalendarX className="h-3 w-3" /> {status.reason}
            </span>
          ))}
      </div>
      <div className="no-print flex flex-col items-end gap-1">
        <div className="flex items-center rounded-full bg-stone-100">
          <button onClick={() => listActions.qty(product.id, entry.qty - 1)} className="flex h-8 w-8 items-center justify-center" aria-label="Minder">
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-4 text-center text-sm font-semibold">{entry.qty}</span>
          <button onClick={() => listActions.qty(product.id, entry.qty + 1)} className="flex h-8 w-8 items-center justify-center" aria-label="Meer">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <button onClick={() => listActions.remove(product.id)} className="flex items-center gap-1 p-1 text-xs text-stone-400 hover:text-accent" aria-label="Verwijderen">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  )
}

function ShareBtn({
  icon: Icon,
  label,
  onClick,
  primary,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-medium shadow-sm",
        primary ? "bg-primary text-white" : "bg-white text-ink ring-1 ring-black/5",
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  )
}
