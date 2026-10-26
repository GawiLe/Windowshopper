"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Gift, Home, ListChecks, MapPinned, Store } from "lucide-react"
import { platformActions, useDB, useDomainLocked, useHydrated, useList, usePlatform } from "@/lib/store"
import { AreaLogo, AreaMark } from "./AreaBrand"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/", label: "Start", icon: Home },
  { href: "/winkelstraat", label: "Kado's", icon: Gift },
  { href: "/kaart", label: "Kaart", icon: MapPinned },
  { href: "/winkels", label: "Winkels", icon: Store },
  { href: "/lijstje", label: "Lijstje", icon: ListChecks },
]

function useListCount() {
  const list = useList()
  const hydrated = useHydrated()
  return hydrated ? list.filter((e) => !e.checked).length : 0
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  if (href === "/winkelstraat") return pathname.startsWith("/winkelstraat") || pathname.startsWith("/product")
  if (href === "/winkels") return pathname.startsWith("/winkel")
  return pathname.startsWith(href)
}

export function SiteHeader() {
  const { settings } = useDB()
  const pathname = usePathname()
  const count = useListCount()

  return (
    <header className="no-print sticky top-0 z-40 bg-primary text-white shadow-md">
      <div className="wrap flex h-16 items-center justify-between gap-3 md:h-20">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Naar de startpagina">
          <AreaMark className="h-7 text-[28px] sm:h-9 sm:text-[36px] md:h-11 md:text-[44px]" />
          <span className="min-w-0 border-l border-gold/40 pl-2.5 leading-tight sm:pl-3">
            <span className="block truncate font-display text-[17px] font-semibold md:text-xl">{settings.siteName}</span>
            <span className="block truncate text-[10px] font-medium uppercase tracking-[0.12em] text-gold sm:tracking-[0.22em] md:text-[11px]">
              Winkelgebied {settings.areaName}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Hoofdmenu">
          {NAV.slice(1).map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "relative rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-white/10",
                isActive(pathname, n.href) && "bg-white/15",
              )}
            >
              {n.label}
              {n.href === "/lijstje" && count > 0 && (
                <span className="ml-1.5 rounded-full bg-gold px-1.5 py-0.5 text-[11px] font-bold text-ink">{count}</span>
              )}
            </Link>
          ))}
        </nav>

        <Link
          href="/lijstje"
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 md:hidden"
          aria-label={`Mijn lijstje, ${count} items`}
        >
          <ListChecks className="h-5 w-5" />
          {count > 0 && (
            <span key={count} className="animate-pop absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-ink">
              {count}
            </span>
          )}
        </Link>
      </div>
      <div className="gold-line" />
    </header>
  )
}

export function BottomNav() {
  const pathname = usePathname()
  const count = useListCount()
  return (
    <nav
      aria-label="Navigatie"
      className="no-print pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-black/5 bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {NAV.map((n) => {
          const active = isActive(pathname, n.href)
          const Icon = n.icon
          return (
            <li key={n.href}>
              <Link
                href={n.href}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold",
                  active ? "text-primary" : "text-stone-500",
                )}
                aria-current={active ? "page" : undefined}
              >
                {active && <span className="absolute top-0 h-[3px] w-10 rounded-b-full bg-gold" />}
                <span className="relative">
                  <Icon className={cn("h-6 w-6", active && "stroke-[2.4]")} />
                  {n.href === "/lijstje" && count > 0 && (
                    <span key={count} className="animate-pop absolute -right-2.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                      {count}
                    </span>
                  )}
                </span>
                {n.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function SiteFooter() {
  const { settings } = useDB()
  return (
    <footer className="no-print mb-16 bg-primary text-white/85 md:mb-0">
      <div className="gold-line" />
      <div className="wrap grid gap-8 py-12 text-sm md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <AreaLogo className="h-28" />
          <p className="mt-4 max-w-sm">{settings.footerText}</p>
        </div>
        <div className="space-y-2">
          <p className="font-bold uppercase tracking-wider text-gold">Ontdekken</p>
          <ul className="space-y-1.5">
            <li><Link href="/winkelstraat" className="hover:underline">Alle kado&apos;s</Link></li>
            <li><Link href="/winkels" className="hover:underline">De winkels</Link></li>
            <li><Link href="/kaart" className="hover:underline">Plattegrond</Link></li>
            <li><Link href="/hoe-werkt-het" className="hover:underline">Hoe werkt het?</Link></li>
          </ul>
        </div>
        <div className="space-y-2">
          <p className="font-bold uppercase tracking-wider text-gold">Over</p>
          <ul className="space-y-1.5">
            <li><Link href="/privacy" className="hover:underline">Privacyverklaring</Link></li>
            <li><Link href="/winkelier" className="hover:underline">Inloggen voor winkeliers</Link></li>
            <li><Link href="/admin" className="hover:underline">Beheer</Link></li>
          </ul>
        </div>
      </div>
      <AreaSwitcher />
      <p className="pb-6 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {settings.privacy.controllerName}
      </p>
    </footer>
  )
}

/** Alleen in de demo / op localhost: wisselen tussen winkelgebieden. Op een echt domein onzichtbaar. */
function AreaSwitcher() {
  const locked = useDomainLocked()
  const hydrated = useHydrated()
  const platform = usePlatform()
  const db = useDB()
  if (!hydrated || locked || platform.areas.length < 2) return null
  return (
    <div className="wrap pb-6">
      <label className="flex flex-wrap items-center gap-2 rounded-xl bg-black/20 px-3 py-2 text-xs text-white/70">
        Demo – winkelgebied bekijken:
        <select
          value={db.id}
          onChange={(e) => {
            platformActions.switchArea(e.target.value)
            window.scrollTo({ top: 0 })
          }}
          className="rounded-lg bg-white/10 px-2 py-1 text-white"
        >
          {platform.areas.map((a) => (
            <option key={a.id} value={a.id} className="text-ink">
              {a.settings.areaName} ({a.domains[0] ?? a.slug})
            </option>
          ))}
        </select>
        <span>Op het echte domein zie je alleen dat ene gebied.</span>
      </label>
    </div>
  )
}
