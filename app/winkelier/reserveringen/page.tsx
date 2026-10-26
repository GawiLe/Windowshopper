"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { cn, formatDate, todayISO } from "@/lib/utils"
import type { ReservationStatus } from "@/lib/types"
import { inputCls } from "@/components/forms"
import { useCurrentShop } from "../useShop"
import { ReservationCard } from "../ReservationCard"

const TABS: { id: "open" | ReservationStatus; label: string }[] = [
  { id: "open", label: "Klaarleggen" },
  { id: "picked_up", label: "Opgehaald" },
  { id: "expired", label: "Verlopen" },
]

export default function ReservationsPage() {
  const { db, shop } = useCurrentShop()
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("open")
  const [q, setQ] = useState("")
  if (!shop) return null

  const all = db.reservations.filter((r) => r.shopId === shop.id)
  const count = (id: string) =>
    all.filter((r) => (id === "open" ? r.status === "reserved" : id === "expired" ? r.status === "expired" || r.status === "cancelled" : r.status === id)).length
  const needle = q.trim().toLowerCase()
  const list = all
    .filter((r) =>
      tab === "open" ? r.status === "reserved" : tab === "expired" ? r.status === "expired" || r.status === "cancelled" : r.status === tab,
    )
    .filter((r) => !needle || r.customerName.toLowerCase().includes(needle) || r.code.toLowerCase().includes(needle))
    .sort((a, b) => (tab === "open" ? a.pickupDate.localeCompare(b.pickupDate) : b.createdAt.localeCompare(a.createdAt)))

  // groeperen per ophaaldag
  const groups = [...new Set(list.map((r) => r.pickupDate))]
  const dayLabel = (d: string) => (d === todayISO() ? "Vandaag" : d === todayISO(1) ? "Morgen" : d < todayISO() ? `${formatDate(d)} (eerder)` : formatDate(d))

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-primary">Reserveringen</h1>
      <p className="text-sm text-stone-500">Wie komt wat wanneer ophalen. Vink af zodra iemand is geweest.</p>

      <div className="mt-4 grid grid-cols-3 gap-1 rounded-2xl bg-stone-200/60 p-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn("h-11 rounded-xl text-sm font-bold", tab === t.id ? "bg-white text-primary shadow" : "text-stone-500")}>
            {t.label} <span className="text-xs opacity-60">{count(t.id)}</span>
          </button>
        ))}
      </div>

      <label className="relative mt-3 block">
        <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek op naam of ophaalcode" className={cn(inputCls, "pl-11")} />
      </label>

      {list.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-white p-8 text-center text-sm text-stone-500 shadow-sm">
          {tab === "open" ? "Nog geen reserveringen. Je krijgt een mail zodra er iets binnenkomt ✉️" : "Niets te zien hier."}
        </p>
      ) : (
        <div className="mt-5 space-y-6">
          {groups.map((d) => (
            <section key={d}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-stone-500">{dayLabel(d)}</h2>
              <ul className="space-y-3">
                {list
                  .filter((r) => r.pickupDate === d)
                  .map((r) => (
                    <ReservationCard key={r.id} r={r} />
                  ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
