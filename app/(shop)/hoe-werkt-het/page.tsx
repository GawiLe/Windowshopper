"use client"

import Link from "next/link"
import { CalendarCheck, Footprints, ListChecks, Share2, Store } from "lucide-react"
import { useDB } from "@/lib/store"
import { Ornament } from "@/components/Visuals"

export default function HowPage() {
  const { settings } = useDB()
  const steps = [
    { icon: Store, t: "Windowshoppen", d: "Kijk rustig rond in de online etalages van de winkels in de straat. Tik op een kado voor meer informatie." },
    { icon: ListChecks, t: "Kadolijstje maken", d: "Tik op de + om iets op je lijstje te zetten. Je hebt geen account nodig: het lijstje blijft bewaard op je telefoon." },
    { icon: Share2, t: "Bewaren of delen", d: "Mail het lijstje naar jezelf of deel het via WhatsApp. Zo heb je het altijd bij de hand, ook op een andere telefoon." },
    { icon: CalendarCheck, t: "Laten reserveren", d: `Wil je zeker zijn dat het er nog is? Laat het gratis ${settings.reservationHours} uur apart leggen. Je ontvangt een ophaalcode per winkel.` },
    { icon: Footprints, t: "Langs de winkels", d: "Je lijstje is per winkel gesorteerd in de volgorde van de straat. Haal je kado's op, reken af in de winkel en vink ze af!" },
  ]
  return (
    <div className="wrap max-w-3xl pt-6 lg:ml-[max(0px,calc((100vw-82rem)/2))]">
      <h1 className="font-display text-3xl font-semibold text-primary">Hoe werkt het?</h1>
      <p className="mt-1 text-stone-600">{settings.introText}</p>
      <Ornament className="my-6 justify-start" />
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={s.t} className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-gold">
              <s.icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="font-bold">
                {i + 1}. {s.t}
              </p>
              <p className="text-sm text-stone-600">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
      <Link href="/winkelstraat" className="mt-6 inline-flex h-14 items-center justify-center rounded-xl bg-primary px-6 font-semibold text-white shadow-md">
        Begin met windowshoppen
      </Link>
    </div>
  )
}
