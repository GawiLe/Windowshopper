"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Minus, Plus, Trash2 } from "lucide-react"
import { actions, useDB } from "@/lib/store"
import type { Product, Shop } from "@/lib/types"
import { cn, uid } from "@/lib/utils"
import { Field, inputCls, PhotoPicker, Segmented, Switch } from "@/components/forms"
import { toast } from "@/components/Toast"

const EMOJIS = ["🎁", "📚", "🧸", "🕯️", "🧣", "💍", "🍫", "☕", "🌿", "🎄", "⭐", "🧀", "🍷", "🧴", "👜", "🎨"]

export function ProductForm({ shop, product }: { shop: Shop; product?: Product }) {
  const db = useDB()
  const router = useRouter()
  const isNew = !product
  const [p, setP] = useState<Product>(
    () =>
      product ?? {
        id: uid("prod"),
        shopId: shop.id,
        title: "",
        description: "",
        price: 0,
        images: [],
        emoji: shop.emoji || "🎁",
        category: shop.category,
        tags: [],
        stockMode: "toggle",
        stock: 1,
        inStock: true,
        reservable: true,
        active: true,
        sortOrder: Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
  )
  const [priceText, setPriceText] = useState(product ? product.price.toFixed(2).replace(".", ",") : "")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((x) => ({ ...x, [k]: v }))

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const price = parseFloat(priceText.includes(",") ? priceText.replace(/\./g, "").replace(",", ".") : priceText) || 0
    const err: Record<string, string> = {}
    if (p.title.trim().length < 2) err.title = "Geef je product een naam"
    if (!(price > 0)) err.price = "Vul een prijs in, bijv. 24,95"
    setErrors(err)
    if (Object.keys(err).length) {
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    const msg = actions.upsertProduct({ ...p, title: p.title.trim(), price: Math.round(price * 100) / 100 })
    if (msg) return toast(msg)
    toast(isNew ? "🎉 Je product staat online!" : "Opgeslagen")
    router.push("/winkelier/producten")
  }

  return (
    <form onSubmit={save} className="space-y-6" noValidate>
      <section>
        <h2 className="mb-2 text-[15px] font-bold">Foto&apos;s</h2>
        <PhotoPicker images={p.images} onChange={(imgs) => set("images", imgs)} />
        {p.images.length === 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-xs text-stone-500">Nog geen foto? Kies dan een plaatje als tijdelijke illustratie:</p>
            <div className="scrollbar-none flex gap-1.5 overflow-x-auto">
              {EMOJIS.map((e) => (
                <button type="button" key={e} onClick={() => set("emoji", e)} className={cn("h-11 w-11 shrink-0 rounded-xl text-2xl", p.emoji === e ? "bg-gold-soft ring-2 ring-gold" : "bg-white ring-1 ring-stone-200")}>
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <Field label="Naam van het product" error={errors.title}>
        <input value={p.title} onChange={(e) => set("title", e.target.value)} maxLength={80} placeholder="Bijv. Geurkaars Dennenbos" className={inputCls} />
      </Field>

      <Field label="Prijs" error={errors.price}>
        <span className="relative block">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-stone-400">€</span>
          <input
            value={priceText}
            onChange={(e) => setPriceText(e.target.value.replace(/[^0-9.,]/g, ""))}
            inputMode="decimal"
            placeholder="24,95"
            className={cn(inputCls, "pl-10 text-lg font-bold")}
          />
        </span>
      </Field>

      <Field label="Omschrijving" hint="Wat maakt dit een leuk kado? Een paar zinnen is genoeg.">
        <textarea
          value={p.description}
          onChange={(e) => set("description", e.target.value)}
          rows={4}
          maxLength={800}
          className={cn(inputCls, "h-auto py-3")}
        />
      </Field>

      <Field label="Categorie">
        <select value={p.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
          {db.settings.categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>

      <section className="space-y-3">
        <h2 className="text-[15px] font-bold">Voorraad</h2>
        <Segmented
          value={p.stockMode}
          onChange={(v) => set("stockMode", v)}
          options={[
            { value: "toggle", label: "Simpel: aan/uit" },
            { value: "count", label: "Aantal bijhouden" },
          ]}
        />
        {p.stockMode === "toggle" ? (
          <Segmented
            value={p.inStock ? "yes" : "no"}
            onChange={(v) => set("inStock", v === "yes")}
            options={[
              { value: "yes", label: "✅ Op voorraad" },
              { value: "no", label: "⛔ Niet op voorraad" },
            ]}
          />
        ) : (
          <div className="flex items-center justify-between rounded-2xl bg-white p-3 ring-1 ring-stone-200">
            <button type="button" onClick={() => set("stock", Math.max(0, p.stock - 1))} className="flex h-14 w-14 items-center justify-center rounded-xl bg-stone-100" aria-label="Minder">
              <Minus className="h-6 w-6" />
            </button>
            <div className="text-center">
              <input
                value={p.stock}
                onChange={(e) => set("stock", Math.max(0, parseInt(e.target.value || "0", 10) || 0))}
                inputMode="numeric"
                className="w-20 bg-transparent text-center text-3xl font-bold focus:outline-none"
                aria-label="Aantal op voorraad"
              />
              <p className="text-xs text-stone-500">op voorraad</p>
            </div>
            <button type="button" onClick={() => set("stock", p.stock + 1)} className="flex h-14 w-14 items-center justify-center rounded-xl bg-stone-100" aria-label="Meer">
              <Plus className="h-6 w-6" />
            </button>
          </div>
        )}
        <p className="text-xs text-stone-500">
          {p.stockMode === "count"
            ? "Bij een reservering gaat het aantal automatisch omlaag. Op 0 = uitverkocht."
            : "Handig als je de voorraad niet precies wilt bijhouden."}
        </p>
      </section>

      <section className="space-y-2">
        <Switch
          checked={p.reservable}
          onChange={(v) => set("reservable", v)}
          label="Mag gereserveerd worden"
          description={`Klanten kunnen dit ${db.settings.reservationHours} uur laten apart leggen`}
        />
        <Switch checked={p.active} onChange={(v) => set("active", v)} label="Zichtbaar in de webshop" description="Uitzetten = tijdelijk verbergen" />
      </section>

      <div className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-stone-200 bg-white p-3">
        <div className="mx-auto flex max-w-2xl gap-2">
          {!isNew && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`"${p.title}" definitief verwijderen?`)) {
                  actions.deleteProduct(p.id)
                  toast("Product verwijderd")
                  router.push("/winkelier/producten")
                }
              }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent"
              aria-label="Verwijderen"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
          <button type="button" onClick={() => router.back()} className="h-14 rounded-2xl bg-stone-100 px-5 font-bold">
            Annuleer
          </button>
          <button type="submit" className="h-14 flex-1 rounded-2xl bg-accent text-base font-bold text-white shadow">
            {isNew ? "Zet online" : "Opslaan"}
          </button>
        </div>
      </div>
    </form>
  )
}
