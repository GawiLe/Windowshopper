"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Crown, ExternalLink, Gift, LayoutDashboard, LogOut, Mail, Settings, ShoppingBag, Store } from "lucide-react"
import { sessionActions, useDB, useHydrated, useSession } from "@/lib/store"
import { inputCls } from "@/components/forms"
import { cn } from "@/lib/utils"
import { AreaMark } from "@/components/AreaBrand"

const NAV = [
  { href: "/admin", label: "Overzicht", icon: LayoutDashboard },
  { href: "/admin/winkels", label: "Winkels", icon: Store },
  { href: "/admin/producten", label: "Producten", icon: Gift },
  { href: "/admin/reserveringen", label: "Reserveringen", icon: ShoppingBag },
  { href: "/admin/postvak", label: "Mails", icon: Mail },
  { href: "/admin/instellingen", label: "Instellingen", icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated()
  const session = useSession()
  const pathname = usePathname()
  const db = useDB()

  if (!hydrated) return <div className="min-h-dvh bg-stone-50" />
  if (session?.role !== "admin") return <AdminLogin />

  const active = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href))

  return (
    <div className="min-h-dvh bg-stone-50 md:flex">
      <aside className="sticky top-0 z-30 bg-primary text-white md:h-dvh md:w-60 md:shrink-0">
        <div className="flex items-center justify-between px-4 py-3 md:block md:py-6">
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold">Beheer</p>
            <p className="truncate text-xs font-medium uppercase tracking-widest text-gold">{db.settings.areaName}</p>
          </div>
          <div className="flex gap-1 md:mt-4">
            <Link href="/" target="_blank" className="flex h-9 items-center gap-1 rounded-lg bg-white/10 px-3 text-xs font-bold">
              <ExternalLink className="h-3.5 w-3.5" /> Site
            </Link>
            <button onClick={() => sessionActions.logout()} className="flex h-9 items-center gap-1 rounded-lg bg-white/10 px-3 text-xs font-bold" aria-label="Uitloggen">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <nav className="scrollbar-none flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:px-3">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold",
                active(n.href) ? "bg-white text-primary" : "text-white/85 hover:bg-white/10",
              )}
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
        {session.isSuper && (
          <Link
            href="/superadmin"
            className="mx-3 mb-3 flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2.5 text-sm font-semibold text-gold md:mt-4"
          >
            <Crown className="h-4 w-4" /> Alle winkelgebieden
          </Link>
        )}
        <div className="gold-line md:hidden" />
      </aside>
      <main className="mx-auto w-full max-w-4xl px-4 pb-24 pt-6 md:px-8">{children}</main>
    </div>
  )
}

function AdminLogin() {
  const db = useDB()
  const [email, setEmail] = useState("")
  const [pw, setPw] = useState("")
  const [err, setErr] = useState("")
  const [busy, setBusy] = useState(false)
  return (
    <div className="starry flex min-h-dvh items-center justify-center bg-primary px-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          setErr((await sessionActions.loginAdmin(email, pw)) ?? "")
          setBusy(false)
        }}
        className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-6 shadow-2xl"
      >
        <AreaMark framed className="mx-auto h-12 text-[48px]" />
        <h1 className="text-center font-display text-2xl font-semibold text-primary">Beheer {db.settings.areaName}</h1>
        <input type="email" inputMode="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mailadres" className={inputCls} autoFocus required />
        <input type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Wachtwoord" className={inputCls} required />
        {err && <p className="text-sm font-semibold text-accent">{err}</p>}
        <button disabled={busy} className="h-12 w-full rounded-2xl bg-accent font-bold text-white disabled:opacity-60">Inloggen</button>
        <Link href="/" className="block text-center text-xs text-stone-500">
          ← Terug naar de site
        </Link>
      </form>
    </div>
  )
}
