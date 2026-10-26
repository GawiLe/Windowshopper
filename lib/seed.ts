import type { Database, OpeningHours, Product, Shop } from "./types"

// Demo-data. Alle winkels hieronder zijn fictief en dienen alleen om de app te laten zien.

const hours = (late = true): OpeningHours[] => [
  { day: 0, open: null, close: null },
  { day: 1, open: "13:00", close: "18:00" },
  { day: 2, open: "09:30", close: "18:00" },
  { day: 3, open: "09:30", close: "18:00" },
  { day: 4, open: "09:30", close: "18:00" },
  { day: 5, open: "09:30", close: late ? "21:00" : "18:00" },
  { day: 6, open: "09:30", close: "17:00" },
]

const now = new Date("2026-11-01T10:00:00").toISOString()

type ShopSeed = Omit<Shop, "id" | "createdAt" | "openingHours" | "lat" | "lng" | "active" | "logo" | "website" | "instagram"> &
  Partial<Shop>

const shopSeeds: ShopSeed[] = [
  {
    slug: "de-boekenhoek",
    name: "De Boekenhoek",
    tagline: "Boeken, kaarten & leesplezier",
    bio: "Al ruim dertig jaar dé boekwinkel van het dorp. Wij pakken elk boek gratis in met een strik van goudlint en helpen je graag aan het perfecte leescadeau.",
    category: "Boeken & papier",
    coverColor: "#2f5d50",
    icon: "library",
    address: "De Kempenaerstraat 12",
    phone: "071-0000001",
    email: "boekenhoek@example.nl",
    allowReservations: true,
    loginCode: "boek2026",
  },
  {
    slug: "kaas-en-zo",
    name: "Kaas & Zo",
    tagline: "Delicatessen en kerstpakketten",
    bio: "Ambachtelijke kazen, lokale lekkernijen en de mooiste kerstpakketten op maat. Proeven mag altijd!",
    category: "Eten & drinken",
    coverColor: "#c9a24a",
    icon: "utensils",
    address: "De Kempenaerstraat 21",
    phone: "071-0000002",
    email: "kaasenzo@example.nl",
    allowReservations: true,
    loginCode: "kaas2026",
  },
  {
    slug: "studio-linde",
    name: "Studio Linde",
    tagline: "Woonaccessoires met een verhaal",
    bio: "Een conceptstore vol duurzame woonaccessoires, kaarsen en handgemaakte keramiek van Nederlandse makers.",
    category: "Wonen & lifestyle",
    coverColor: "#8c3b3b",
    icon: "flame",
    address: "De Kempenaerstraat 30",
    phone: "071-0000003",
    email: "studiolinde@example.nl",
    allowReservations: true,
    loginCode: "linde2026",
  },
  {
    slug: "speelgoed-de-tol",
    name: "Speelgoed De Tol",
    tagline: "Houten speelgoed & spelletjes",
    bio: "Klassiek en duurzaam speelgoed voor groot en klein. Bij ons mag je alles even uitproberen.",
    category: "Kinderen & speelgoed",
    coverColor: "#b3262e",
    icon: "toy-brick",
    address: "De Kempenaerstraat 37",
    phone: "071-0000004",
    email: "detol@example.nl",
    allowReservations: true,
    loginCode: "tol2026",
  },
  {
    slug: "bloem-en-blad",
    name: "Bloem & Blad",
    tagline: "Bloemen, kransen & kerstgroen",
    bio: "Seizoensbloemen, handgebonden kerstkransen en groen voor op tafel. We bezorgen ook in het dorp.",
    category: "Bloemen & planten",
    coverColor: "#3e7a4f",
    icon: "flower2",
    address: "De Kempenaerstraat 44",
    phone: "071-0000005",
    email: "bloemenblad@example.nl",
    allowReservations: true,
    loginCode: "bloem2026",
  },
  {
    slug: "atelier-goudsmid",
    name: "Atelier Goudsmid",
    tagline: "Sieraden, handgemaakt in het dorp",
    bio: "In ons atelier achter de winkel maken we sieraden van gerecycled goud en zilver. Graveren doen we ter plekke.",
    category: "Mode & sieraden",
    coverColor: "#a8812f",
    icon: "gem",
    address: "De Kempenaerstraat 51",
    phone: "071-0000006",
    email: "goudsmid@example.nl",
    allowReservations: true,
    loginCode: "goud2026",
  },
  {
    slug: "koffiebar-hazelaar",
    name: "Koffiebar Hazelaar",
    tagline: "Koffie, thee & lekkers",
    bio: "Zelfgebrande bonen, losse thee en de lekkerste kerstkoekjes. Drink ook een warme chocomel tijdens het shoppen!",
    category: "Eten & drinken",
    coverColor: "#6b4a34",
    icon: "coffee",
    address: "De Kempenaerstraat 58",
    phone: "071-0000007",
    email: "hazelaar@example.nl",
    allowReservations: false,
    loginCode: "koffie2026",
  },
  {
    slug: "mode-merel",
    name: "Mode Merel",
    tagline: "Dames- en herenmode",
    bio: "Warme truien, zachte sjaals en feestelijke outfits. Persoonlijk advies en gratis cadeauverpakking.",
    category: "Mode & sieraden",
    coverColor: "#1f3b5c",
    icon: "shirt",
    address: "De Kempenaerstraat 63",
    phone: "071-0000008",
    email: "merel@example.nl",
    allowReservations: true,
    loginCode: "merel2026",
  },
]

