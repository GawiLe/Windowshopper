"use client"

import Link from "next/link"
import { useState } from "react"
import { Crown, LogOut } from "lucide-react"
import { sessionActions, useHydrated, useIsSuper } from "@/lib/store"
import { inputCls } from "@/components/forms"

export default function SuperLayout({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated()
  const isSuper = useIsSuper()
  if (!hydrated) return <div className="min-h-dvh bg-stone-50" />
  if (!isSuper) return <SuperLogin />
  return (
    <div className="min-h-dvh bg-stone-50">
      <header className="bg-[#14171a] text-white">
        <div className="wrap flex h-16 items-center justify-between gap-3">
          <Link href="/superadmin" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/20 text-gold">
              <Crown className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block font-semibold">Superadmin</span>
              <span className="block text-xs text-white/60">Alle winkelgebieden</span>
            </span>
          </Link>
          <button onClick={() => sessionActions.logout()} className="flex h-9 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-sm font-medium">
            <LogOut className="h-4 w-4" /> Uitloggen
          </button>
        </div>
      </header>
      <main className="wrap pb-24 pt-6">{children}</main>
    </div>
  )
}

function SuperLogin() {
  const [email, setEmail] = useState("")
  const [pw, setPw] = useState("")
  const [err, setErr] = useState("")
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#14171a] px-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          setErr((await sessionActions.loginSuper(email, pw)) ?? "")
        }}
        className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-6 shadow-2xl"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/20 text-[#8f6f3d]">
          <Crown className="h-6 w-6" />
        </span>
        <h1 className="text-center font-display text-2xl font-semibold">Superadmin</h1>
        <p className="text-center text-sm text-stone-500">Beheer van alle winkelgebieden</p>
        <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mailadres" className={inputCls} required />
        <input type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Wachtwoord" className={inputCls} required />
        {err && <p className="text-sm font-semibold text-red-700">{err}</p>}
        <button className="h-12 w-full rounded-2xl bg-[#14171a] font-semibold text-white">Inloggen</button>
      </form>
    </div>
  )
}
