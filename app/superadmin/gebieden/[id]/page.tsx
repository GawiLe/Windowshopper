"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import { normalizeDomain, platformActions, usePlatform } from "@/lib/store"
import type { Area } from "@/lib/types"
import { Field, inputCls, Switch } from "@/components/forms"
import { AreaAdminManager } from "@/components/AdminManager"
import { toast } from "@/components/Toast"
import { parseDomains, slugify } from "@/lib/utils"

export default function AreaDetail() {
  const { id } = useParams<{ id: string }>()
  const area = usePlatform().areas.find((a) => a.id === id)
  if (!area) return <p>Winkelgebied niet gevonden.</p>
  return <AreaEditor key={area.id} area={area} />
}

function AreaEditor({ area }: { area: Area }) {
  const router = useRouter()
  const [f, setF] = useState({
    name: area.settings.areaName,
    town: area.settings.town,
    slug: area.slug,
    domains: area.domains.join(", "),
    active: area.active,
  })
  const [confirmName, setConfirmName] = useState("")

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const err = platformActions.updateArea(area.id, {
      name: f.name.trim(),
      town: f.town.trim(),
      slug: f.slug || slugify(f.name),
      domains: parseDomains(f.domains),
      active: f.active,
    })
    toast(err ?? "Opgeslagen")
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/superadmin" className="inline-flex items-center gap-1 text-sm font-medium text-stone-500">
        <ArrowLeft className="h-4 w-4" /> Alle winkelgebieden
      </Link>
      <h1 className="font-display text-3xl font-semibold">{area.settings.areaName}</h1>

      <form onSubmit={save} className="space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5" noValidate>
        <h2 className="text-lg font-bold">Gebied & domeinen</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Naam winkelgebied">
            <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Plaats">
            <input value={f.town} onChange={(e) => setF({ ...f, town: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Korte naam">
            <input value={f.slug} onChange={(e) => setF({ ...f, slug: slugify(e.target.value) })} className={inputCls} />
          </Field>
          <Field label="Domeinen" hint="Gescheiden door komma, bv. shoppenkempenaer.nl">
            <input value={f.domains} onChange={(e) => setF({ ...f, domains: e.target.value })} className={inputCls} />
          </Field>
        </div>
        {parseDomains(f.domains).length > 0 && (
          <p className="text-xs text-stone-500">
            Wordt opgeslagen als: {[...new Set(parseDomains(f.domains).map(normalizeDomain))].join(", ")} (www. werkt automatisch mee)
          </p>
        )}
        <Switch checked={f.active} onChange={(v) => setF({ ...f, active: v })} label="Gebied actief" description="Uit = de webshop van dit gebied is offline" />
        <button className="h-11 rounded-xl bg-[#14171a] px-5 text-sm font-semibold text-white">Opslaan</button>
        <p className="text-xs text-stone-500">
          Koppel elk domein ook in Vercel (Project → Domains) en verifieer het in Resend als afzenderdomein voor de mails.
        </p>
      </form>

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="mb-1 text-lg font-bold">Beheerders van {area.settings.areaName}</h2>
        <p className="mb-4 text-sm text-stone-500">Zij loggen in op /admin van dit gebied en zien alleen dit gebied.</p>
        <AreaAdminManager areaId={area.id} admins={area.admins} />
      </section>

      <section className="rounded-3xl bg-red-50 p-5 ring-1 ring-red-200">
        <h2 className="flex items-center gap-2 text-lg font-bold text-red-800">
          <AlertTriangle className="h-5 w-5" /> Winkelgebied verwijderen
        </h2>
        <p className="mt-1 text-sm text-red-900/80">
          Verwijdert alle winkels, producten, reserveringen, mails en beheerders van dit gebied. Dit kan niet ongedaan worden.
          Typ <b>{area.settings.areaName}</b> om te bevestigen.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input value={confirmName} onChange={(e) => setConfirmName(e.target.value)} className={inputCls} placeholder={area.settings.areaName} />
          <button
            disabled={confirmName !== area.settings.areaName}
            onClick={() => {
              platformActions.deleteArea(area.id)
              toast("Winkelgebied verwijderd")
              router.push("/superadmin")
            }}
            className="h-12 shrink-0 rounded-xl bg-red-700 px-5 text-sm font-semibold text-white disabled:opacity-40"
          >
            Definitief verwijderen
          </button>
        </div>
      </section>
    </div>
  )
}
