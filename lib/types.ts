// Gedeelde datatypes. Deze spiegelen 1-op-1 de tabellen in db/schema.sql (Neon),
// zodat de lokale demo-opslag later eenvoudig vervangen kan worden door een echte database.

export type ID = string

export interface OpeningHours {
  /** 0 = zondag … 6 = zaterdag */
  day: number
  open: string | null // "09:00" of null = gesloten
  close: string | null
}

export interface Shop {
  id: ID
  slug: string
  name: string
  tagline: string
  bio: string
  category: string
  logo: string | null // data-URL of URL
  coverColor: string
  icon: string // sleutel uit lib/icons.ts, gebruikt als er geen logo is
  address: string
  phone: string
  email: string // hier komen reserveringsmails binnen
  website: string
  instagram: string
  openingHours: OpeningHours[]
  /** plek op de kaart; leeg = wordt automatisch opgezocht aan de hand van het adres */
  lat: number | null
  lng: number | null
  allowReservations: boolean
  active: boolean
  /** demo-inlog voor de winkelier. In productie: inloglink per e-mail (tabellen users/login_tokens/sessions). */
  loginCode: string
  createdAt: string
}

export type StockMode = "count" | "toggle"

export interface Product {
  id: ID
  shopId: ID
  title: string
  description: string
  price: number // in euro's
  images: string[] // data-URL's of URL's
  icon: string // sleutel uit lib/icons.ts: illustratie zolang er geen foto is
  category: string
  tags: string[]
  stockMode: StockMode
  stock: number // gebruikt als stockMode === "count"
  inStock: boolean // gebruikt als stockMode === "toggle"
  reservable: boolean
  active: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type ReservationStatus = "reserved" | "picked_up" | "expired" | "cancelled"

export interface ReservationItem {
  productId: ID
  title: string
  price: number
  quantity: number
}

export interface Reservation {
  id: ID
  code: string // korte ophaalcode, bv. "KK-4F7Q"
  orderId: ID // groepeert reserveringen van één checkout over meerdere winkels
  shopId: ID
  customerName: string
  customerEmail: string
  customerPhone: string
  pickupDate: string // YYYY-MM-DD
  note: string
  items: ReservationItem[]
  status: ReservationStatus
  createdAt: string
  expiresAt: string
  pickedUpAt: string | null
}

export interface EmailLog {
  id: ID
  to: string
  subject: string
  body: string
  kind: "shop_new_reservation" | "customer_confirmation" | "customer_list" | "shop_welcome"
  /** sent = via Resend verstuurd, demo = geen Resend-sleutel ingesteld, failed = fout bij versturen */
  status?: "pending" | "sent" | "demo" | "failed"
  error?: string
  createdAt: string
}

export interface SiteSettings {
  siteName: string
  areaName: string
  town: string
  heroTitle: string
  heroSubtitle: string
  introText: string
  footerText: string
  campaignStart: string
  campaignEnd: string
  maxProductsPerShop: number
  reservationHours: number
  reservationsEnabled: boolean
  snowEnabled: boolean
  /** middelpunt en zoomniveau van de kaart */
  map: { lat: number; lng: number; zoom: number }
  colors: {
    primary: string // dennengroen
    accent: string // kerstrood
    gold: string
    background: string // crème
    text: string
  }
  categories: string[]
  privacy: {
    controllerName: string
    controllerAddress: string
    contactEmail: string
    kvk: string
    retentionDays: number
  }
  /** logo's van het winkelgebied (URL of data-URL); goed zichtbaar op de hoofdkleur */
  brand: {
    logo: string | null // volledig logo (footer)
    mark: string | null // klein beeldmerk (menubalk)
    favicon: string | null // icoontje in het browsertabblad
  }
  updatedAt: string
}

/** Beheerder (van één winkelgebied, of superadmin). Wachtwoord alleen als hash. */
export interface AdminAccount {
  id: ID
  email: string
  name: string
  passwordHash: string // demo: SHA-256; live: bcrypt in users.password_hash
  createdAt: string
}

/** Alle gegevens van één winkelgebied. Gegevens van verschillende gebieden raken elkaar nooit. */
export interface Database {
  settings: SiteSettings
  shops: Shop[]
  products: Product[]
  reservations: Reservation[]
  emails: EmailLog[]
}

/** Een winkelgebied (tenant) met eigen domeinen en beheerders. */
export interface Area extends Database {
  id: ID
  slug: string
  /** domeinnamen waarop dit gebied draait, bv. ["shoppenkempenaer.nl", "www.shoppenkempenaer.nl"] */
  domains: string[]
  admins: AdminAccount[]
  active: boolean
  createdAt: string
}

/** Het hele platform: alle winkelgebieden + superadmins. */
export interface Platform {
  version: number
  areas: Area[]
  superAdmins: AdminAccount[]
}

/** Wat een bezoeker op zijn lijstje heeft. Leeft alleen in de browser / in een deel-link. */
export interface ListEntry {
  productId: ID
  checked: boolean
  qty: number
}
