"use client"

import { useState } from "react"
import { useDB } from "@/lib/store"
import { inputCls } from "@/components/forms"
import { ReservationCard } from "@/app/winkelier/ReservationCard"
import { PageTitle } from "../ui"

export default function AdminReservations() {
  const db = useDB()
  const [shop, setShop] = useState("")
  const [status, setStatus] = useState("")
  const list = db.reservations.filter((r) => (!shop || r.shopId === shop) && (!status || r.status === status))
  return (
    <div>
      <PageTitle title="Reserveringen" sub="Alle reserveringen van alle winkels" />
      <div className="mb-4 grid grid-cols-2 gap-2">
        <select value={shop} onChange={(e) => setShop(e.target.value)} className={inputCls}>
          <option value="">Alle winkels</option>
          {db.shops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
          <option value="">Alle statussen</option>
          <option value="reserved">Klaarleggen</option>
          <option value="picked_up">Opgehaald</option>
          <option value="expired">Verlopen</option>
          <option value="cancelled">Geannuleerd</option>
        </select>
      </div>
      {list.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-stone-500">Geen reserveringen gevonden.</p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {list.map((r) => (
            <li key={r.id}>
              <p className="mb-1 text-xs font-bold uppercase text-stone-500">{db.shops.find((s) => s.id === r.shopId)?.name}</p>
              <ul>
                <ReservationCard r={r} />
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
