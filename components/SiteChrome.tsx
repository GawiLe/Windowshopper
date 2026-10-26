"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Gift, Home, ListChecks, MapPinned, Store } from "lucide-react"
import { useDB, useHydrated, useList } from "@/lib/store"
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
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 md:h-16">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="Naar de startpagina">
          <span className="gold-border flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg [--card-bg:var(--c-primary)]">
            🎄
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-display text-[17px] font-semibold tracking-tight md:text-lg">
              {settings.siteName}
            </span>
            <span className="gold-text block truncate text-[11px] font-bold uppercase tracking-[0.18em]">{settings.areaName}</span>
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
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm md:grid-cols-3">
        <div>
          <p className="font-display text-lg text-white">
            {settings.siteName} <span className="gold-text">{settings.areaName}</span>
          </p>
          <p className="mt-2 max-w-xs">{settings.footerText}</p>
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
      <p className="pb-6 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {settings.privacy.controllerName}
      </p>
    </footer>
  )
}
