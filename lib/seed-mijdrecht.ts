import type { Database, Product, Shop } from "./types"
import { hours, now } from "./seed"

// Voorbeeld van een tweede winkelgebied (Mijdrecht). Alle winkels zijn fictief.

const base = { logo: null, website: "", instagram: "", lat: null, lng: null, active: true, createdAt: now, allowReservations: true }

const shops: Shop[] = [
  {
    ...base,
    id: "mdr_shop_1",
    slug: "bakkerij-de-veenmolen",
    name: "Bakkerij De Veenmolen",
    tagline: "Ambachtelijk brood & kerstbrood",
    bio: "Al drie generaties bakken we elke nacht vers. In december staat de winkel vol kerststollen en banketletters.",
    category: "Eten & drinken",
    coverColor: "#7a4b2a",
    icon: "croissant",
    address: "Dorpsstraat 18",
    phone: "0297-000001",
    email: "veenmolen@example.nl",
    openingHours: hours(false),
    loginCode: "molen2026",
  },
  {
    ...base,
    id: "mdr_shop_2",
    slug: "boekhandel-het-plein",
    name: "Boekhandel Het Plein",
    tagline: "Boeken, spellen & papierwaren",
    bio: "De gezelligste boekhandel van Mijdrecht, met een grote kinderhoek en altijd een goed leesadvies.",
    category: "Boeken & papier",
    coverColor: "#1d3557",
    icon: "library",
    address: "Dorpsstraat 31",
    phone: "0297-000002",
    email: "hetplein@example.nl",
    openingHours: hours(),
    loginCode: "plein2026",
  },
  {
    ...base,
    id: "mdr_shop_3",
    slug: "wonen-aan-de-vaart",
    name: "Wonen aan de Vaart",
    tagline: "Interieur & cadeaus",
    bio: "Sfeervolle woonaccessoires, kaarsen en cadeaus voor elk budget.",
    category: "Wonen & lifestyle",
    coverColor: "#2a6f6a",
    icon: "sofa",
    address: "Dorpsstraat 44",
    phone: "0297-000003",
    email: "aandevaart@example.nl",
    openingHours: hours(),
    loginCode: "vaart2026",
  },
]

type P = [title: string, price: number, icon: string, description: string, opts?: Partial<Product>]

const productSeeds: Record<string, P[]> = {
  mdr_shop_1: [
    ["Kerststol met spijs", 12.95, "wheat", "Rijk gevulde stol met amandelspijs, rozijnen en sukade.", { reservable: true }],
    ["Banketletter naar keuze", 8.5, "cookie", "Met de hand gerolde banketletter met echte roomboter."],
  ],
  mdr_shop_2: [
    ["Spel ‘Winterdorp’", 32.5, "dice", "Coöperatief bordspel voor de hele familie, vanaf 8 jaar.", { stockMode: "count", stock: 4 }],
    ["Prentenboek ‘De sneeuwuil’", 15.99, "book-open", "Een warm voorleesverhaal voor de feestdagen."],
  ],
  mdr_shop_3: [
    ["Kerstster van rotan", 22.95, "star", "Natuurlijke ster om voor het raam te hangen."],
    ["Geurkaars ‘Winteravond’", 18.5, "flame", "Geurkaars met kaneel en sinaasappel, brandtijd ±35 uur."],
  ],
}

const products: Product[] = Object.entries(productSeeds).flatMap(([shopId, list]) =>
  list.map(([title, price, icon, description, opts], i) => ({
    id: `${shopId}_p${i + 1}`,
    shopId,
    title,
    description,
    price,
    images: [],
    icon,
    category: shops.find((s) => s.id === shopId)!.category,
    tags: [],
    stockMode: "toggle" as const,
    stock: 0,
    inStock: true,
    reservable: true,
    active: true,
    sortOrder: i,
    createdAt: now,
    updatedAt: now,
    ...opts,
  })),
)

export function createMijdrecht(): Database {
  return {
    settings: {
      siteName: "Windowshoppen",
      areaName: "Mijdrecht Centrum",
      town: "Mijdrecht",
      heroTitle: "Kerstshoppen in Mijdrecht Centrum",
      heroSubtitle: "Ontdek de kadotips van de winkels in het centrum, maak je lijstje en haal je cadeaus op in het dorp.",
      introText:
        "De winkeliers van Mijdrecht Centrum zetten deze december hun mooiste kadotips online. Zet ze op je lijstje, laat ze een dag reserveren en haal ze op in de winkel.",
      footerText: "Een initiatief van de winkeliers van Mijdrecht Centrum.",
      campaignStart: "2026-11-20",
      campaignEnd: "2026-12-31",
      maxProductsPerShop: 20,
      reservationHours: 24,
      reservationsEnabled: true,
      snowEnabled: true,
      map: { lat: 52.2063, lng: 4.864, zoom: 17 },
      colors: { primary: "#1d3557", accent: "#c8102e", gold: "#d4a24c", background: "#f6f7fb", text: "#1d2230" },
      categories: ["Boeken & papier", "Eten & drinken", "Wonen & lifestyle", "Kinderen & speelgoed", "Mode & sieraden", "Overig"],
      privacy: {
        controllerName: "Ondernemersvereniging Mijdrecht Centrum",
        controllerAddress: "Dorpsstraat, Mijdrecht",
        contactEmail: "privacy@example.nl",
        kvk: "00000000",
        retentionDays: 30,
      },
      brand: { logo: null, mark: null, favicon: null },
      updatedAt: now,
    },
    shops: structuredClone(shops),
    products: structuredClone(products),
    reservations: [],
    emails: [],
  }
}
