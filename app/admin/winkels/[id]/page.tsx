"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { actions, useDB } from "@/lib/store"
import { ShopForm } from "@/components/ShopForm"
import type { Shop } from "@/lib/types"
import { uid } from "@/lib/utils"
import { PageTitle } from "../../ui"

function blankShop(category: string): Shop {
  const code = Math.random().toString(36).slice(2, 8)
  return {
    id: uid("shop"),
    slug: "",
    name: "",
    tagline: "",
    bio: "",
    category,
    logo: null,
    coverColor: "#1f4d3a",
    emoji: "🎁",
    address: "De Kempenaerstraat ",
    phone: "",
    email: "",
    website: "",
    instagram: "",
    openingHours: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: day === 0 ? null : "09:30", close: day === 0 ? null : "18:00" })),
    mapX: 50,
    mapY: 40,
    lat: null,
    lng: null,
    allowReservations: true,
    active: true,
    loginCode: code,
    createdAt: new Date().toISOString(),
  }
}

export default function AdminShopEdit() {
  const { id } = useParams<{ id: string }>()
  const db = useDB()
  const router = useRouter()
  const isNew = id === "nieuw"
  const [fresh] = useState(() => blankShop(db.settings.categories[0]))
  const shop = isNew ? fresh : db.shops.find((s) => s.id === id)

  if (!shop) return <p>Winkel niet gevonden.</p>

  return (
    <div className="max-w-xl">
      <Link href="/admin/winkels" className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-stone-500">
        <ArrowLeft className="h-4 w-4" /> Alle winkels
      </Link>
      <PageTitle title={isNew ? "Nieuwe winkel" : shop.name} sub={isNew ? "Vul de gegevens in en sla op" : undefined} />
      <ShopForm
        key={shop.id}
        shop={shop}
        admin
        onSaved={(s) => {
          if (isNew) {
            actions.logEmail({
              kind: "shop_welcome",
              to: s.email,
              subject: `Welkom bij ${db.settings.siteName} ${db.settings.areaName}! 🎄`,
              body: `Hoi ${s.name},\n\nLeuk dat jullie meedoen! Via ${typeof window !== "undefined" ? window.location.origin : ""}/winkelier kun je inloggen en tot ${db.settings.maxProductsPerShop} kadotips plaatsen. Maak gewoon een foto met je telefoon.\n\nJe inlogcode (demo): ${s.loginCode}\n\nFijne decembermaand!`,
            })
            router.replace(`/admin/winkels/${s.id}`)
          }
        }}
      />
    </div>
  )
}
