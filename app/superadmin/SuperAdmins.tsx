"use client"

import { useState } from "react"
import { Trash2, UserPlus } from "lucide-react"
import { platformActions, usePlatform } from "@/lib/store"
import { Field, inputCls } from "@/components/forms"
import { toast } from "@/components/Toast"
import { isValidEmail } from "@/lib/utils"

export function SuperAdmins() {
  const platform = usePlatform()
  const [f, setF] = useState({ name: "", email: "", password: "" })
  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidEmail(f.email)) return toast("Vul een geldig e-mailadres in")
    if (f.password.length < 8) return toast("Kies een wachtwoord van minimaal 8 tekens")
    const err = await platformActions.addSuperAdmin(f)
    if (err) return toast(err)
    setF({ name: "", email: "", password: "" })
    toast("Superadmin toegevoegd")
  }
  return (
    <div className="space-y-4">
      <ul className="divide-y divide-stone-100 rounded-xl ring-1 ring-stone-200">
        {platform.superAdmins.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-3 p-3">
            <span className="min-w-0">
              <span className="block truncate font-semibold">{a.name || a.email}</span>
              <span className="block truncate text-xs text-stone-500">{a.email}</span>
            </span>
            <button
              onClick={() => {
                if (!confirm(`${a.email} als superadmin verwijderen?`)) return
                const err = platformActions.removeSuperAdmin(a.id)
                toast(err ?? "Verwijderd")
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-700"
              aria-label={`${a.email} verwijderen`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="grid gap-3 rounded-xl bg-stone-50 p-3 sm:grid-cols-3" noValidate>
        <Field label="Naam">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} />
        </Field>
        <Field label="E-mail">
          <input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Startwachtwoord">
          <input value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className={inputCls} autoComplete="off" />
        </Field>
        <button className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#14171a] px-4 text-sm font-semibold text-white sm:col-span-3 sm:w-fit">
          <UserPlus className="h-4 w-4" /> Superadmin toevoegen
        </button>
      </form>
    </div>
  )
}
