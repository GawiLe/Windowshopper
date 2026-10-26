"use client"

import { useState } from "react"
import { actions, useDB } from "@/lib/store"
import type { Shop } from "@/lib/types"
import { DAYS, cn, isValidEmail, slugify } from "@/lib/utils"
import { Field, inputCls, SingleImagePicker, Switch } from "./forms"
import { StreetMap } from "./StreetMap"
import { toast } from "./Toast"

const ORDER = [1, 2, 3, 4, 5, 6, 0]

/** Winkelprofiel. Winkeliers zien de basisvelden; de admin ziet ook naam, adres, kaartpositie en inlog. */
export function ShopForm({ shop, admin = false, onSaved }: { shop: Shop; admin?: boolean; onSaved?: (s: Shop) => void }) {
  const db = useDB()
  const [s, setS] = useState<Shop>(shop)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = <K extends keyof Shop>(k: K, v: Shop[K]) => setS((x) => ({ ...x, [k]: v }))

  const setHours = (day: number, field: "open" | "close", value: string) =>
    set(
      "openingHours",
      s.openingHours.map((h) => (h.day === day ? { ...h, [field]: value || null } : h)),
    )
  const toggleDay = (day: number, open: boolean) =>
    set(
      "openingHours",
      s.openingHours.map((h) => (h.day === day ? { ...h, open: open ? "09:30" : null, close: open ? "18:00" : null } : h)),
    )

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const err: Record<string, string> = {}
    if (s.name.trim().length < 2) err.name = "Vul een naam in"
    if (!isValidEmail(s.email)) err.email = "Vul een geldig e-mailadres in (hier komen reserveringen binnen)"
    const slug = s.slug || slugify(s.name)
    if (db.shops.some((x) => x.slug === slug && x.id !== s.id)) err.slug = "Deze webadres-naam is al in gebruik"
    setErrors(err)
    if (Object.keys(err).length) return toast("Controleer de gemarkeerde velden")
    const next = { ...s, slug }
    actions.upsertShop(next)
    toast("Opgeslagen ✨")
    onSaved?.(next)
  }

  return (
    <form onSubmit={save} className="space-y-5" noValidate>
      <Field label="Logo">
        <SingleImagePicker value={s.logo} onChange={(v) => set("logo", v)} />
      </Field>

      {admin && (
        <>
          <Field label="Naam van de winkel" error={errors.name}>
            <input value={s.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Webadres" hint={`/winkel/${s.slug || slugify(s.name)}`} error={errors.slug}>
            <input value={s.slug} onChange={(e) => set("slug", slugify(e.target.value))} placeholder={slugify(s.name)} className={inputCls} />
          </Field>
        </>
      )}

      <Field label="Korte slogan" hint="Eén regel, bijv. 'Boeken, kaarten & leesplezier'">
        <input value={s.tagline} onChange={(e) => set("tagline", e.target.value)} maxLength={60} className={inputCls} />
      </Field>

      <Field label="Over de winkel" hint="Een korte, persoonlijke bio voor bovenaan je winkelpagina">
        <textarea value={s.bio} onChange={(e) => set("bio", e.target.value)} rows={4} maxLength={500} className={cn(inputCls, "h-auto py-3")} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Icoon" hint="Als er geen logo is">
          <input value={s.emoji} onChange={(e) => set("emoji", e.target.value)} maxLength={4} className={cn(inputCls, "text-center text-2xl")} />
        </Field>
        <Field label="Kleur" hint="Achtergrond winkelpagina">
          <input type="color" value={s.coverColor} onChange={(e) => set("coverColor", e.target.value)} className="h-12 w-full cursor-pointer rounded-xl border border-stone-200 bg-white p-1" />
        </Field>
      </div>

      <Field label="Categorie">
        <select value={s.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
          {db.settings.categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>

      {admin && (
        <Field label="Adres">
          <input value={s.address} onChange={(e) => set("address", e.target.value)} className={inputCls} />
        </Field>
      )}

      <Field label="E-mail voor reserveringen" error={errors.email}>
        <input type="email" inputMode="email" value={s.email} onChange={(e) => set("email", e.target.value)} className={inputCls} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Telefoon">
          <input type="tel" inputMode="tel" value={s.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Instagram">
          <input value={s.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@jouwwinkel" className={inputCls} />
        </Field>
      </div>
      <Field label="Website">
        <input type="url" inputMode="url" value={s.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" className={inputCls} />
      </Field>

      <section>
        <p className="mb-2 text-[15px] font-bold">Openingstijden</p>
        <ul className="space-y-2 rounded-2xl bg-white p-3 ring-1 ring-stone-200">
          {ORDER.map((d) => {
            const h = s.openingHours.find((x) => x.day === d) ?? { day: d, open: null, close: null }
            const open = !!h.open
            return (
              <li key={d} className="flex items-center gap-2">
                <label className="flex w-28 items-center gap-2 text-sm font-semibold capitalize">
                  <input type="checkbox" checked={open} onChange={(e) => toggleDay(d, e.target.checked)} className="h-5 w-5 accent-[var(--c-primary)]" />
                  {DAYS[d].slice(0, 2)}
                  <span className="hidden sm:inline">{DAYS[d].slice(2)}</span>
                </label>
                {open ? (
                  <>
                    <input type="time" value={h.open ?? ""} onChange={(e) => setHours(d, "open", e.target.value)} className="h-10 flex-1 rounded-lg border border-stone-200 px-2" />
                    <span>–</span>
                    <input type="time" value={h.close ?? ""} onChange={(e) => setHours(d, "close", e.target.value)} className="h-10 flex-1 rounded-lg border border-stone-200 px-2" />
                  </>
                ) : (
                  <span className="text-sm text-stone-400">gesloten</span>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <Switch
        checked={s.allowReservations}
        onChange={(v) => set("allowReservations", v)}
        label="Reserveringen ontvangen"
        description="Klanten kunnen producten een dag laten apart leggen"
      />

      {admin && (
        <>
          <section>
            <p className="text-[15px] font-bold">Plek op de kaart</p>
            <p className="mb-2 text-xs text-stone-500">Tik op de kaart waar de winkel zit.</p>
            <div className="overflow-hidden rounded-2xl ring-1 ring-stone-200">
              <StreetMap
                shops={[...db.shops.filter((x) => x.id !== s.id && x.active), s]}
                selectedId={s.id}
                onPlace={(x, y) => setS((cur) => ({ ...cur, mapX: x, mapY: y }))}
              />
            </div>
          </section>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Breedtegraad (optioneel)" hint="Voor een echte kaart later">
              <input inputMode="decimal" value={s.lat ?? ""} onChange={(e) => set("lat", e.target.value ? Number(e.target.value) : null)} className={inputCls} />
            </Field>
            <Field label="Lengtegraad (optioneel)" hint={"\u00a0"}>
              <input inputMode="decimal" value={s.lng ?? ""} onChange={(e) => set("lng", e.target.value ? Number(e.target.value) : null)} className={inputCls} />
            </Field>
          </div>
          <Field label="Inlogcode winkelier (demo)" hint="In de live-versie logt de winkelier in met een link per e-mail">
            <input value={s.loginCode} onChange={(e) => set("loginCode", e.target.value)} className={inputCls} />
          </Field>
          <Switch checked={s.active} onChange={(v) => set("active", v)} label="Winkel zichtbaar" description="Uit = verborgen in de webshop" />
        </>
      )}

      <div className="pb-safe sticky bottom-0 -mx-4 bg-gradient-to-t from-stone-50 via-stone-50 to-transparent px-4 pb-3 pt-4">
        <button type="submit" className="h-14 w-full rounded-2xl bg-accent text-base font-bold text-white shadow-lg">
          Opslaan
        </button>
      </div>
    </form>
  )
}
