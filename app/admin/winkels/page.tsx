"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, Pencil, Plus, Trash2 } from "lucide-react"
import { actions, sessionActions, useDB } from "@/lib/store"
import { ShopLogo } from "@/components/Visuals"
import { toast } from "@/components/Toast"
import { cn } from "@/lib/utils"
import { PageTitle } from "../ui"

export default function AdminShops() {
  const db = useDB()
  const router = useRouter()
  return (
    <div>
      <PageTitle title="Winkels" sub={`${db.shops.length} winkels`}>
        <Link href="/admin/winkels/nieuw" className="flex h-11 items-center gap-1 rounded-xl bg-accent px-4 text-sm font-bold text-white">
          <Plus className="h-4 w-4" /> Winkel toevoegen
        </Link>
      </PageTitle>
      <ul className="space-y-2">
        {db.shops.map((s) => {
          const n = db.products.filter((p) => p.shopId === s.id).length
          const open = db.reservations.filter((r) => r.shopId === s.id && r.status === "reserved").length
          return (
            <li key={s.id} className={cn("flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5", !s.active && "opacity-60")}>
              <ShopLogo shop={s} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">
                  {s.name} {!s.active && <span className="text-xs font-semibold text-stone-500">(verborgen)</span>}
                </p>
                <p className="truncate text-xs text-stone-500">
                  {s.address} · {n} producten · {open} open reserveringen
                </p>
              </div>
              <button
                onClick={() => {
                  sessionActions.impersonate(s.id)
                  router.push("/winkelier")
                }}
                title="Meekijken als winkelier"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-soft"
                aria-label={`Meekijken bij ${s.name}`}
              >
                <Eye className="h-4 w-4" />
              </button>
              <Link href={`/admin/winkels/${s.id}`} className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100" aria-label="Bewerken">
                <Pencil className="h-4 w-4" />
              </Link>
              <button
                onClick={() => {
                  if (confirm(`"${s.name}" en alle ${n} producten definitief verwijderen?`)) {
                    actions.deleteShop(s.id)
                    toast("Winkel verwijderd")
                  }
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent"
                aria-label="Verwijderen"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
