// Feestelijke HTML-opmaak rond de platte tekst uit lib/emails.ts.
// Bewust simpele tabellen en inline styles: dat werkt in vrijwel elke mailapp.

export interface MailBrand {
  siteName: string
  areaName: string
  primary: string
  gold: string
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

function linkify(escaped: string, color: string) {
  return escaped.replace(/https?:\/\/[^\s<]+/g, (url) => `<a href="${url}" style="color:${color};font-weight:bold;word-break:break-all">${url}</a>`)
}

export function renderMailHtml(subject: string, body: string, brand: MailBrand) {
  const paragraphs = esc(body)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.55">${linkify(p, brand.primary).replace(/\n/g, "<br>")}</p>`)
    .join("")
  return `<!doctype html>
<html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;background:#fbf6ec;font-family:Helvetica,Arial,sans-serif;color:#2a2420">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf6ec;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden">
<tr><td style="background:${brand.primary};padding:22px 24px;color:#ffffff">
<div style="font-size:22px">🎄</div>
<div style="font-family:Georgia,serif;font-size:20px;font-weight:bold">${esc(brand.siteName)}</div>
<div style="color:${brand.gold};font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase">${esc(brand.areaName)}</div>
</td></tr>
<tr><td style="height:3px;background:${brand.gold}"></td></tr>
<tr><td style="padding:24px;font-size:15px">${paragraphs}</td></tr>
<tr><td style="padding:16px 24px;background:#f4efe4;color:#7a6f60;font-size:12px;text-align:center">❄ Fijne feestdagen ❄</td></tr>
</table>
</td></tr></table>
</body></html>`
}
