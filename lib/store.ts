"use client"

// Lokale "database" voor de demo: alles staat in localStorage van de browser.
// Alle schrijfacties lopen via de functies in `actions`, zodat je ze later 1-op-1 kunt
// vervangen door Neon-queries in server actions (zie docs/V0-MIGRATIE.md).

import { useSyncExternalStore } from "react"
import { createPlatform, PLATFORM_VERSION, blankAreaData } from "./platform-seed"
import type { AdminAccount, Area, Database, EmailLog, ListEntry, Platform, Product, Reservation, ReservationStatus, Shop, SiteSettings } from "./types"
import { customerConfirmationEmail, shopReservationEmail } from "./emails"
import { pickupCode, uid } from "./utils"
import { hashPassword } from "./password"

const PLATFORM_KEY = "ws-platform-v1"
const AREA_KEY = "ws-area-v1"
const LIST_KEY = "ws-lists-v1"

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

// ---------- platform & winkelgebieden (multi-tenant) ----------
// Het platform bevat alle winkelgebieden. Elk gebied heeft zijn eigen instellingen, winkels,
// producten, reserveringen, mails en beheerders. De app werkt altijd binnen precies één gebied:
// het gebied dat bij het domein hoort (bv. shoppenkempenaer.nl). Alleen op een onbekend domein
// (localhost, preview) kun je in de demo van gebied wisselen.

const platformStore = createStore<Platform>(PLATFORM_KEY, createPlatform, (p) => p?.version === PLATFORM_VERSION)
const chosenAreaStore = createStore<string | null>(AREA_KEY, () => null)

export function normalizeDomain(d: string) {
  return d
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "")
    .replace(/^www\./, "")
}

/** Gebied dat bij het huidige domein hoort (of null op localhost / previews). */
function areaForHost(p: Platform): Area | null {
  if (typeof window === "undefined") return null
  const host = normalizeDomain(window.location.hostname)
  return p.areas.find((a) => a.domains.some((d) => normalizeDomain(d) === host)) ?? null
}

function currentArea(): Area {
  const p = platformStore.get()
  const byHost = areaForHost(p)
  if (byHost) return byHost
  const chosen = chosenAreaStore.get()
  return p.areas.find((a) => a.id === chosen) ?? p.areas[0]
}

const subscribeArea = (l: () => void) => {
  const a = platformStore.subscribe(l)
  const b = chosenAreaStore.subscribe(l)
  return () => {
    a()
    b()
  }
}

/** Gegevens van het huidige winkelgebied. Alle acties hieronder werken alleen op dit gebied. */
const dbStore = {
  get: (): Area => currentArea(),
  getServer: (): Area => platformStore.getServer().areas[0],
  subscribe: subscribeArea,
  /** wijzig een gebied; standaard het huidige */
  set(updater: (db: Area) => Database, areaId = currentArea().id) {
    platformStore.set((p) => ({ ...p, areas: p.areas.map((a) => (a.id === areaId ? { ...a, ...updater(a) } : a)) }))
  },
}

export function useDB(): Area {
  return useSyncExternalStore(dbStore.subscribe, dbStore.get, dbStore.getServer)
}

export function usePlatform(): Platform {
  return useSyncExternalStore(platformStore.subscribe, platformStore.get, platformStore.getServer)
}

/** true als het domein vastligt (productie); dan kan er niet van gebied gewisseld worden. */
export function useDomainLocked(): boolean {
  return useSyncExternalStore(platformStore.subscribe, () => !!areaForHost(platformStore.get()), () => false)
}

// Kadolijstjes: per winkelgebied apart bewaard
const listStore = createStore<Record<string, ListEntry[]>>(LIST_KEY, () => ({}))
const emptyList: ListEntry[] = []

const subscribeList = (l: () => void) => {
  const a = subscribeArea(l)
  const b = listStore.subscribe(l)
  return () => {
    a()
    b()
  }
}

