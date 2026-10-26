// Gedeelde datatypes. Deze spiegelen 1-op-1 de tabellen in supabase/schema.sql,
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
  emoji: string
  address: string
  phone: string
  email: string // hier komen reserveringsmails binnen
  website: string
  instagram: string
  openingHours: OpeningHours[]
  /** positie op de geïllustreerde kaart, in procenten (0-100) */
  mapX: number
  mapY: number
  lat: number | null
  lng: number | null
  allowReservations: boolean
  active: boolean
  /** demo-inlog voor de winkelier. In productie: Supabase Auth (magic link). */
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
  emoji: string // fallback-illustratie als er geen foto is
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
  adminPassword: string // alleen voor de demo
  updatedAt: string
}

export interface Database {
  version: number
  settings: SiteSettings
  shops: Shop[]
  products: Product[]
  reservations: Reservation[]
  emails: EmailLog[]
}

/** Wat een bezoeker op zijn lijstje heeft. Leeft alleen in de browser / in een deel-link. */
export interface ListEntry {
  productId: ID
  checked: boolean
  qty: number
}
