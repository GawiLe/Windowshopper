"use client"

import Link from "next/link"
import { useDB } from "@/lib/store"
import { euro, formatDateTime } from "@/lib/utils"
import { Card, PageTitle } from "./ui"

export default function AdminHome() {
  const db = useDB()
  const res = db.reservations
  const stat = (n: number | string, l: string, href: string) => (
    <Link href={href} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <p className="text-3xl font-bold text-primary">{n}</p>
      <p className="text-sm font-semibold text-stone-500">{l}</p>
    </Link>
  )
  const value = res.filter((r) => r.status !== "cancelled" && r.status !== "expired").reduce((s, r) => s + r.items.reduce((a, i) => a + i.price * i.quantity, 0), 0)

  return (
    <div>
      <PageTitle title="Overzicht" sub={`${db.settings.siteName} ${db.settings.areaName}`} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stat(db.shops.filter((s) => s.active).length, "actieve winkels", "/admin/winkels")}
        {stat(db.products.length, "producten", "/admin/producten")}
        {stat(res.filter((r) => r.status === "reserved").length, "open reserveringen", "/admin/reserveringen")}
        {stat(euro(value), "gereserveerde waarde", "/admin/reserveringen")}
      </div>

      <Card className="mt-5">
        <h2 className="mb-3 font-bold">Winkels en hun etalage</h2>
        <ul className="divide-y divide-stone-100">
          {db.shops.map((s) => {
            const n = db.products.filter((p) => p.shopId === s.id).length
            return (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <Link href={`/admin/winkels/${s.id}`} className="font-semibold">
                  {s.name}
                </Link>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-24 overflow-hidden rounded-full bg-stone-100">
                    <span className="block h-full bg-primary" style={{ width: `${(n / db.settings.maxProductsPerShop) * 100}%` }} />
                  </span>
                  <span className="w-10 text-right text-stone-500">
                    {n}/{db.settings.maxProductsPerShop}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      </Card>

      <Card className="mt-5">
        <h2 className="mb-3 font-bold">Laatste reserveringen</h2>
        {res.length === 0 ? (
          <p className="text-sm text-stone-500">Nog geen reserveringen.</p>
        ) : (
          <ul className="divide-y divide-stone-100 text-sm">
            {res.slice(0, 8).map((r) => (
              <li key={r.id} className="flex justify-between gap-2 py-2">
                <span>
                  <b>{r.code}</b> · {db.shops.find((s) => s.id === r.shopId)?.name}
                </span>
                <span className="text-stone-500">{formatDateTime(r.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
