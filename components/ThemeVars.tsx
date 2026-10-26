"use client"

import { useEffect } from "react"
import { actions, platformActions, useDB, useDomainLocked, usePlatform } from "@/lib/store"
import { monogram } from "@/lib/icons"

/** Monogram-favicon in de kleuren van het gebied, voor als er geen eigen favicon is ingesteld. */
function monogramFavicon(name: string, bg: string, fg: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${bg}"/><text x="32" y="42" font-family="Georgia,serif" font-size="28" font-weight="700" text-anchor="middle" fill="${fg}">${monogram(name)}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/**
 * Zet huisstijl van het huidige winkelgebied (kleuren, favicon, titel), verwerkt ?gebied=… in de
 * demo en ruimt verlopen reserveringen op.
 */
export function ThemeVars() {
  const { settings } = useDB()
  const platform = usePlatform()
  const locked = useDomainLocked()
  const c = settings.colors

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty("--c-primary", c.primary)
    root.style.setProperty("--c-accent", c.accent)
    root.style.setProperty("--c-gold", c.gold)
    root.style.setProperty("--c-bg", c.background)
    root.style.setProperty("--c-text", c.text)
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", c.primary)
  }, [c.primary, c.accent, c.gold, c.background, c.text])

  // favicon per winkelgebied
  const favicon = settings.brand.favicon ?? monogramFavicon(settings.areaName, c.primary, c.gold)
  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"][data-area]')
    if (!link) {
      document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach((l) => l.remove())
      link = document.createElement("link")
      link.rel = "icon"
      link.dataset.area = "1"
      document.head.appendChild(link)
    }
    link.href = favicon
  }, [favicon])

  // demo: op een onbekend domein (localhost) kies je een gebied met ?gebied=slug
  useEffect(() => {
    if (locked) return
    const slug = new URLSearchParams(window.location.search).get("gebied")
    const area = slug && platform.areas.find((a) => a.slug === slug)
    if (area) platformActions.switchArea(area.id)
  }, [locked, platform.areas])

  useEffect(() => {
    actions.sweepExpired()
    const t = setInterval(() => actions.sweepExpired(), 60_000)
    return () => clearInterval(t)
  }, [])

  return null
}