const shops: Shop[] = shopSeeds.map((s, i) => ({
  id: `shop_${i + 1}`,
  logo: null,
  website: "",
  instagram: "",
  lat: null,
  lng: null,
  active: true,
  openingHours: hours(),
  createdAt: now,
  ...s,
}))

type P = [title: string, price: number, icon: string, description: string, opts?: Partial<Product>]

const productSeeds: Record<string, P[]> = {
  shop_1: [
    ["Kerstverhalen voor bij de open haard", 24.95, "book-open", "Een prachtig gebonden bundel met twaalf winterse verhalen van Nederlandse schrijvers. Ideaal om voor te lezen op kerstavond."],
    ["Puzzel 1000 stukjes – Winters dorp", 19.99, "puzzle", "Een sfeervolle illustratie van een besneeuwde dorpsstraat. Voor lange winteravonden.", { stockMode: "count", stock: 6 }],
    ["Notitieboek linnen, goudfolie", 16.5, "notebook", "Linnen notitieboek met goudfolie op de cover, 192 pagina's met stippen.", { stockMode: "count", stock: 2 }],
    ["Kerstkaarten set van 10", 9.95, "mail", "Set van tien illustratiekaarten met envelop, gedrukt op gerecycled papier."],
    ["Kookboek ‘Winterfeest’", 29.95, "cooking-pot", "Feestelijke recepten voor de hele decembermaand, van ontbijt tot dessert.", { inStock: false }],
  ],
  shop_2: [
    ["Kerstpakket ‘Proeverij’", 39.95, "gift", "Vier ambachtelijke kazen, vijgenbrood, chutney en een fles huiswijn in een houten kistje.", { stockMode: "count", stock: 8 }],
    ["Truffelkaas 400 gram", 14.5, "package", "Romige Goudse kaas met zwarte truffel, vers voor je gesneden aan de toonbank.", { reservable: false }],
    ["Kaasplank eikenhout met messen", 34.95, "utensils", "Robuuste kaasplank van Nederlands eikenhout met drie kaasmesjes."],
    ["Vijgenchutney", 6.95, "glass-water", "Huisgemaakte chutney van vijgen en port. Heerlijk bij oude kaas."],
  ],
  shop_3: [
    ["Geurkaars ‘Dennenbos’", 24.5, "flame", "Handgegoten sojawaskaars met de geur van dennennaalden en ceder. Brandtijd ±45 uur."],
    ["Keramiek mok, goudrand", 19.95, "coffee", "Handgedraaide mok met een randje bladgoud. Ieder exemplaar is uniek.", { stockMode: "count", stock: 4 }],
    ["Plaid wol, oker", 79.0, "feather", "Zachte plaid van gerecyclede wol in warm oker, 130x170 cm."],
    ["Kerstster messing", 29.95, "star", "Minimalistische ster om in de boom of aan het raam te hangen."],
    ["Vaasje ‘Ijsbloem’", 34.5, "flower", "Mondgeblazen glazen vaasje met een subtiele ijsbloem-textuur."],
  ],
  shop_4: [
    ["Houten treinset", 49.95, "train", "Klassieke houten trein met rails, brug en drie wagons. Vanaf 3 jaar.", { stockMode: "count", stock: 3 }],
    ["Knuffel ijsbeer", 22.5, "heart", "Superzachte ijsbeer van 35 cm, wasbaar op 30 graden."],
    ["Familiespel ‘Sneeuwballen’", 27.95, "dice", "Een razendsnel kaartspel voor 2–6 spelers vanaf 7 jaar."],
    ["Knutselset kerstversiering", 14.95, "scissors", "Maak je eigen vilten kersthangers. Inclusief naald, draad en patronen."],
  ],
  shop_5: [
    ["Deurkrans ‘Winterbos’", 34.95, "tree-pine", "Handgebonden krans van verse dennentakken, eucalyptus en gedroogde sinaasappel.", { stockMode: "count", stock: 10 }],
    ["Amaryllis in pot", 17.5, "flower2", "Een rode amaryllis met bolletje in een zinken potje. Bloeit rond de kerst."],
    ["Tafelstuk met kaars", 27.5, "leaf", "Feestelijk tafelstuk met mos, kerstgroen en een witte stompkaars."],
  ],
  shop_6: [
    ["Ketting ‘Sneeuwvlok’ zilver", 89.0, "snowflake", "Fijne zilveren ketting met handgezaagde sneeuwvlok-hanger.", { stockMode: "count", stock: 5 }],
    ["Oorbellen goud, druppel", 129.0, "sparkles", "14 karaat gouden oorbellen van gerecycled goud."],
    ["Ring met graveerruimte", 69.0, "gem", "Zilveren ring; we graveren gratis een naam of datum terwijl je wacht."],
  ],
  shop_7: [
    ["Kerstblend koffiebonen 250 g", 11.95, "coffee", "Onze eigen kerstmelange met tonen van kaneel en pure chocolade."],
    ["Theedoos ‘Winteravond’", 18.5, "coffee", "Drie losse theesoorten in een mooi blik, met theezeefje."],
    ["Kerstkoekjestrommel", 12.95, "cookie", "Trommel vol zelfgebakken kruidnoten, sterretjes en roomboterkransjes."],
  ],
  shop_8: [
    ["Sjaal kasjmier, bordeaux", 69.95, "shirt", "Heerlijk zachte sjaal van 100% kasjmier in diep bordeaux.", { stockMode: "count", stock: 7 }],
    ["Gebreide muts met pompon", 29.95, "feather", "Wollen muts met een pompon van imitatiebont."],
    ["Handschoenen leer", 49.95, "handbag", "Leren handschoenen met kasjmier voering, dames en heren."],
    ["Kerstsokken giftbox", 19.95, "gift", "Drie paar vrolijke kerstsokken in een cadeaudoos."],
  ],
}

