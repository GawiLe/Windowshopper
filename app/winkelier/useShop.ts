"use client"

import { useDB, useSession } from "@/lib/store"

/** De winkel van de ingelogde winkelier (of de winkel waar de admin in meekijkt). */
export function useCurrentShop() {
  const db = useDB()
  const session = useSession()
  const shopId = session?.role === "shop" ? session.shopId : session?.role === "admin" ? session.asShopId : undefined
  const shop = db.shops.find((s) => s.id === shopId) ?? null
  return { db, shop, session }
}
