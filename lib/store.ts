"use client"

// Lokale "database" voor de demo: alles staat in localStorage van de browser.
// Alle schrijfacties lopen via de functies in `actions`, zodat je ze later 1-op-1 kunt
// vervangen door Supabase-calls / server actions (zie docs/V0-MIGRATIE.md).

import { useSyncExternalStore } from "react"
import { createSeed, DB_VERSION } from "./seed"
import type { Database, EmailLog, ListEntry, Product, Reservation, ReservationStatus, Shop, SiteSettings } from "./types"
import { customerConfirmationEmail, shopReservationEmail } from "./emails"
import { pickupCode, uid } from "./utils"

const DB_KEY = "ws-db-v1"
const LIST_KEY = "ws-list-v1"

// ---------- generieke mini-store ----------

function createStore<T>(key: string, initial: () => T, validate?: (v: T) => boolean) {
  let state: T | null = null
  const serverState = initial()
  const listeners = new Set<() => void>()

  const load = (): T => {
    if (state) return state
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw) as T
        if (!validate || validate(parsed)) {
          state = parsed
          return state
        }
      }
    } catch {
      /* negeren */
    }
    state = initial()
    return state
  }

  const persist = () => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch (e) {
      console.error(e)
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("ws-toast", {
            detail: "Opslag van de browser is vol. Gebruik kleinere of minder foto's (in de echte versie speelt dit niet).",
          }),
        )
      }
    }
  }

  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key === key) {
        state = null
        load()
        listeners.forEach((l) => l())
      }
    })
  }

  return {
    get: load,
    getServer: () => serverState,
    set(updater: (draft: T) => T) {
      state = updater(load())
      persist()
      listeners.forEach((l) => l())
    },
    subscribe(l: () => void) {
      listeners.add(l)
      return () => listeners.delete(l)
    },
  }
}

const dbStore = createStore<Database>(DB_KEY, createSeed, (d) => d?.version === DB_VERSION)
const listStore = createStore<ListEntry[]>(LIST_KEY, () => [])

const emptyList: ListEntry[] = []

export function useDB(): Database {
  return useSyncExternalStore(dbStore.subscribe, dbStore.get, dbStore.getServer)
}

export function useList(): ListEntry[] {
  return useSyncExternalStore(listStore.subscribe, listStore.get, () => emptyList)
}

/** true zodra we in de browser zitten en localStorage gelezen is (voorkomt flitsen van seed-data). */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}

export function getDB() {
  return dbStore.get()
}

// ---------- helpers ----------

const stamp = () => new Date().toISOString()

function adjustStock(products: Product[], productId: string, delta: number): Product[] {
  return products.map((p) =>
    p.id === productId && p.stockMode === "count" ? { ...p, stock: Math.max(0, p.stock + delta), updatedAt: stamp() } : p,
  )
}

function logEmail(db: Database, mail: Omit<EmailLog, "id" | "createdAt">): Database {
  return { ...db, emails: [{ ...mail, id: uid("mail"), createdAt: stamp() }, ...db.emails].slice(0, 200) }
}

// ---------- acties ----------