const categoryByShop: Record<string, string> = Object.fromEntries(shops.map((s) => [s.id, s.category]))

const products: Product[] = Object.entries(productSeeds).flatMap(([shopId, list]) =>
  list.map(([title, price, icon, description, opts], i) => ({
    id: `${shopId}_p${i + 1}`,
    shopId,
    title,
    description,
    price,
    images: [],
    icon,
    category: categoryByShop[shopId],
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

export const DB_VERSION = 4

export function createSeed(): Database {
  return {
    version: DB_VERSION,
    settings: {
      siteName: "Windowshoppen",
      areaName: "De Kempenaer",
      town: "Oegstgeest",
      heroTitle: "Feestelijk windowshoppen in De Kempenaer",
      heroSubtitle:
        "Struin door de online winkelstraat, maak je eigen kadolijstje en haal je cadeaus op bij de winkels in het dorp.",
      introText:
        "Deze december zetten de winkeliers van winkelgebied De Kempenaer hun mooiste kadotips voor je klaar. Zet wat je leuk vindt op je lijstje, laat het eventueel een dag reserveren en loop gezellig langs de etalages om alles op te halen.",
      footerText: "Een initiatief van de winkeliers van winkelgebied De Kempenaer in Oegstgeest. Fijne feestdagen!",
      campaignStart: "2026-11-20",
      campaignEnd: "2026-12-31",
      maxProductsPerShop: 20,
      reservationHours: 24,
      reservationsEnabled: true,
      snowEnabled: true,
      map: { lat: 52.1806, lng: 4.4706, zoom: 17 },
      colors: {
        primary: "#023934",
        accent: "#9b2c2c",
        gold: "#c09a5e",
        background: "#f8f4ec",
        text: "#1f2a28",
      },
      categories: [
        "Boeken & papier",
        "Eten & drinken",
        "Wonen & lifestyle",
        "Kinderen & speelgoed",
        "Bloemen & planten",
        "Mode & sieraden",
        "Beauty & verzorging",
        "Overig",
      ],
      privacy: {
        controllerName: "Winkeliersvereniging De Kempenaer",
        controllerAddress: "De Kempenaerstraat, Oegstgeest",
        contactEmail: "privacy@example.nl",
        kvk: "00000000",
        retentionDays: 30,
      },
      adminEmail: "lgawi@connect-create.nl",
      // SHA-256 van "windowshoppen:" + wachtwoord. Wijzig het wachtwoord via Admin → Instellingen.
      adminPasswordHash: "692cc947c87c007aa6b742675a8785162d1c13d0e8017d8043fb548f63cccd4c",
      updatedAt: now,
    },
    shops,
    products,
    reservations: [],
    emails: [],
  }
}
