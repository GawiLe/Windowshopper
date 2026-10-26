"use client"

import { useDB } from "@/lib/store"
import { formatDateTime } from "@/lib/utils"
import { PageTitle } from "../ui"

const STATUS: Record<string, { label: string; cls: string }> = {
  sent: { label: "Verstuurd", cls: "bg-primary-soft text-primary" },
  pending: { label: "Bezig…", cls: "bg-stone-100 text-stone-500" },
  demo: { label: "Niet verstuurd (demo)", cls: "bg-stone-100 text-stone-500" },
  failed: { label: "Mislukt", cls: "bg-accent-soft text-accent" },
}

const KIND: Record<string, string> = {
  shop_new_reservation: "Aan winkel",
  customer_confirmation: "Aan klant",
  customer_list: "Lijstje",
  shop_welcome: "Welkom winkel",
}

export default function Outbox() {
  const db = useDB()
  return (
    <div>
      <PageTitle
        title="Verstuurde mails"
        sub="Mails gaan via Resend zodra RESEND_API_KEY is ingesteld. Zonder sleutel zie je hier wat winkels en klanten zouden ontvangen."
      />
      {db.emails.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-stone-500">Nog geen mails. Plaats een reservering via de site om te testen.</p>
      ) : (
        <ul className="space-y-3">
          {db.emails.map((m) => (
            <li key={m.id}>
              <details className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                <summary className="cursor-pointer list-none p-4">
                  <div className="flex items-center justify-between gap-2 text-xs text-stone-500">
                    <span className="flex gap-1.5">
                      <span className="rounded-full bg-gold-soft px-2 py-0.5 font-bold text-ink">{KIND[m.kind]}</span>
                      {m.status && <span className={`rounded-full px-2 py-0.5 font-bold ${STATUS[m.status].cls}`}>{STATUS[m.status].label}</span>}
                    </span>
                    <span>{formatDateTime(m.createdAt)}</span>
                  </div>
                  <p className="mt-1 font-bold">{m.subject}</p>
                  <p className="text-sm text-stone-500">Aan: {m.to}</p>
                  {m.error && <p className="text-xs font-semibold text-accent">{m.error}</p>}
                </summary>
                <pre className="whitespace-pre-wrap border-t border-stone-100 p-4 font-sans text-sm leading-relaxed text-stone-700">{m.body}</pre>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
