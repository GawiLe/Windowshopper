import type { OpeningHours, Product } from "./types"

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`
}

export function pickupCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let s = ""
  for (let i = 0; i < 4; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)]
  return `KS-${s}`
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "en")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export const euro = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n)

export function isAvailable(p: Product) {
  return p.stockMode === "count" ? p.stock > 0 : p.inStock
}

export function stockLabel(p: Product): { text: string; tone: "ok" | "low" | "out" } {
  if (p.stockMode === "count") {
    if (p.stock <= 0) return { text: "Uitverkocht", tone: "out" }
    if (p.stock <= 3) return { text: `Nog ${p.stock} op voorraad`, tone: "low" }
    return { text: "Op voorraad", tone: "ok" }
  }
  return p.inStock ? { text: "Op voorraad", tone: "ok" } : { text: "Niet op voorraad", tone: "out" }
}

export const DAYS = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"]

export function todayISO(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return toISODate(d)
}

export function toISODate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }) {
  const d = iso.length === 10 ? new Date(iso + "T12:00:00") : new Date(iso)
  return new Intl.DateTimeFormat("nl-NL", opts).format(d)
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso))
}

export function openToday(hours: OpeningHours[], date = new Date()) {
  const h = hours.find((x) => x.day === date.getDay())
  if (!h || !h.open) return null
  return `${h.open} – ${h.close}`
}

export function isOpenOn(hours: OpeningHours[], iso: string) {
  const d = new Date(iso + "T12:00:00")
  const h = hours.find((x) => x.day === d.getDay())
  return !!h?.open
}

/** Verkleint een foto in de browser naar max. `max` px en geeft een JPEG data-URL terug. */
export function resizeImage(file: File, max = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error("Kon de foto niet lezen"))
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        if (!ctx) return reject(new Error("Canvas niet beschikbaar"))
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL("image/jpeg", quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim())
}

/** "a.nl, b.nl www.c.nl" → ["a.nl", "b.nl", "www.c.nl"] */
export function parseDomains(text: string) {
  return text
    .split(/[\s,;]+/)
    .map((d) => d.trim())
    .filter(Boolean)
}
