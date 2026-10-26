import type { Platform } from "./types"
import { createKempenaer, now } from "./seed"
import { createMijdrecht } from "./seed-mijdrecht"

export const PLATFORM_VERSION = 5

// SHA-256 van "windowshoppen:" + wachtwoord (demo). Wijzig het via Superadmin → Mijn account.
const SUPER_HASH = "692cc947c87c007aa6b742675a8785162d1c13d0e8017d8043fb548f63cccd4c"

export function createPlatform(): Platform {
  return {
    version: PLATFORM_VERSION,
    superAdmins: [{ id: "super_1", email: "lgawi@connect-create.nl", name: "Superadmin", passwordHash: SUPER_HASH, createdAt: now }],
    areas: [
      {
        id: "area_kempenaer",
        slug: "kempenaer",
        domains: ["shoppenkempenaer.nl", "www.shoppenkempenaer.nl"],
        admins: [],
        active: true,
        createdAt: now,
        ...createKempenaer(),
      },
      {
        id: "area_mijdrecht",
        slug: "mijdrecht",
        domains: ["shoppenmijdrecht.nl", "www.shoppenmijdrecht.nl"],
        admins: [],
        active: true,
        createdAt: now,
        ...createMijdrecht(),
      },
    ],
  }
}

/** Lege instellingen voor een nieuw winkelgebied, gebaseerd op het eerste gebied. */
export function blankAreaData(name: string, town: string) {
  const d = createMijdrecht()
  return {
    ...d,
    settings: {
      ...d.settings,
      areaName: name,
      town,
      heroTitle: `Kerstshoppen in ${name}`,
      introText: `De winkeliers van ${name} zetten deze december hun mooiste kadotips online.`,
      footerText: `Een initiatief van de winkeliers van ${name}.`,
      privacy: { ...d.settings.privacy, controllerName: `Winkeliersvereniging ${name}`, controllerAddress: town },
      brand: { logo: null, mark: null, favicon: null },
      updatedAt: new Date().toISOString(),
    },
    shops: [],
    products: [],
  }
}