export const actions = {
  updateSettings(patch: Partial<SiteSettings>) {
    dbStore.set((db) => ({ ...db, settings: { ...db.settings, ...patch, updatedAt: stamp() } }))
  },

  upsertShop(shop: Shop) {
    dbStore.set((db) => {
      const exists = db.shops.some((s) => s.id === shop.id)
      return { ...db, shops: exists ? db.shops.map((s) => (s.id === shop.id ? shop : s)) : [...db.shops, shop] }
    })
  },

  deleteShop(id: string) {
    dbStore.set((db) => ({
      ...db,
      shops: db.shops.filter((s) => s.id !== id),
      products: db.products.filter((p) => p.shopId !== id),
    }))
  },

  /** Geeft een foutmelding terug als het maximum is bereikt. */
  upsertProduct(product: Product): string | null {
    const db = dbStore.get()
    const exists = db.products.some((p) => p.id === product.id)
    if (!exists) {
      const count = db.products.filter((p) => p.shopId === product.shopId).length
      if (count >= db.settings.maxProductsPerShop) {
        return `Je kunt maximaal ${db.settings.maxProductsPerShop} producten plaatsen.`
      }
    }
    const next = { ...product, updatedAt: stamp() }
    dbStore.set((d) => ({
      ...d,
      products: exists ? d.products.map((p) => (p.id === product.id ? next : p)) : [...d.products, next],
    }))
    return null
  },

  deleteProduct(id: string) {
    dbStore.set((db) => ({ ...db, products: db.products.filter((p) => p.id !== id) }))
  },

  moveProduct(id: string, dir: -1 | 1) {
    dbStore.set((db) => {
      const p = db.products.find((x) => x.id === id)
      if (!p) return db
      const siblings = db.products.filter((x) => x.shopId === p.shopId).sort((a, b) => a.sortOrder - b.sortOrder)
      const idx = siblings.findIndex((x) => x.id === id)
      const swap = siblings[idx + dir]
      if (!swap) return db
      return {
        ...db,
        products: db.products.map((x) =>
          x.id === p.id ? { ...x, sortOrder: swap.sortOrder } : x.id === swap.id ? { ...x, sortOrder: p.sortOrder } : x,
        ),
      }
    })
  },

  createReservations(input: {
    name: string
    email: string
    phone: string
    pickupDate: string
    note: string
    items: { productId: string; quantity: number }[]
    listUrl: string
  }): Reservation[] {
    const db = dbStore.get()
    const orderId = uid("order")
    const expires = new Date(input.pickupDate + "T23:59:00")
    // reservering blijft minimaal `reservationHours` geldig, en tot het einde van de ophaaldag
    const minExpiry = new Date(Date.now() + db.settings.reservationHours * 3600 * 1000)
    const expiresAt = (expires > minExpiry ? expires : minExpiry).toISOString()

    const byShop = new Map<string, Reservation>()
    for (const it of input.items) {
      const p = db.products.find((x) => x.id === it.productId)
      if (!p) continue
      let r = byShop.get(p.shopId)
      if (!r) {
        r = {
          id: uid("res"),
          code: pickupCode(),
          orderId,
          shopId: p.shopId,
          customerName: input.name.trim(),
          customerEmail: input.email.trim(),
          customerPhone: input.phone.trim(),
          pickupDate: input.pickupDate,
          note: input.note.trim(),
          items: [],
          status: "reserved",
          createdAt: stamp(),
          expiresAt,
          pickedUpAt: null,
        }
        byShop.set(p.shopId, r)
      }
      r.items.push({ productId: p.id, title: p.title, price: p.price, quantity: it.quantity })
    }
    const created = [...byShop.values()]

    dbStore.set((d) => {
      let next: Database = { ...d, reservations: [...created, ...d.reservations] }
      for (const r of created) {
        for (const i of r.items) next = { ...next, products: adjustStock(next.products, i.productId, -i.quantity) }
        const shop = d.shops.find((s) => s.id === r.shopId)
        if (shop) next = logEmail(next, { ...shopReservationEmail(d.settings, shop, r), kind: "shop_new_reservation" })
      }
      if (created.length) {
        next = logEmail(next, {
          ...customerConfirmationEmail(d.settings, created, d.shops, input.listUrl),
          kind: "customer_confirmation",
        })
      }
      return next
    })
    return created
  },

  setReservationStatus(id: string, status: ReservationStatus) {
    dbStore.set((db) => {
      const r = db.reservations.find((x) => x.id === id)
      if (!r) return db
      let products = db.products
      const wasHolding = r.status === "reserved" || r.status === "picked_up"
      const willHold = status === "reserved" || status === "picked_up"
      if (wasHolding && !willHold) for (const i of r.items) products = adjustStock(products, i.productId, i.quantity)
      if (!wasHolding && willHold) for (const i of r.items) products = adjustStock(products, i.productId, -i.quantity)
      return {
        ...db,
        products,
        reservations: db.reservations.map((x) =>
          x.id === id ? { ...x, status, pickedUpAt: status === "picked_up" ? stamp() : null } : x,
        ),
      }
    })
  },

  /** Zet verlopen reserveringen op "expired" en geeft de voorraad weer vrij. */
  sweepExpired() {
    const db = dbStore.get()
    const now = Date.now()
    const overdue = db.reservations.filter((r) => r.status === "reserved" && new Date(r.expiresAt).getTime() < now)
    overdue.forEach((r) => actions.setReservationStatus(r.id, "expired"))
  },

  /** Verwijdert persoonsgegevens van afgeronde reserveringen ouder dan de bewaartermijn. */
  purgeOldPersonalData() {
    dbStore.set((db) => {
      const cutoff = Date.now() - db.settings.privacy.retentionDays * 86400 * 1000
      return {
        ...db,
        reservations: db.reservations.filter(
          (r) => r.status === "reserved" || new Date(r.createdAt).getTime() > cutoff,
        ),
        emails: db.emails.filter((m) => new Date(m.createdAt).getTime() > cutoff),
      }
    })
  },

  logEmail(mail: Omit<EmailLog, "id" | "createdAt">) {
    dbStore.set((db) => logEmail(db, mail))
  },

  resetDemo() {
    dbStore.set(() => createSeed())
  },

  importDB(db: Database) {
    dbStore.set(() => db)
  },
}

