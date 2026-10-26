"use client"

import "leaflet/dist/leaflet.css"
import { useEffect, useRef, useState } from "react"
import type { Map as LeafletMap, Marker } from "leaflet"
import { actions, useDB } from "@/lib/store"
import { geocodeAddress } from "@/lib/geo"
import { monogram } from "@/lib/icons"
import type { Shop } from "@/lib/types"
import { cn } from "@/lib/utils"

// Echte kaart (Leaflet + OpenStreetMap-data, kaartstijl CARTO Voyager).
// Winkels zonder coördinaten worden automatisch opgezocht via hun adres (PDOK).

const TILES = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>'

// adressen die deze sessie al zijn opgezocht (ook als dat mislukte), om niet steeds opnieuw te vragen
const tried = new Set<string>()

/** Tijdelijke plek voor winkels zonder coördinaten: netjes op een rij rond het middelpunt. */
function fallbackPos(i: number, total: number, center: { lat: number; lng: number }) {
  const t = total > 1 ? i / (total - 1) - 0.5 : 0
  return { lat: center.lat + t * 0.0022, lng: center.lng + t * 0.0012 + (i % 2 ? 0.00012 : -0.00012) }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)

function pinHtml(shop: Shop, n: number | undefined, selected: boolean, small: boolean) {
  const size = small ? 34 : selected ? 52 : 44
  const inner = shop.logo
    ? `<img src="${esc(shop.logo)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:9999px" />`
    : `<span style="font-family:var(--font-display),Georgia,serif;font-weight:600;color:${shop.coverColor};font-size:${size * 0.36}px">${esc(monogram(shop.name))}</span>`
  return `
  <div class="ws-pin${selected ? " ws-pin--active" : ""}" style="--pin:${shop.coverColor};width:${size}px">
    <div class="ws-pin__head" style="width:${size}px;height:${size}px">
      <div class="ws-pin__inner">${inner}</div>
      ${n !== undefined && !small ? `<span class="ws-pin__num">${n}</span>` : ""}
    </div>
    <div class="ws-pin__tip"></div>
    ${!small ? `<div class="ws-pin__label">${esc(shop.name)}</div>` : ""}
  </div>`
}

export function ShopMap({
  shops,
  selectedId,
  onSelect,
  onPick,
  compact = false,
  numbered = false,
  className,
}: {
  shops: Shop[]
  selectedId?: string | null
  onSelect?: (shop: Shop) => void
  /** admin: klik op de kaart om de geselecteerde winkel te verplaatsen */
  onPick?: (lat: number, lng: number) => void
  compact?: boolean
  numbered?: boolean
  className?: string
}) {
  const { settings } = useDB()
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<LeafletMap | null>(null)
  const markers = useRef<Marker[]>([])
  const [L, setL] = useState<typeof import("leaflet") | null>(null)
  const callbacks = useRef({ onSelect, onPick })
  useEffect(() => {
    callbacks.current = { onSelect, onPick }
  })

  // Leaflet pas in de browser laden
  useEffect(() => {
    let cancelled = false
    import("leaflet").then((mod) => !cancelled && setL(mod))
    return () => {
      cancelled = true
    }
  }, [])

  // kaart aanmaken
  useEffect(() => {
    if (!L || !el.current || map.current) return
    const m = L.map(el.current, {
      center: [settings.map.lat, settings.map.lng],
      zoom: settings.map.zoom,
      zoomControl: !compact,
      attributionControl: true,
      scrollWheelZoom: false,
      dragging: !compact,
      touchZoom: !compact,
      doubleClickZoom: !compact,
      boxZoom: !compact,
      keyboard: !compact,
    })
    L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 20, subdomains: "abcd" }).addTo(m)
    m.on("click", (e) => callbacks.current.onPick?.(e.latlng.lat, e.latlng.lng))
    map.current = m
    return () => {
      m.remove()
      map.current = null
    }
  }, [L, compact, settings.map.lat, settings.map.lng, settings.map.zoom])

  // ontbrekende coördinaten opzoeken via het adres
  useEffect(() => {
    const missing = shops.filter((s) => (s.lat == null || s.lng == null) && !tried.has(`${s.id}|${s.address}`))
    if (!missing.length) return
    missing.forEach((s) => tried.add(`${s.id}|${s.address}`))
    let cancelled = false
    ;(async () => {
      for (const s of missing) {
        const pos = await geocodeAddress(s.address, settings.town)
        if (cancelled) return
        if (pos) actions.setShopLocation(s.id, pos.lat, pos.lng)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [shops, settings.town])

  // markers tekenen
  useEffect(() => {
    const m = map.current
    if (!L || !m) return
    markers.current.forEach((mk) => mk.remove())
    markers.current = []
    shops.forEach((s, i) => {
      const pos = s.lat != null && s.lng != null ? { lat: s.lat, lng: s.lng } : fallbackPos(i, shops.length, settings.map)
      const selected = s.id === selectedId
      const n = numbered ? shops.indexOf(s) + 1 : undefined
      const icon = L.divIcon({
        html: pinHtml(s, n, selected, compact),
        className: "ws-pin-wrap",
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      })
      const mk = L.marker([pos.lat, pos.lng], { icon, zIndexOffset: selected ? 1000 : 0, keyboard: !compact, title: s.name })
      mk.on("click", () => callbacks.current.onSelect?.(s))
      mk.addTo(m)
      markers.current.push(mk)
    })
  }, [L, shops, selectedId, compact, numbered, settings.map])

  // alle winkels in beeld (eerste keer), of naar de geselecteerde winkel
  const fitted = useRef("")
  useEffect(() => {
    const m = map.current
    if (!L || !m) return
    const posOf = (s: Shop, i: number) =>
      (s.lat != null && s.lng != null ? [s.lat, s.lng] : (({ lat, lng }) => [lat, lng])(fallbackPos(i, shops.length, settings.map))) as [number, number]
    const selIdx = shops.findIndex((s) => s.id === selectedId)
    if (selIdx >= 0 && !onPick) {
      m.flyTo(posOf(shops[selIdx], selIdx), Math.max(m.getZoom(), 17), { duration: 0.6 })
      return
    }
    const pts = shops.map(posOf)
    // opnieuw inpassen zodra er (nieuwe) coördinaten bekend zijn
    const key = pts.map((p) => p.join(",")).join(";")
    if (fitted.current !== key && pts.length > 1) {
      m.fitBounds(L.latLngBounds(pts), { padding: compact ? [24, 24] : [56, 56], maxZoom: 18 })
      fitted.current = key
    }
  }, [L, shops, selectedId, compact, onPick, settings.map])

  return (
    <div className={cn("relative isolate z-0 overflow-hidden bg-[#f2efe9]", className)}>
      <div ref={el} className="absolute inset-0" aria-label="Kaart met de winkels" role="application" />
      {!L && <div className="absolute inset-0 flex items-center justify-center text-sm text-stone-400">Kaart laden…</div>}
    </div>
  )
}
