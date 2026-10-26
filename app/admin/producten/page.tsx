"use client"

import { useState } from "react"
import Link from "next/link"
import { Eye, EyeOff, Search, Trash2 } from "lucide-react"
import { actions, useDB } from "@/lib/store"
import { ProductImage } from "@/components/Visuals"
import { inputCls } from "@/components/forms"
import { cn, euro, stockLabel } from "@/lib/utils"
import { PageTitle } from "../ui"

export default function AdminProducts() {
  const db = useDB()
  const [q, setQ] = useState("")
  const [shop, setShop] = useState("")
  const needle = q.toLowerCase()
  const list = db.products.filter((p) => (!shop || p.shopId === shop) && (!needle || p.title.toLowerCase().includes(needle)))
  return (
    <div>
      <PageTitle title="Producten" sub="Alle kadotips van alle winkels. Verberg of verwijder wat niet past." />
      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <label className="relative">
          <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoeken" className={cn(inputCls, "pl-11")} />
        </label>
        <select value={shop} onChange={(e) => setShop(e.target.value)} className={inputCls}>
          <option value="">Alle winkels</option>
          {db.shops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {list.map((p) => {
          const s = db.shops.find((x) => x.id === p.shopId)
          return (
            <li key={p.id} className={cn("flex items-center gap-3 rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-black/5", !p.active && "opacity-60")}>
              <Link href={`/product/${p.id}`} target="_blank" className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                <ProductImage product={p} color={s?.coverColor} />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{p.title}</p>
                <p className="truncate text-xs text-stone-500">
                  {s?.name} · {euro(p.price)} · {stockLabel(p).text}
                </p>
              </div>
              <button onClick={() => actions.upsertProduct({ ...p, active: !p.active })} className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100" aria-label={p.active ? "Verbergen" : "Tonen"}>
                {p.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              <button onClick={() => confirm(`"${p.title}" verwijderen?`) && actions.deleteProduct(p.id)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent" aria-label="Verwijderen">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
