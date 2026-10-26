import { NextResponse } from "next/server"
import { Resend } from "resend"
import { renderMailHtml, type MailBrand } from "@/lib/mail-html"

// Verstuurt mails via Resend (https://resend.com).
// Zonder RESEND_API_KEY antwoordt de route met status "demo" en wordt er niets verstuurd.
//
// LET OP: in de demo komt de mailinhoud uit de browser (de data staat in localStorage).
// In de live-versie met Neon roep je sendMail() direct aan vanuit de server action, met
// inhoud die op de server is opgebouwd, en verwijder je deze publieke route.

const KINDS = new Set(["shop_new_reservation", "customer_confirmation", "shop_welcome"])
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const HEX = /^#[0-9a-fA-F]{6}$/

// eenvoudige rem tegen misbruik: max. 20 mails per IP per 10 minuten (per serverinstantie)
const hits = new Map<string, number[]>()
function rateLimited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > 20
}

export async function POST(req: Request) {
  const key = process.env.RESEND_API_KEY
  if (!key) return NextResponse.json({ status: "demo" })

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "onbekend"
  if (rateLimited(ip)) return NextResponse.json({ status: "failed", error: "Te veel mails, probeer het later opnieuw" }, { status: 429 })

  let input: { kind?: string; to?: string; subject?: string; body?: string; replyTo?: string; brand?: Partial<MailBrand> }
  try {
    input = await req.json()
  } catch {
    return NextResponse.json({ status: "failed", error: "Ongeldige aanvraag" }, { status: 400 })
  }
  const { kind = "", to = "", subject = "", body = "", replyTo } = input
  if (!KINDS.has(kind) || !EMAIL.test(to) || !subject || subject.length > 200 || !body || body.length > 6000) {
    return NextResponse.json({ status: "failed", error: "Ongeldige mail" }, { status: 400 })
  }

  const brand: MailBrand = {
    siteName: String(input.brand?.siteName ?? "Windowshoppen").slice(0, 60),
    areaName: String(input.brand?.areaName ?? "").slice(0, 60),
    primary: HEX.test(input.brand?.primary ?? "") ? input.brand!.primary! : "#1f4d3a",
    gold: HEX.test(input.brand?.gold ?? "") ? input.brand!.gold! : "#c9a24a",
  }

  const resend = new Resend(key)
  const { data, error } = await resend.emails.send({
    from: process.env.MAIL_FROM ?? "Windowshoppen <onboarding@resend.dev>",
    to: [to],
    subject,
    text: body,
    html: renderMailHtml(subject, body, brand),
    replyTo: replyTo && EMAIL.test(replyTo) ? replyTo : undefined,
    tags: [{ name: "kind", value: kind }],
  })
  if (error) return NextResponse.json({ status: "failed", error: error.message }, { status: 502 })
  return NextResponse.json({ status: "sent", id: data?.id })
}
