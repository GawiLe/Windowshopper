"use client"

import { useState } from "react"
import { Download, RotateCcw, ShieldCheck, Upload, X } from "lucide-react"
import { actions, getDB, useDB, useIsSuper } from "@/lib/store"
import type { Database, SiteSettings } from "@/lib/types"
import { BrandImagePicker, Field, inputCls, Switch } from "@/components/forms"
import { toast } from "@/components/Toast"
import { AreaAdminManager, ChangeOwnPassword } from "@/components/AdminManager"
import { cn } from "@/lib/utils"
import { Card, PageTitle } from "../ui"

const PRESETS: { name: string; colors: SiteSettings["colors"] }[] = [
  { name: "De Kempenaer (huisstijl)", colors: { primary: "#023934", accent: "#9b2c2c", gold: "#c09a5e", background: "#f8f4ec", text: "#1f2a28" } },
  { name: "Dennengroen & rood", colors: { primary: "#1f4d3a", accent: "#b3262e", gold: "#c9a24a", background: "#fbf6ec", text: "#2a2420" } },
  { name: "Kerstrood", colors: { primary: "#7a1f24", accent: "#1f4d3a", gold: "#d4af37", background: "#fdf8f3", text: "#2a2020" } },
  { name: "Winternacht", colors: { primary: "#1c2c4c", accent: "#b8323a", gold: "#d6b25e", background: "#f6f7fb", text: "#1d2230" } },
  { name: "Warm chalet", colors: { primary: "#5a3d2b", accent: "#a8322d", gold: "#c99a43", background: "#fbf4ea", text: "#2c221b" } },
]

const COLOR_FIELDS: { key: keyof SiteSettings["colors"]; label: string }[] = [
  { key: "primary", label: "Hoofdkleur" },
  { key: "accent", label: "Accent (knoppen)" },
  { key: "gold", label: "Goud" },
  { key: "background", label: "Achtergrond" },
  { key: "text", label: "Tekst" },
]