// ---------- kadolijstje (alleen lokaal) ----------

export const listActions = {
  toggle(productId: string) {
    listStore.set((l) =>
      l.some((e) => e.productId === productId) ? l.filter((e) => e.productId !== productId) : [...l, { productId, checked: false, qty: 1 }],
    )
  },
  add(productId: string) {
    listStore.set((l) => (l.some((e) => e.productId === productId) ? l : [...l, { productId, checked: false, qty: 1 }]))
  },
  remove(productId: string) {
    listStore.set((l) => l.filter((e) => e.productId !== productId))
  },
  check(productId: string, checked: boolean) {
    listStore.set((l) => l.map((e) => (e.productId === productId ? { ...e, checked } : e)))
  },
  qty(productId: string, qty: number) {
    listStore.set((l) => l.map((e) => (e.productId === productId ? { ...e, qty: Math.max(1, Math.min(9, qty)) } : e)))
  },
  replace(entries: ListEntry[]) {
    listStore.set(() => entries)
  },
  merge(entries: ListEntry[]) {
    listStore.set((l) => {
      const map = new Map(l.map((e) => [e.productId, e]))
      entries.forEach((e) => map.set(e.productId, { ...map.get(e.productId), ...e }))
      return [...map.values()]
    })
  },
  clear() {
    listStore.set(() => [])
  },
}

// Deel-link: het lijstje wordt in de URL gecodeerd, zodat er niets op een server bewaard hoeft te worden.
export function encodeList(entries: ListEntry[]) {
  return entries.map((e) => `${e.productId}${e.qty > 1 ? `*${e.qty}` : ""}${e.checked ? "!" : ""}`).join(",")
}

export function decodeList(s: string): ListEntry[] {
  return s
    .split(",")
    .filter(Boolean)
    .map((part) => {
      const checked = part.endsWith("!")
      const clean = checked ? part.slice(0, -1) : part
      const [productId, q] = clean.split("*")
      return { productId, checked, qty: q ? Math.max(1, Math.min(9, parseInt(q, 10) || 1)) : 1 }
    })
}

// ---------- sessie (demo-inlog) ----------
// In productie vervang je dit door Supabase Auth (magic link per e-mail) + Row Level Security.

export type Session = { role: "shop"; shopId: string } | { role: "admin"; asShopId?: string } | null

const sessionStore = createStore<Session>("ws-session-v1", () => null)

export function useSession(): Session {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.get, () => null)
}

export const sessionActions = {
  loginShop(shopId: string, code: string): string | null {
    const shop = dbStore.get().shops.find((s) => s.id === shopId)
    if (!shop) return "Winkel niet gevonden"
    if (shop.loginCode.trim().toLowerCase() !== code.trim().toLowerCase()) return "Deze code klopt niet"
    sessionStore.set(() => ({ role: "shop", shopId }))
    return null
  },
  loginAdmin(password: string): string | null {
    if (password !== dbStore.get().settings.adminPassword) return "Onjuist wachtwoord"
    sessionStore.set(() => ({ role: "admin" }))
    return null
  },
  /** admin kijkt mee in de omgeving van een winkel */
  impersonate(shopId: string | undefined) {
    sessionStore.set(() => ({ role: "admin", asShopId: shopId }))
  },
  logout() {
    sessionStore.set(() => null)
  },
}
