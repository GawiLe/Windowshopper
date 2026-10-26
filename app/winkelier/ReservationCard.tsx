"use client"

import { useState } from "react"
import { Check, Mail, MoreHorizontal, Phone, RotateCcw, X } from "lucide-react"
import { actions } from "@/lib/store"
import type { Reservation } from "@/lib/types"
import { cn, euro, formatDate, formatDateTime, todayISO } from "@/lib/utils"
import { toast } from "@/components/Toast"

const STATUS: Record<Reservation["status"], { label: string; cls: string }> = {
  reserved: { label: "Klaarleggen", cls: "bg-gold-soft text-[#7a5c17]" },
  picked_up: { label: "Opgehaald", cls: "bg-primary-soft text-primary" },
  expired: { label: "Verlopen", cls: "bg-stone-200 text-stone-600" },
  cancelled: { label: "Geannuleerd", cls: "bg-stone-200 text-stone-600" },
}

export function ReservationCard({ r }: { r: Reservation }) {
  const [more, setMore] = useState(false)
  const total = r.items.reduce((s, i) => s + i.price * i.quantity, 0)
  const isToday = r.pickupDate === todayISO()
  const st = STATUS[r.status]

  return (
    <li className={cn("overflow-hidden rounded-3xl bg-white shadow-sm ring-1", isToday && r.status === "reserved" ? "ring-2 ring-gold" : "ring-black/5")}>
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-lg font-bold">{r.customerName}</p>
          <p className="text-sm text-stone-500">
            Ophalen: <b className="text-ink">{isToday ? "vandaag" : formatDate(r.pickupDate)}</b>
          </p>
          {r.status === "reserved" && <p className="text-xs text-stone-400">Geldig tot {formatDateTime(r.expiresAt)}</p>}
          {r.status === "picked_up" && r.pickedUpAt && <p className="text-xs text-stone-400">Opgehaald {formatDateTime(r.pickedUpAt)}</p>}
        </div>
        <div className="text-right">
          <p className="font-mono text-lg font-bold tracking-wider text-accent">{r.code}</p>
          <span className={cn("inline-block rounded-full px-2 py-0.5 text-[11px] font-bold", st.cls)}>{st.label}</span>
        </div>
      </div>

      <ul className="space-y-1 border-y border-dashed border-stone-200 bg-stone-50 px-4 py-3 text-[15px]">
        {r.items.map((i) => (
          <li key={i.productId} className="flex justify-between gap-2">
            <span>
              <b>{i.quantity}×</b> {i.title}
            </span>
            <span className="text-stone-500">{euro(i.price * i.quantity)}</span>
          </li>
        ))}
        <li className="flex justify-between border-t border-stone-200 pt-1 font-bold">
          <span>Totaal</span>
          <span>{euro(total)}</span>
        </li>
      </ul>
      {r.note && <p className="bg-gold-soft px-4 py-2 text-sm">💬 “{r.note}”</p>}

      <div className="flex gap-2 p-3">
        {r.status === "reserved" ? (
          <button
            onClick={() => {
              actions.setReservationStatus(r.id, "picked_up")
              toast(`✔ ${r.customerName} heeft opgehaald`)
            }}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-white active:scale-[0.98]"
          >
            <Check className="h-6 w-6" /> Opgehaald
          </button>
        ) : (
          <button
            onClick={() => actions.setReservationStatus(r.id, "reserved")}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-stone-100 text-sm font-bold text-stone-600"
          >
            <RotateCcw className="h-4 w-4" /> Terugzetten naar klaarleggen
          </button>
        )}
        {r.customerPhone && (
          <a href={`tel:${r.customerPhone}`} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100" aria-label="Bellen">
            <Phone className="h-5 w-5" />
          </a>
        )}
        <button onClick={() => setMore((m) => !m)} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100" aria-label="Meer opties">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>
      {more && (
        <div className="animate-fade-up space-y-2 px-3 pb-3">
          <a href={`mailto:${r.customerEmail}?subject=${encodeURIComponent(`Je reservering ${r.code}`)}`} className="flex h-12 items-center gap-2 rounded-xl bg-stone-100 px-4 text-sm font-semibold">
            <Mail className="h-4 w-4" /> Mail {r.customerEmail}
          </a>
          {r.status === "reserved" && (
            <button
              onClick={() => {
                if (confirm("Reservering annuleren? De voorraad komt weer vrij.")) actions.setReservationStatus(r.id, "cancelled")
              }}
              className="flex h-12 w-full items-center gap-2 rounded-xl bg-accent-soft px-4 text-sm font-semibold text-accent"
            >
              <X className="h-4 w-4" /> Niet opgehaald / annuleren
            </button>
          )}
        </div>
      )}
    </li>
  )
}