export default function SettingsPage() {
  const db = useDB()
  const isSuper = useIsSuper()
  const [s, setS] = useState<SiteSettings>(db.settings)
  const [newCat, setNewCat] = useState("")
  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setS((x) => ({ ...x, [k]: v }))
  const setColor = (k: keyof SiteSettings["colors"], v: string) => {
    const colors = { ...s.colors, [k]: v }
    setS((x) => ({ ...x, colors }))
    actions.updateSettings({ colors }) // kleuren direct live zien
  }
  const setPrivacy = <K extends keyof SiteSettings["privacy"]>(k: K, v: SiteSettings["privacy"][K]) =>
    setS((x) => ({ ...x, privacy: { ...x.privacy, [k]: v } }))

  const dirty = JSON.stringify({ ...s, updatedAt: "" }) !== JSON.stringify({ ...db.settings, updatedAt: "" })

  const save = () => {
    actions.updateSettings(s)
    toast("Instellingen opgeslagen")
  }

  const exportData = () => {
    // alleen de gegevens van dit gebied, zonder beheerders of domeinen
    const { settings, shops, products, reservations, emails } = getDB()
    const blob = new Blob([JSON.stringify({ settings, shops, products, reservations, emails }, null, 2)], { type: "application/json" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `windowshoppen-${db.slug}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  const importData = (file?: File) => {
    if (!file) return
    file.text().then((t) => {
      try {
        const parsed = JSON.parse(t) as Database
        if (!parsed.settings || !Array.isArray(parsed.shops)) throw new Error()
        actions.importDB(parsed)
        setS(parsed.settings)
        toast("Gegevens geïmporteerd")
      } catch {
        toast("Dit bestand kon niet worden gelezen")
      }
    })
  }

  return (
    <div className="space-y-5">
      <PageTitle title="Instellingen" sub="Teksten, kleuren en spelregels van de webshop" />

      <Card>
        <h2 className="mb-4 text-lg font-bold">Teksten</h2>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Naam webshop">
              <input value={s.siteName} onChange={(e) => set("siteName", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Winkelgebied">
              <input value={s.areaName} onChange={(e) => set("areaName", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Plaats">
              <input value={s.town} onChange={(e) => set("town", e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label="Grote titel op de homepage" hint="De laatste twee woorden worden goud">
            <input value={s.heroTitle} onChange={(e) => set("heroTitle", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Ondertitel homepage">
            <textarea value={s.heroSubtitle} onChange={(e) => set("heroSubtitle", e.target.value)} rows={2} className={cn(inputCls, "h-auto py-3")} />
          </Field>
          <Field label="Introtekst (uitleg)">
            <textarea value={s.introText} onChange={(e) => set("introText", e.target.value)} rows={4} className={cn(inputCls, "h-auto py-3")} />
          </Field>
          <Field label="Tekst in de footer">
            <input value={s.footerText} onChange={(e) => set("footerText", e.target.value)} className={inputCls} />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold">Logo & favicon</h2>
        <p className="mb-4 text-sm text-stone-500">
          Gebruik bij voorkeur SVG of PNG met transparante achtergrond, in een kleur die goed zichtbaar is op de hoofdkleur.
        </p>
        <div className="grid gap-5 sm:grid-cols-3">
          <BrandImagePicker label="Beeldmerk" hint="Klein, in de menubalk" value={s.brand.mark} onChange={(v) => set("brand", { ...s.brand, mark: v })} max={400} />
          <BrandImagePicker label="Volledig logo" hint="Groot, onderaan de site" value={s.brand.logo} onChange={(v) => set("brand", { ...s.brand, logo: v })} max={800} />
          <BrandImagePicker
            label="Favicon"
            hint="Icoontje in het browsertabblad (vierkant)"
            value={s.brand.favicon}
            onChange={(v) => set("brand", { ...s.brand, favicon: v })}
            max={128}
            dark={false}
          />
        </div>
        <p className="mt-3 text-xs text-stone-500">Zonder favicon wordt automatisch een monogram in jullie kleuren gebruikt.</p>
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold">Kleuren</h2>
        <p className="mb-4 text-sm text-stone-500">Wijzigingen zie je meteen. Kies een thema of stel zelf in.</p>
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => {
                setS((x) => ({ ...x, colors: p.colors }))
                actions.updateSettings({ colors: p.colors })
              }}
              className={cn(
                "rounded-2xl p-2 text-left ring-1 ring-stone-200",
                JSON.stringify(p.colors) === JSON.stringify(s.colors) && "ring-2 ring-primary",
              )}
            >
              <span className="flex h-8 overflow-hidden rounded-lg">
                {Object.values(p.colors).map((c) => (
                  <span key={c} className="flex-1" style={{ background: c }} />
                ))}
              </span>
              <span className="mt-1 block text-xs font-semibold">{p.name}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {COLOR_FIELDS.map((f) => (
            <label key={f.key} className="block text-sm font-semibold">
              {f.label}
              <span className="mt-1 flex items-center gap-2 rounded-xl border border-stone-200 bg-white p-1.5">
                <input type="color" value={s.colors[f.key]} onChange={(e) => setColor(f.key, e.target.value)} className="h-9 w-9 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
                <code className="text-xs">{s.colors[f.key]}</code>
              </span>
            </label>
          ))}
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl" style={{ background: s.colors.background, color: s.colors.text }}>
          <div className="p-4" style={{ background: s.colors.primary, color: "white" }}>
            <p className="font-display text-xl">
              {s.siteName} <span style={{ color: s.colors.gold }}>{s.areaName}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 p-4">
            <span className="rounded-xl px-4 py-2 text-sm font-bold text-white" style={{ background: s.colors.accent }}>
              Zet op mijn lijstje
            </span>
            <span className="text-sm">Voorbeeldtekst</span>
          </div>
        </div>
        <div className="mt-4">
          <Switch checked={s.snowEnabled} onChange={(v) => { set("snowEnabled", v); actions.updateSettings({ snowEnabled: v }) }} label="Sneeuwval" description="Vallende sneeuw over de webshop" />
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-bold">Spelregels</h2>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Actie start">
              <input type="date" value={s.campaignStart} onChange={(e) => set("campaignStart", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Actie eindigt">
              <input type="date" value={s.campaignEnd} onChange={(e) => set("campaignEnd", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Max. producten per winkel">
              <input type="number" min={1} max={100} value={s.maxProductsPerShop} onChange={(e) => set("maxProductsPerShop", Math.max(1, Number(e.target.value)))} className={inputCls} />
            </Field>
            <Field label="Reservering geldig (uren)">
              <input type="number" min={1} max={168} value={s.reservationHours} onChange={(e) => set("reservationHours", Math.max(1, Number(e.target.value)))} className={inputCls} />
            </Field>
          </div>
          <Switch checked={s.reservationsEnabled} onChange={(v) => set("reservationsEnabled", v)} label="Reserveren aan" description="Zet uit om reserveren voor alle winkels te pauzeren" />
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-bold">Categorieën</h2>
        <div className="flex flex-wrap gap-2">
          {s.categories.map((c) => (
            <span key={c} className="flex items-center gap-1 rounded-full bg-stone-100 py-1.5 pl-3 pr-1.5 text-sm font-semibold">
              {c}
              <button onClick={() => set("categories", s.categories.filter((x) => x !== c))} className="rounded-full p-0.5 hover:bg-stone-200" aria-label={`${c} verwijderen`}>
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const c = newCat.trim()
            if (c && !s.categories.includes(c)) set("categories", [...s.categories, c])
            setNewCat("")
          }}
        >
          <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Nieuwe categorie" className={inputCls} />
          <button className="h-12 shrink-0 rounded-xl bg-primary px-4 font-bold text-white">Toevoegen</button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
          <ShieldCheck className="h-5 w-5 text-primary" /> Privacy
        </h2>
        <p className="mb-4 text-sm text-stone-500">Deze gegevens worden gebruikt in de privacyverklaring.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Verwerkingsverantwoordelijke">
            <input value={s.privacy.controllerName} onChange={(e) => setPrivacy("controllerName", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Adres">
            <input value={s.privacy.controllerAddress} onChange={(e) => setPrivacy("controllerAddress", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Contact e-mail privacy">
            <input type="email" value={s.privacy.contactEmail} onChange={(e) => setPrivacy("contactEmail", e.target.value)} className={inputCls} />
          </Field>
          <Field label="KvK-nummer">
            <input value={s.privacy.kvk} onChange={(e) => setPrivacy("kvk", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Bewaartermijn reserveringen (dagen)">
            <input type="number" min={1} max={365} value={s.privacy.retentionDays} onChange={(e) => setPrivacy("retentionDays", Math.max(1, Number(e.target.value)))} className={inputCls} />
          </Field>
        </div>
        <button
          onClick={() => {
            if (confirm(`Alle afgeronde reserveringen en mails ouder dan ${db.settings.privacy.retentionDays} dagen verwijderen?`)) {
              actions.purgeOldPersonalData()
              toast("Oude persoonsgegevens verwijderd")
            }
          }}
          className="mt-4 h-11 rounded-xl bg-stone-100 px-4 text-sm font-bold"
        >
          Nu oude persoonsgegevens opschonen
        </button>
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold">Beheerders van {db.settings.areaName}</h2>
        <p className="mb-4 text-sm text-stone-500">Wie mag dit winkelgebied beheren. Andere winkelgebieden zijn voor hen onzichtbaar.</p>
        <AreaAdminManager areaId={db.id} admins={db.admins} />
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-bold">Mijn wachtwoord</h2>
        <ChangeOwnPassword />
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold">Gegevens van dit winkelgebied</h2>
        <p className="mb-4 text-sm text-stone-500">Export en import gaan alleen over {db.settings.areaName}.</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportData} className="flex h-11 items-center gap-2 rounded-xl bg-stone-100 px-4 text-sm font-bold">
            <Download className="h-4 w-4" /> Exporteer (JSON)
          </button>
          <label className="flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-stone-100 px-4 text-sm font-bold">
            <Upload className="h-4 w-4" /> Importeer
            <input type="file" accept="application/json" className="hidden" onChange={(e) => importData(e.target.files?.[0])} />
          </label>
          {isSuper && (
            <button
              onClick={() => {
                if (confirm("Het hele demo-platform (alle winkelgebieden) terugzetten? Alle wijzigingen gaan verloren.")) {
                  actions.resetDemo()
                  setS(getDB().settings)
                  toast("Demo hersteld")
                }
              }}
              className="flex h-11 items-center gap-2 rounded-xl bg-accent-soft px-4 text-sm font-bold text-accent"
            >
              <RotateCcw className="h-4 w-4" /> Demo resetten (alle gebieden)
            </button>
          )}
        </div>
      </Card>

      <div className={cn("pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white p-3 transition md:left-60", dirty ? "translate-y-0" : "translate-y-full")}>
        <div className="mx-auto flex max-w-4xl gap-2">
          <button onClick={() => setS(db.settings)} className="h-12 rounded-xl bg-stone-100 px-5 font-bold">
            Annuleer
          </button>
          <button onClick={save} className="h-12 flex-1 rounded-xl bg-accent font-bold text-white">
            Wijzigingen opslaan
          </button>
        </div>
      </div>
    </div>
  )
}
