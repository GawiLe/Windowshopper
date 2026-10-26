"use client"

import { useEffect } from "react"
import { actions, useDB } from "@/lib/store"

/** Zet de kleuren uit de admin-instellingen als CSS-variabelen en ruimt verlopen reserveringen op. */
export function ThemeVars() {
  const { settings } = useDB()
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

  useEffect(() => {
    actions.sweepExpired()
    const t = setInterval(() => actions.sweepExpired(), 60_000)
    return () => clearInterval(t)
  }, [])

  return null
}
