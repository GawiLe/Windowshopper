"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { CalendarCheck, Home, Package, Plus, Store, Eye } from "lucide-react"
import { sessionActions, useDB, useHydrated } from "@/lib/store"
import { ShopLogo } from "@/components/Visuals"
import { inputCls } from "@/components/forms"
import { cn } from "@/lib/utils"
import { useCurrentShop } from "./useShop"

export default function ShopkeeperLayout({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated()
  const { shop, session, db } = useCurrentShop()
  const pathname = usePathname()
  const router = useRouter()
  const adminWithoutShop = hydrated && !shop && session?.role === "admin"

  useEffect(() => {
    if (adminWithoutShop) router.replace("/admin/winkels")
  }, [adminWithoutShop, router])

  if (!hydrated || adminWithoutShop) return <div className="min-h-dvh bg-cream" />
  if (!shop) return <Login />

  const openRes = db.reservations.filter((r) => r.shopId === shop.id && r.status === "reserved").length
  const nav = [
    { href: "/winkelier", label: "Overzicht", icon: Home },
    { href: "/winkelier/reserveringen", label: "Ophalen", icon: CalendarCheck, badge: openRes },
    { href: "/winkelier/producten/nieuw", label: "Nieuw", icon: Plus, big: true },
    { href: "/winkelier/producten", label: "Producten", icon: Package },
    { href: "/winkelier/winkel", label: "Winkel", icon: Store },
  ]
  // op het productformulier staat een eigen opslaan-balk onderin
  const onForm = /^\/winkelier\/producten\/.+/.test(pathname)
  const active = (href: string) =>
    href === "/winkelier" ? pathname === href : href === "/winkelier/producten" ? pathname.startsWith(href) && !pathname.endsWith("/nieuw") : pathname.startsWith(href)

  return (
    <div className="min-h-dvh bg-stone-50 text-[16px]">
      {session?.role === "admin" && (
        <div className="flex items-center justify-between bg-gold px-4 py-2 text-sm font-bold text-ink">
          <span className="flex items-center gap-2">
            <Eye className="h-4 w-4" /> Je kijkt mee als admin
          </span>
          <button
            onClick={() => {
              sessionActions.impersonate(undefined)
              router.push("/admin/winkels")
            }}
            className="underline"
          >
            Terug naar beheer
          </button>
        </div>
      )}
      <header className="sticky top-0 z-30 bg-primary text-white shadow">
        <div className="mx-auto flex h-16 max-w-2xl items-center gap-3 px-4">
          <ShopLogo shop={shop} size={40} />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate font-bold">{shop.name}</p>
            <p className="text-xs text-white/70">Winkeliersomgeving · {db.settings.siteName}</p>
          </div>
          <Link href={`/winkel/${shop.slug}`} target="_blank" className="rounded-full bg-white/15 px-3 py-2 text-xs font-bold">
            Bekijk etalage
          </Link>
        </div>
        <div className="gold-line" />
      </header>
      <main className="mx-auto max-w-2xl px-4 pb-32 pt-5">{children}</main>
      <nav className={cn("pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white", onForm && "hidden")}>
        <ul className="mx-auto grid max-w-2xl grid-cols-5">
          {nav.map((n) => {
            const Icon = n.icon
            if (n.big)
              return (
                <li key={n.href} className="flex justify-center">
                  <Link href={n.href} className="-mt-6 flex h-16 w-16 flex-col items-center justify-center rounded-full bg-accent text-white shadow-lg ring-4 ring-white" aria-label="Nieuw product">
                    <Icon className="h-8 w-8" />
                  </Link>
                </li>
              )
            return (
              <li key={n.href}>
                <Link href={n.href} className={cn("relative flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-bold", active(n.href) ? "text-primary" : "text-stone-500")}>
                  <span className="relative">
                    <Icon className="h-6 w-6" />
                    {!!n.badge && (
                      <span className="absolute -right-2.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] text-white">{n.badge}</span>
                    )}
                  </span>
                  {n.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

function Login() {
  const db = useDB()
  const [shopId, setShopId] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)
  const shops = [...db.shops].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="starry flex min-h-dvh flex-col items-center justify-center bg-primary px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <p className="text-center text-4xl">🎄</p>
        <h1 className="mt-2 text-center font-display text-2xl font-semibold text-primary">Inloggen winkelier</h1>
        <p className="text-center text-sm text-stone-500">
          {db.settings.siteName} {db.settings.areaName}
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            const err = sessionActions.loginShop(shopId, code)
            setError(err ?? "")
          }}
        >
          <label className="block">
            <span className="text-sm font-bold">Jouw winkel</span>
            <select value={shopId} onChange={(e) => setShopId(e.target.value)} className={cn(inputCls, "mt-1")} required>
              <option value="">Kies je winkel…</option>
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-bold">Inlogcode</span>
            <input value={code} onChange={(e) => setCode(e.target.value)} className={cn(inputCls, "mt-1")} autoCapitalize="none" autoComplete="one-time-code" required />
          </label>
          {error && <p className="text-sm font-semibold text-accent">{error}</p>}
          <button className="h-14 w-full rounded-2xl bg-accent text-base font-bold text-white">Inloggen</button>
        </form>
        <button
          type="button"
          onClick={() => setSent(true)}
          className="mt-3 w-full text-center text-sm font-semibold text-primary underline"
        >
          Stuur mij een inloglink per e-mail
        </button>
        {sent && (
          <p className="mt-2 rounded-xl bg-primary-soft p-3 text-xs">
            In de live-versie ontvang je hier een inloglink (magic link) op het e-mailadres van je winkel. Gebruik in deze demo de
            inlogcode.
          </p>
        )}
        <details className="mt-5 rounded-xl bg-gold-soft p-3 text-xs">
          <summary className="cursor-pointer font-bold">Demo-inlogcodes</summary>
          <ul className="mt-2 space-y-0.5">
            {shops.map((s) => (
              <li key={s.id} className="flex justify-between">
                <span>{s.name}</span>
                <code className="font-bold">{s.loginCode}</code>
              </li>
            ))}
          </ul>
        </details>
        <Link href="/" className="mt-4 block text-center text-xs text-stone-500">
          ← Terug naar de winkelstraat
        </Link>
      </div>
    </div>
  )
}
