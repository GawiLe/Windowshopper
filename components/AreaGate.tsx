"use client"

import { Store } from "lucide-react"
import { useDB, useHydrated } from "@/lib/store"
import { IconBadge } from "./Visuals"

/** Toont de webshop alleen als het winkelgebied actief is (de superadmin kan een gebied uitzetten). */
export function AreaGate({ children }: { children: React.ReactNode }) {
  const db = useDB()
  const hydrated = useHydrated()
  if (hydrated && !db.active) {
    return (
      <div className="wrap py-20">
        <div className="max-w-lg">
          <IconBadge icon={Store} className="mx-0" />
          <h1 className="mt-4 font-display text-3xl font-semibold text-primary">Binnenkort open</h1>
          <p className="mt-2 text-stone-600">De online winkelstraat van {db.settings.areaName} is op dit moment niet beschikbaar.</p>
        </div>
      </div>
    )
  }
  return <>{children}</>
}
