"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ExternalLink, Globe, Plus, Settings2, Store } from "lucide-react"
import { platformActions, useDomainLocked, usePlatform } from "@/lib/store"
import type { Area } from "@/lib/types"
import { Field, inputCls } from "@/components/forms"
import { ChangeOwnPassword } from "@/components/AdminManager"
import { toast } from "@/components/Toast"
import { cn, parseDomains, slugify } from "@/lib/utils"
import { SuperAdmins } from "./SuperAdmins"

export default function SuperHome() {
  const platform = usePlatform()
  const [showNew, setShowNew] = useState(false)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Winkelgebieden</h1>
          <p className="text-sm text-stone-500">Elk gebied heeft eigen domeinen, beheerders, winkels en gegevens. Ze raken elkaar nooit.</p>
        </div>
        <button onClick={() => setShowNew((s) => !s)} className="flex h-11 items-center gap-2 rounded-xl bg-[#14171a] px-4 text-sm font-semibold text-white">
          <Plus className="h-4 w-4" /> Nieuw winkelgebied
        </button>
      </div>

      {showNew && <NewArea onDone={() => setShowNew(false)} />}

      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {platform.areas.map((a) => (
          <AreaCard key={a.id} area={a} />
        ))}
      </ul>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-1 text-lg font-bold">Superadmins</h2>
          <p className="mb-4 text-sm text-stone-500">Hebben toegang tot alle winkelgebieden.</p>
          <SuperAdmins />
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-4 text-lg font-bold">Mijn wachtwoord</h2>
          <ChangeOwnPassword />
        </div>
      </section>
    </div>
  )
}

function AreaCard({ area: a }: { area: Area }) {
  const router = useRouter()
  const locked = useDomainLocked()
  const open = a.reservations.filter((r) => r.status === "reserved").length
  const primaryDomain = a.domains[0]

  // In de demo (localhost) wisselen we binnen dezelfde site van gebied; live ga je naar het domein.
  const openAdmin = () => {
    if (locked && primaryDomain) {
      window.location.href = `https://${primaryDomain}/admin`
      return
    }
    platformActions.switchArea(a.id)
    router.push("/admin")
  }
  const openSite = () => {
    if (locked && primaryDomain) {
      window.open(`https://${primaryDomain}`, "_blank")
      return
    }
    platformActions.switchArea(a.id)
    router.push("/")
  }

  return (
    <li className={cn("flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5", !a.active && "opacity-60")}>
      <div className="flex items-center gap-3 p-5" style={{ background: a.settings.colors.primary }}>
        {a.settings.brand.mark ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.settings.brand.mark} alt="" className="h-10 w-auto" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full border font-display font-semibold" style={{ borderColor: a.settings.colors.gold, color: a.settings.colors.gold }}>
            {a.settings.areaName.slice(0, 1)}
          </span>
        )}
        <div className="min-w-0 text-white">
          <p className="truncate font-display text-lg font-semibold">{a.settings.areaName}</p>
          <p className="truncate text-xs text-white/70">
            {a.settings.town} · /{a.slug} {a.active ? "" : "· niet actief"}
          </p>
        </div>
      </div>
      <div className="flex-1 space-y-3 p-5 text-sm">
        <p className="flex items-start gap-2">
          <Globe className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
          <span className="break-all">{a.domains.length ? a.domains.join(", ") : <i className="text-stone-400">nog geen domein</i>}</span>
        </p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat n={a.shops.length} l="winkels" />
          <Stat n={a.products.length} l="producten" />
          <Stat n={open} l="open res." />
        </div>
        <p className="text-xs text-stone-500">
          {a.admins.length} beheerder{a.admins.length === 1 ? "" : "s"}
          {a.admins.length > 0 && `: ${a.admins.map((x) => x.name || x.email).join(", ")}`}
        </p>
      </div>
      <div className="grid grid-cols-3 border-t border-stone-100 text-sm font-medium">
        <Link href={`/superadmin/gebieden/${a.id}`} className="flex h-12 items-center justify-center gap-1.5 hover:bg-stone-50">
          <Settings2 className="h-4 w-4" /> Instellen
        </Link>
        <button onClick={openAdmin} className="flex h-12 items-center justify-center gap-1.5 border-x border-stone-100 hover:bg-stone-50">
          <Store className="h-4 w-4" /> Beheer
        </button>
        <button onClick={openSite} className="flex h-12 items-center justify-center gap-1.5 hover:bg-stone-50">
          <ExternalLink className="h-4 w-4" /> Site
        </button>
      </div>
    </li>
  )
}

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div className="rounded-xl bg-stone-50 py-2">
      <p className="text-lg font-bold">{n}</p>
      <p className="text-[11px] text-stone-500">{l}</p>
    </div>
  )
}


function NewArea({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ name: "", town: "", slug: "", domains: "" })
  const save = (e: React.FormEvent) => {
    e.preventDefault()
    if (f.name.trim().length < 2) return toast("Vul een naam in")
    const slug = f.slug || slugify(f.name)
    const err = platformActions.createArea({ name: f.name.trim(), town: f.town.trim(), slug, domains: parseDomains(f.domains) })
    if (err) return toast(err)
    toast(`${f.name} aangemaakt`)
    onDone()
  }
  return (
    <form onSubmit={save} className="grid gap-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:grid-cols-2" noValidate>
      <Field label="Naam winkelgebied">
        <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="bv. Mijdrecht Centrum" className={inputCls} />
      </Field>
      <Field label="Plaats">
        <input value={f.town} onChange={(e) => setF({ ...f, town: e.target.value })} placeholder="bv. Mijdrecht" className={inputCls} />
      </Field>
      <Field label="Korte naam" hint={`Voor intern gebruik: ${f.slug || slugify(f.name) || "…"}`}>
        <input value={f.slug} onChange={(e) => setF({ ...f, slug: slugify(e.target.value) })} placeholder={slugify(f.name)} className={inputCls} />
      </Field>
      <Field label="Domeinen" hint="Gescheiden door komma of spatie, bv. shoppenmijdrecht.nl">
        <input value={f.domains} onChange={(e) => setF({ ...f, domains: e.target.value })} className={inputCls} />
      </Field>
      <div className="flex gap-2 sm:col-span-2">
        <button className="h-11 rounded-xl bg-[#14171a] px-5 text-sm font-semibold text-white">Aanmaken</button>
        <button type="button" onClick={onDone} className="h-11 rounded-xl bg-stone-100 px-5 text-sm font-semibold">
          Annuleren
        </button>
      </div>
    </form>
  )
}
