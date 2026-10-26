"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { sessionActions } from "@/lib/store"
import { ShopForm } from "@/components/ShopForm"
import { useCurrentShop } from "../useShop"

export default function ShopProfilePage() {
  const { shop, session } = useCurrentShop()
  const router = useRouter()
  if (!shop) return null
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-primary">Mijn winkel</h1>
      <p className="mb-5 text-sm text-stone-500">Dit zien bezoekers bovenaan je winkelpagina.</p>
      <ShopForm key={shop.id + shop.createdAt} shop={shop} />
      <div className="mt-8 rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-black/5">
        <p className="font-bold">Privacy</p>
        <p className="mt-1 text-stone-600">
          Gegevens van klanten die reserveren mag je alleen gebruiken voor die reservering. Verwijder reserveringsmails na het ophalen.
        </p>
      </div>
      {session?.role === "shop" && (
        <button
          onClick={() => {
            sessionActions.logout()
            router.push("/winkelier")
          }}
          className="mt-4 mb-24 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-stone-200 font-bold text-stone-700"
        >
          <LogOut className="h-5 w-5" /> Uitloggen
        </button>
      )}
    </div>
  )
}
