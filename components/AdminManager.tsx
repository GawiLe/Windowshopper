"use client"

import { useState } from "react"
import { Trash2, UserPlus } from "lucide-react"
import { platformActions } from "@/lib/store"
import type { AdminAccount } from "@/lib/types"
import { formatDateTime, isValidEmail } from "@/lib/utils"
import { Field, inputCls } from "./forms"
import { toast } from "./Toast"

/** Beheerders van één winkelgebied: lijst, toevoegen en verwijderen. */
export function AreaAdminManager({ areaId, admins }: { areaId: string; admins: AdminAccount[] }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [busy, setBusy] = useState(false)

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidEmail(form.email)) return toast("Vul een geldig e-mailadres in")
    if (form.password.length < 8) return toast("Kies een wachtwoord van minimaal 8 tekens")
    setBusy(true)
    const err = await platformActions.addAreaAdmin(areaId, form)
    setBusy(false)
    if (err) return toast(err)
    setForm({ name: "", email: "", password: "" })
    toast("Beheerder toegevoegd")
  }

  return (
    <div className="space-y-4">
      {admins.length === 0 ? (
        <p className="rounded-xl bg-stone-50 p-3 text-sm text-stone-500">Nog geen beheerders voor dit gebied (alleen de superadmin heeft toegang).</p>
      ) : (
        <ul className="divide-y divide-stone-100 rounded-xl ring-1 ring-stone-200">
          {admins.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 p-3">
              <span className="min-w-0">
                <span className="block truncate font-semibold">{a.name || a.email}</span>
                <span className="block truncate text-xs text-stone-500">
                  {a.email} · sinds {formatDateTime(a.createdAt)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  if (!confirm(`${a.email} als beheerder verwijderen?`)) return
                  const err = platformActions.removeAreaAdmin(areaId, a.id)
                  toast(err ?? "Beheerder verwijderd")
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent"
                aria-label={`${a.email} verwijderen`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="grid gap-3 rounded-xl bg-stone-50 p-3 sm:grid-cols-3" noValidate>
        <Field label="Naam">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
        </Field>
        <Field label="E-mail">
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Startwachtwoord">
          <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} autoComplete="off" />
        </Field>
        <button disabled={busy} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white sm:col-span-3 sm:w-fit">
          <UserPlus className="h-4 w-4" /> Beheerder toevoegen
        </button>
      </form>
      <p className="text-xs text-stone-500">
        Beheerders zien en beheren alleen dit winkelgebied. Laat ze na de eerste keer inloggen hun wachtwoord wijzigen.
      </p>
    </div>
  )
}

export function ChangeOwnPassword() {
  const [pw, setPw] = useState("")
  const [pw2, setPw2] = useState("")
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pw.length < 8) return toast("Kies een wachtwoord van minimaal 8 tekens")
    if (pw !== pw2) return toast("De wachtwoorden zijn niet gelijk")
    const err = await platformActions.changeOwnPassword(pw)
    if (err) return toast(err)
    setPw("")
    setPw2("")
    toast("Wachtwoord gewijzigd")
  }
  return (
    <form onSubmit={save} className="space-y-3" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nieuw wachtwoord">
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" className={inputCls} />
        </Field>
        <Field label="Herhaal wachtwoord">
          <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" className={inputCls} />
        </Field>
      </div>
      <button className="h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-white">Wachtwoord wijzigen</button>
    </form>
  )
}