export function useList(): ListEntry[] {
  return useSyncExternalStore(subscribeList, () => listStore.get()[currentArea().id] ?? emptyList, () => emptyList)
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

// Mails die nog naar /api/mail (Resend) moeten. Ze worden eerst gelogd en daarna verstuurd.
const outbox: { mail: EmailLog; replyTo?: string }[] = []

type NewMail = Omit<EmailLog, "id" | "createdAt" | "status"> & { replyTo?: string }

function logEmail(db: Database, { replyTo, ...mail }: NewMail): Database {
  const entry: EmailLog = { ...mail, id: uid("mail"), createdAt: stamp(), status: "pending" }
  outbox.push({ mail: entry, replyTo })
  return { ...db, emails: [entry, ...db.emails].slice(0, 200) }
}

function setEmailStatus(areaId: string, id: string, status: EmailLog["status"], error?: string) {
  dbStore.set((db) => ({ ...db, emails: db.emails.map((m) => (m.id === id ? { ...m, status, error } : m)) }), areaId)
}

function flushOutbox() {
  const { settings, id: areaId } = dbStore.get()
  const brand = { siteName: settings.siteName, areaName: settings.areaName, primary: settings.colors.primary, gold: settings.colors.gold }
  for (const { mail, replyTo } of outbox.splice(0)) {
    fetch("/api/mail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: mail.kind, to: mail.to, subject: mail.subject, body: mail.body, replyTo, brand }),
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as { status?: EmailLog["status"]; error?: string }
        setEmailStatus(areaId, mail.id, data.status ?? "failed", data.error)
      })
      .catch(() => setEmailStatus(areaId, mail.id, "failed", "Geen verbinding met de mailserver"))
  }
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

  setShopLocation(id: string, lat: number, lng: number) {
    dbStore.set((db) => ({ ...db, shops: db.shops.map((s) => (s.id === id ? { ...s, lat, lng } : s)) }))
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
        if (shop) {
          next = logEmail(next, {
            ...shopReservationEmail(d.settings, shop, r),
            kind: "shop_new_reservation",
            replyTo: r.customerEmail, // winkel kan direct op de mail antwoorden
          })
        }
      }
      if (created.length) {
        next = logEmail(next, {
          ...customerConfirmationEmail(d.settings, created, d.shops, input.listUrl),
          kind: "customer_confirmation",
        })
      }
      return next
    })
    flushOutbox()
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

  logEmail(mail: NewMail) {
    dbStore.set((db) => logEmail(db, mail))
    flushOutbox()
  },

  /** zet het hele demo-platform terug (alle gebieden) */
  resetDemo() {
    platformStore.set(() => createPlatform())
  },

  /** importeert alleen gegevens in het huidige gebied; id, domeinen en beheerders blijven ongemoeid */
  importDB(db: Database) {
    const { settings, shops, products, reservations, emails } = db
    dbStore.set(() => ({ settings, shops, products, reservations: reservations ?? [], emails: emails ?? [] }))
  },
}

// ---------- kadolijstje (alleen lokaal) ----------

function setList(fn: (l: ListEntry[]) => ListEntry[]) {
  const id = currentArea().id
  listStore.set((all) => ({ ...all, [id]: fn(all[id] ?? []) }))
}

