import type { Reservation, Shop, SiteSettings } from "./types"
import { euro, formatDate, formatDateTime } from "./utils"

// E-mailtemplates. In de demo worden mails niet echt verstuurd maar in de "Postvak"-log gezet
// (zichtbaar in /admin). In productie: verstuur deze teksten via bv. Resend vanuit een server action.

export function shopReservationEmail(settings: SiteSettings, shop: Shop, r: Reservation) {
  const lines = r.items.map((i) => `• ${i.quantity}× ${i.title} (${euro(i.price)})`).join("\n")
  return {
    to: shop.email,
    subject: `Nieuwe reservering ${r.code} – ophalen ${formatDate(r.pickupDate)}`,
    body: `Hoi ${shop.name},

Er is via ${settings.siteName} ${settings.areaName} iets bij jullie gereserveerd.

Ophaalcode: ${r.code}
Naam: ${r.customerName}
Telefoon: ${r.customerPhone || "–"}
E-mail: ${r.customerEmail}
Komt ophalen op: ${formatDate(r.pickupDate)}
Reservering geldig tot: ${formatDateTime(r.expiresAt)}

Producten:
${lines}
${r.note ? `\nOpmerking van de klant: "${r.note}"\n` : ""}
Leg de producten apart en vink de reservering af als ze zijn opgehaald via je winkeliersomgeving.

Let op: gebruik deze gegevens alleen voor deze reservering (zie de privacyverklaring).

Fijne feestdagen!
Team ${settings.siteName}`,
  }
}

export function customerConfirmationEmail(
  settings: SiteSettings,
  reservations: Reservation[],
  shops: Shop[],
  listUrl: string,
) {
  const first = reservations[0]
  const blocks = reservations
    .map((r) => {
      const shop = shops.find((s) => s.id === r.shopId)
      const items = r.items.map((i) => `   • ${i.quantity}× ${i.title} – ${euro(i.price * i.quantity)}`).join("\n")
      return `${shop?.name} – ${shop?.address}
   Ophaalcode: ${r.code}
${items}`
    })
    .join("\n\n")
  return {
    to: first.customerEmail,
    subject: `Je reservering bij ${settings.areaName} staat klaar`,
    body: `Hoi ${first.customerName},

Bedankt! De winkels hebben je reservering ontvangen. Je kunt je cadeaus ophalen en afrekenen op ${formatDate(
      first.pickupDate,
    )}. De reservering vervalt automatisch na ${settings.reservationHours} uur.

${blocks}

Je kadolijstje terugvinden en afvinken: ${listUrl}

Kun je toch niet komen? Laat het de winkel even weten, dan kan iemand anders er blij mee worden.

Gezellig shoppen!
De winkeliers van ${settings.areaName}`,
  }
}

export function listEmailBody(settings: SiteSettings, url: string, lines: string[]) {
  return `Mijn kadolijstje van ${settings.siteName} ${settings.areaName}

${lines.join("\n")}

Open en afvinken: ${url}`
}
