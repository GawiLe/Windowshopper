"use client"

import Link from "next/link"
import { useState } from "react"
import { AlertTriangle, ArrowLeft, CalendarX, CheckCircle2, Lock } from "lucide-react"
import { actions, encodeList, useDB, useHydrated, useList } from "@/lib/store"
import { IconBadge, ShopLogo } from "@/components/Visuals"
import { reserveStatus } from "@/lib/selectors"
import { cn, euro, formatDate, formatDateTime, isOpenOn, isValidEmail, todayISO } from "@/lib/utils"
import type { Reservation } from "@/lib/types"

export default function ReservePage() {
  const db = useDB()
  const list = useList()
  const hydrated = useHydrated()
  const { settings } = db

  const onList = list
    .filter((e) => !e.checked)
    .map((e) => {
      const product = db.products.find((p) => p.id === e.productId)
      const shop = product && db.shops.find((s) => s.id === product.shopId)
      return product && shop ? { entry: e, product, shop, status: reserveStatus(db, product, shop) } : null
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
  const candidates = onList.filter((x) => x.status.ok)
  const notPossible = onList.filter((x) => !x.status.ok)

  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [form, setForm] = useState({ name: "", email: "", phone: "", note: "", pickupDate: "" })
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [done, setDone] = useState<Reservation[] | null>(null)

  if (!hydrated) return <div className="h-[60vh]" />

  if (done) return <Confirmation reservations={done} />

  if (!candidates.length) {
    return (
      <div className="wrap pt-10">
        <div className="max-w-lg">
          <IconBadge icon={CalendarX} className="mx-0" />
          <h1 className="mt-4 font-display text-2xl font-semibold text-primary">Niets om te reserveren</h1>
          <p className="mt-2 text-stone-600">Zet eerst kado&apos;s op je lijstje die gereserveerd kunnen worden.</p>
          <Link href="/lijstje" className="mt-5 inline-block font-semibold text-accent underline">
            Naar mijn lijstje
          </Link>
        </div>
      </div>
    )
  }

  const chosen = candidates.filter((c) => !excluded.has(c.product.id))
  const shopsChosen = [...new Map(chosen.map((c) => [c.shop.id, c.shop])).values()]
  const dates = [0, 1, 2].map((d) => todayISO(d)).filter((d) => d <= settings.campaignEnd)
  const closedShops = form.pickupDate ? shopsChosen.filter((s) => !isOpenOn(s.openingHours, form.pickupDate)) : []

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const err: Record<string, string> = {}
    if (form.name.trim().length < 2) err.name = "Vul je naam in"
    if (!isValidEmail(form.email)) err.email = "Vul een geldig e-mailadres in"
    if (form.phone && !/^[0-9+\-\s()]{8,}$/.test(form.phone)) err.phone = "Dit lijkt geen geldig telefoonnummer"
    if (!form.pickupDate) err.pickupDate = "Kies een ophaaldag"
    if (!consent) err.consent = "Geef toestemming om je gegevens met de winkel(s) te delen"
    if (!chosen.length) err.items = "Kies minimaal één kado"
    setErrors(err)
    if (Object.keys(err).length) return

    const reservations = actions.createReservations({
      ...form,
      items: chosen.map((c) => ({ productId: c.product.id, quantity: c.entry.qty })),
      listUrl: `${window.location.origin}/lijstje?l=${encodeList(list)}`,
    })
    window.scrollTo({ top: 0 })
    setDone(reservations)
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <form onSubmit={submit} className="wrap max-w-3xl pt-6 lg:ml-[max(0px,calc((100vw-82rem)/2))]" noValidate>
      <Link href="/lijstje" className="inline-flex items-center gap-1 text-sm font-semibold text-stone-500">
        <ArrowLeft className="h-4 w-4" /> Terug naar lijstje
      </Link>
      <h1 className="mt-2 font-display text-3xl font-semibold text-primary">Reserveren</h1>
      <p className="text-sm text-stone-600">
        Gratis en vrijblijvend. De winkel legt je kado {settings.reservationHours} uur apart; je rekent af in de winkel.
      </p>

      <Step n={1} title="Wat wil je laten reserveren?">
        <ul className="divide-y divide-stone-100">
          {candidates.map(({ entry, product, shop }) => {
            const on = !excluded.has(product.id)
            return (
              <li key={product.id}>
                <label className="flex cursor-pointer items-center gap-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() =>
                      setExcluded((s) => {
                        const n = new Set(s)
                        if (on) n.add(product.id)
                        else n.delete(product.id)
                        return n
                      })
                    }
                    className="h-5 w-5 shrink-0 accent-[var(--c-primary)]"
                  />
                  <ShopLogo shop={shop} size={32} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                      {entry.qty > 1 && `${entry.qty}× `}
                      {product.title}
                    </span>
                    <span className="block text-xs text-stone-500">{shop.name}</span>
                  </span>
                  <span className="text-sm font-semibold">{euro(product.price * entry.qty)}</span>
                </label>
              </li>
            )
          })}
        </ul>
        {errors.items && <ErrorText>{errors.items}</ErrorText>}
        {notPossible.length > 0 && (
          <div className="mt-3 rounded-xl bg-stone-50 p-3">
            <p className="flex items-center gap-1.5 text-sm font-medium text-stone-600">
              <CalendarX className="h-4 w-4" /> Niet te reserveren (wel in de winkel te koop)
            </p>
            <ul className="mt-2 space-y-1.5">
              {notPossible.map(({ product, shop, status }) => (
                <li key={product.id} className="flex items-center gap-2 text-sm text-stone-500">
                  <ShopLogo shop={shop} size={24} />
                  <span className="min-w-0 flex-1 truncate">{product.title}</span>
                  <span className="shrink-0 text-xs">{!status.ok && status.reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Step>

      <Step n={2} title="Wanneer kom je ophalen?">
        <div className="grid grid-cols-3 gap-2">
          {dates.map((d, i) => (
            <button
              type="button"
              key={d}
              onClick={() => setForm((f) => ({ ...f, pickupDate: d }))}
              className={cn(
                "rounded-2xl p-3 text-center ring-1 transition",
                form.pickupDate === d ? "bg-primary text-white ring-primary" : "bg-white ring-stone-200",
              )}
            >
              <span className="block text-xs font-semibold uppercase opacity-75">{["Vandaag", "Morgen", "Overmorgen"][i]}</span>
              <span className="block text-sm font-bold">{formatDate(d, { weekday: "short", day: "numeric", month: "short" })}</span>
            </button>
          ))}
        </div>
        {errors.pickupDate && <ErrorText>{errors.pickupDate}</ErrorText>}
        {closedShops.length > 0 && (
          <p className="mt-3 flex gap-2 rounded-xl bg-gold-soft p-3 text-sm">
            <AlertTriangle className="h-5 w-5 shrink-0 text-[#7a5c17]" />
            <span>
              Let op: {closedShops.map((s) => s.name).join(", ")} {closedShops.length === 1 ? "is" : "zijn"} op deze dag gesloten.
              Kies een andere dag of haal het daar later op.
            </span>
          </p>
        )}
      </Step>

      <Step n={3} title="Je gegevens">
        <div className="space-y-3">
          <Field label="Naam" error={errors.name}>
            <input value={form.name} onChange={set("name")} autoComplete="name" className={inputCls} />
          </Field>
          <Field label="E-mailadres" hint="Voor je bevestiging met ophaalcode" error={errors.email}>
            <input type="email" inputMode="email" value={form.email} onChange={set("email")} autoComplete="email" className={inputCls} />
          </Field>
          <Field label="Telefoonnummer (optioneel)" hint="Handig als de winkel je even wil bellen" error={errors.phone}>
            <input type="tel" inputMode="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" className={inputCls} />
          </Field>
          <Field label="Opmerking (optioneel)">
            <textarea value={form.note} onChange={set("note")} rows={2} maxLength={300} className={cn(inputCls, "h-auto py-3")} placeholder="Bijv. graag als cadeau inpakken" />
          </Field>
        </div>
      </Step>

      <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <label className="flex cursor-pointer gap-3 text-sm">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--c-primary)]" />
          <span>
            Ik geef toestemming dat mijn naam, e-mail en telefoonnummer worden gedeeld met{" "}
            <b>{shopsChosen.map((s) => s.name).join(", ") || "de gekozen winkel(s)"}</b> om mijn reservering af te handelen. Mijn
            gegevens worden na {settings.privacy.retentionDays} dagen verwijderd. Lees de{" "}
            <Link href="/privacy" target="_blank" className="font-semibold text-primary underline">
              privacyverklaring
            </Link>
            .
          </span>
        </label>
        {errors.consent && <ErrorText>{errors.consent}</ErrorText>}
      </div>

      <button type="submit" className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent text-base font-bold text-white shadow-lg active:scale-[0.98]">
        <Lock className="h-4 w-4" /> Reserveer {chosen.length} kado{chosen.length === 1 ? "" : "'s"} bij {shopsChosen.length} winkel
        {shopsChosen.length === 1 ? "" : "s"}
      </button>
      <p className="mt-2 text-center text-xs text-stone-500">Je betaalt niets online. Gewoon afrekenen bij het ophalen.</p>
    </form>
  )
}

const inputCls =
  "h-12 w-full rounded-xl border border-stone-200 bg-white px-4 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <h2 className="mb-3 flex items-center gap-2 font-bold">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs text-ink">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      {hint && <span className="block text-xs text-stone-500">{hint}</span>}
      <span className="mt-1 block">{children}</span>
      {error && <ErrorText>{error}</ErrorText>}
    </label>
  )
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <span className="mt-1 block text-sm font-semibold text-accent">{children}</span>
}

function Confirmation({ reservations }: { reservations: Reservation[] }) {
  const db = useDB()
  const first = reservations[0]
  return (
    <div className="wrap max-w-3xl pt-8 lg:ml-[max(0px,calc((100vw-82rem)/2))]">
      <div>
        <CheckCircle2 className="h-14 w-14 text-primary" strokeWidth={1.5} />
        <h1 className="mt-3 font-display text-3xl font-semibold text-primary">Gereserveerd</h1>
        <p className="mt-2 text-stone-600">
          De winkels hebben een mail ontvangen. Je bevestiging is gestuurd naar <b>{first.customerEmail}</b>.
        </p>
        <p className="mt-1 text-sm font-semibold">
          Ophalen op {formatDate(first.pickupDate)} · geldig tot {formatDateTime(first.expiresAt)}
        </p>
      </div>
      <ul className="mt-6 space-y-3">
        {reservations.map((r) => {
          const shop = db.shops.find((s) => s.id === r.shopId)!
          return (
            <li key={r.id} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
              <div className="flex items-center gap-3 p-4">
                <ShopLogo shop={shop} size={44} />
                <div className="flex-1">
                  <p className="font-bold">{shop.name}</p>
                  <p className="text-xs text-stone-500">{shop.address}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase text-stone-500">Ophaalcode</p>
                  <p className="font-mono text-lg font-bold tracking-wider text-accent">{r.code}</p>
                </div>
              </div>
              <ul className="border-t border-dashed border-stone-200 px-4 py-3 text-sm">
                {r.items.map((i) => (
                  <li key={i.productId} className="flex justify-between">
                    <span>
                      {i.quantity}× {i.title}
                    </span>
                    <span>{euro(i.price * i.quantity)}</span>
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ul>
      <p className="mt-4 rounded-2xl bg-gold-soft p-4 text-sm">
        Laat bij de winkel je ophaalcode zien. Gekocht? Vink het af op je lijstje!
      </p>
      <div className="mt-5 grid gap-2">
        <Link href="/lijstje" className="flex h-14 items-center justify-center rounded-2xl bg-primary font-bold text-white">
          Naar mijn lijstje
        </Link>
      </div>
    </div>
  )
}