export const listActions = {
  toggle(productId: string) {
    setList((l) =>
      l.some((e) => e.productId === productId) ? l.filter((e) => e.productId !== productId) : [...l, { productId, checked: false, qty: 1 }],
    )
  },
  add(productId: string) {
    setList((l) => (l.some((e) => e.productId === productId) ? l : [...l, { productId, checked: false, qty: 1 }]))
  },
  remove(productId: string) {
    setList((l) => l.filter((e) => e.productId !== productId))
  },
  check(productId: string, checked: boolean) {
    setList((l) => l.map((e) => (e.productId === productId ? { ...e, checked } : e)))
  },
  qty(productId: string, qty: number) {
    setList((l) => l.map((e) => (e.productId === productId ? { ...e, qty: Math.max(1, Math.min(9, qty)) } : e)))
  },
  replace(entries: ListEntry[]) {
    setList(() => entries)
  },
  merge(entries: ListEntry[]) {
    setList((l) => {
      const map = new Map(l.map((e) => [e.productId, e]))
      entries.forEach((e) => map.set(e.productId, { ...map.get(e.productId), ...e }))
      return [...map.values()]
    })
  },
  clear() {
    setList(() => [])
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
// In productie: inloglink per e-mail + sessie-cookie (zie db/schema.sql: users, memberships, sessions).
// Een sessie hoort bij één winkelgebied (behalve die van de superadmin). Op een ander gebied geldt
// je dan als niet ingelogd, zodat beheerders en winkeliers nooit bij een ander gebied kunnen.

type RawSession =
  | { role: "shop"; areaId: string; shopId: string }
  | { role: "admin"; areaId: string; adminId: string; asShopId?: string }
  | { role: "super"; adminId: string; asShopId?: string }
  | null

/** Sessie zoals de pagina's hem zien. `admin` = beheerder van dit gebied óf superadmin. */
export type Session =
  | { role: "shop"; shopId: string }
  | { role: "admin"; asShopId?: string; isSuper: boolean }
  | null

const sessionStore = createStore<RawSession>("ws-session-v2", () => null)

function effectiveSession(raw: RawSession, area: Area): Session {
  if (!raw) return null
  if (raw.role === "super") return { role: "admin", asShopId: raw.asShopId, isSuper: true }
  if (raw.areaId !== area.id) return null
  if (raw.role === "shop") return area.shops.some((s) => s.id === raw.shopId) ? { role: "shop", shopId: raw.shopId } : null
  return area.admins.some((a) => a.id === raw.adminId) ? { role: "admin", asShopId: raw.asShopId, isSuper: false } : null
}

// cache, zodat useSyncExternalStore een stabiel object krijgt
let lastKey = ""
let lastSession: Session = null
function getSession(): Session {
  const raw = sessionStore.get()
  const area = currentArea()
  const s = effectiveSession(raw, area)
  const key = JSON.stringify(s)
  if (key !== lastKey) {
    lastKey = key
    lastSession = s
  }
  return lastSession
}

const subscribeSession = (l: () => void) => {
  const a = subscribeArea(l)
  const b = sessionStore.subscribe(l)
  return () => {
    a()
    b()
  }
}

export function useSession(): Session {
  return useSyncExternalStore(subscribeSession, getSession, () => null)
}

export function useIsSuper(): boolean {
  return useSyncExternalStore(sessionStore.subscribe, () => sessionStore.get()?.role === "super", () => false)
}

async function matchAccount(list: AdminAccount[], email: string, password: string) {
  const hash = await hashPassword(password)
  const e = email.trim().toLowerCase()
  return list.find((a) => a.email.toLowerCase() === e && a.passwordHash === hash) ?? null
}

export const sessionActions = {
  loginShop(shopId: string, code: string): string | null {
    const area = currentArea()
    const shop = area.shops.find((s) => s.id === shopId)
    if (!shop) return "Winkel niet gevonden"
    if (shop.loginCode.trim().toLowerCase() !== code.trim().toLowerCase()) return "Deze code klopt niet"
    sessionStore.set(() => ({ role: "shop", areaId: area.id, shopId }))
    return null
  },
  /** Beheerder van dit winkelgebied, of superadmin. */
  async loginAdmin(email: string, password: string): Promise<string | null> {
    const area = currentArea()
    const admin = await matchAccount(area.admins, email, password)
    if (admin) {
      sessionStore.set(() => ({ role: "admin", areaId: area.id, adminId: admin.id }))
      return null
    }
    const sup = await matchAccount(platformStore.get().superAdmins, email, password)
    if (sup) {
      sessionStore.set(() => ({ role: "super", adminId: sup.id }))
      return null
    }
    return "E-mailadres of wachtwoord klopt niet"
  },
  async loginSuper(email: string, password: string): Promise<string | null> {
    const sup = await matchAccount(platformStore.get().superAdmins, email, password)
    if (!sup) return "E-mailadres of wachtwoord klopt niet"
    sessionStore.set(() => ({ role: "super", adminId: sup.id }))
    return null
  },
  /** beheerder kijkt mee in de omgeving van een winkel */
  impersonate(shopId: string | undefined) {
    sessionStore.set((s) => (s && s.role !== "shop" ? { ...s, asShopId: shopId } : s))
  },
  logout() {
    sessionStore.set(() => null)
  },
}

// ---------- superadmin: winkelgebieden beheren ----------

function requireSuper() {
  if (sessionStore.get()?.role !== "super") throw new Error("Alleen voor de superadmin")
}

/** Controleert of domeinen geldig zijn en niet al bij een ander gebied horen. */
export function domainConflict(domains: string[], areaId: string | null): string | null {
  for (const d of domains) {
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(normalizeDomain(d))) return `"${d}" is geen geldige domeinnaam`
    const other = platformStore
      .get()
      .areas.find((a) => a.id !== areaId && a.domains.some((x) => normalizeDomain(x) === normalizeDomain(d)))
    if (other) return `${normalizeDomain(d)} hoort al bij ${other.settings.areaName}`
  }
  return null
}

export const platformActions = {
  /** In de demo (onbekend domein) van winkelgebied wisselen. */
  switchArea(areaId: string) {
    chosenAreaStore.set(() => areaId)
  },

  createArea(input: { name: string; town: string; slug: string; domains: string[] }): string | null {
    requireSuper()
    const p = platformStore.get()
    if (p.areas.some((a) => a.slug === input.slug)) return "Deze korte naam is al in gebruik"
    const conflict = domainConflict(input.domains, null)
    if (conflict) return conflict
    const area: Area = {
      id: uid("area"),
      slug: input.slug,
      domains: input.domains.map(normalizeDomain),
      admins: [],
      active: true,
      createdAt: stamp(),
      ...blankAreaData(input.name, input.town),
    }
    platformStore.set((pl) => ({ ...pl, areas: [...pl.areas, area] }))
    return null
  },

  updateArea(areaId: string, patch: { slug?: string; domains?: string[]; active?: boolean; name?: string; town?: string }): string | null {
    requireSuper()
    const p = platformStore.get()
    if (patch.slug && p.areas.some((a) => a.slug === patch.slug && a.id !== areaId)) return "Deze korte naam is al in gebruik"
    if (patch.domains) {
      const conflict = domainConflict(patch.domains, areaId)
      if (conflict) return conflict
    }
    platformStore.set((pl) => ({
      ...pl,
      areas: pl.areas.map((a) =>
        a.id !== areaId
          ? a
          : {
              ...a,
              slug: patch.slug ?? a.slug,
              active: patch.active ?? a.active,
              domains: patch.domains ? [...new Set(patch.domains.map(normalizeDomain))] : a.domains,
              settings: {
                ...a.settings,
                areaName: patch.name ?? a.settings.areaName,
                town: patch.town ?? a.settings.town,
              },
            },
      ),
    }))
    return null
  },

  deleteArea(areaId: string) {
    requireSuper()
    platformStore.set((pl) => ({ ...pl, areas: pl.areas.filter((a) => a.id !== areaId) }))
    listStore.set((all) => {
      const next = { ...all }
      delete next[areaId]
      return next
    })
    if (chosenAreaStore.get() === areaId) chosenAreaStore.set(() => null)
  },

  /** Beheerder toevoegen aan een gebied (superadmin, of beheerder van datzelfde gebied). */
  async addAreaAdmin(areaId: string, input: { email: string; name: string; password: string }): Promise<string | null> {
    const raw = sessionStore.get()
    const allowed = raw?.role === "super" || (raw?.role === "admin" && raw.areaId === areaId)
    if (!allowed) return "Geen toegang"
    const area = platformStore.get().areas.find((a) => a.id === areaId)
    if (!area) return "Gebied niet gevonden"
    if (area.admins.some((a) => a.email.toLowerCase() === input.email.trim().toLowerCase())) return "Deze beheerder bestaat al"
    const admin: AdminAccount = {
      id: uid("adm"),
      email: input.email.trim(),
      name: input.name.trim(),
      passwordHash: await hashPassword(input.password),
      createdAt: stamp(),
    }
    platformStore.set((pl) => ({
      ...pl,
      areas: pl.areas.map((a) => (a.id === areaId ? { ...a, admins: [...a.admins, admin] } : a)),
    }))
    return null
  },

  removeAreaAdmin(areaId: string, adminId: string): string | null {
    const raw = sessionStore.get()
    const allowed = raw?.role === "super" || (raw?.role === "admin" && raw.areaId === areaId && raw.adminId !== adminId)
    if (!allowed) return raw?.role === "admin" ? "Je kunt jezelf niet verwijderen" : "Geen toegang"
    platformStore.set((pl) => ({
      ...pl,
      areas: pl.areas.map((a) => (a.id === areaId ? { ...a, admins: a.admins.filter((x) => x.id !== adminId) } : a)),
    }))
    return null
  },

  /** Eigen wachtwoord wijzigen (beheerder of superadmin). */
  async changeOwnPassword(password: string): Promise<string | null> {
    const raw = sessionStore.get()
    if (!raw || raw.role === "shop") return "Niet ingelogd als beheerder"
    const hash = await hashPassword(password)
    platformStore.set((pl) =>
      raw.role === "super"
        ? { ...pl, superAdmins: pl.superAdmins.map((a) => (a.id === raw.adminId ? { ...a, passwordHash: hash } : a)) }
        : {
            ...pl,
            areas: pl.areas.map((ar) =>
              ar.id === raw.areaId ? { ...ar, admins: ar.admins.map((a) => (a.id === raw.adminId ? { ...a, passwordHash: hash } : a)) } : ar,
            ),
          },
    )
    return null
  },

  async addSuperAdmin(input: { email: string; name: string; password: string }): Promise<string | null> {
    requireSuper()
    if (platformStore.get().superAdmins.some((a) => a.email.toLowerCase() === input.email.trim().toLowerCase())) return "Bestaat al"
    const acc: AdminAccount = { id: uid("sup"), email: input.email.trim(), name: input.name.trim(), passwordHash: await hashPassword(input.password), createdAt: stamp() }
    platformStore.set((pl) => ({ ...pl, superAdmins: [...pl.superAdmins, acc] }))
    return null
  },

  removeSuperAdmin(id: string): string | null {
    requireSuper()
    const raw = sessionStore.get()
    if (raw?.role === "super" && raw.adminId === id) return "Je kunt jezelf niet verwijderen"
    platformStore.set((pl) => ({ ...pl, superAdmins: pl.superAdmins.filter((a) => a.id !== id) }))
    return null
  },
}
