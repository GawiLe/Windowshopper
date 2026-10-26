import {
  Apple, Armchair, Baby, Backpack, Bath, Bean, Beer, Bell, Bike, BookOpen, Brush, Cake, CandyCane, Citrus, Coffee,
  CookingPot, Cookie, Croissant, Crown, Dice5, Droplet, Feather, Flame, Flower, Flower2, Frame, Gamepad2, Gem, Gift,
  GlassWater, Glasses, Handbag, Headphones, Heart, Lamp, Leaf, Library, type LucideIcon, Mail, Martini, Music,
  NotebookPen, Package, Palette, PartyPopper, PawPrint, Puzzle, Scissors, Shirt, ShoppingBag, Snowflake, Sofa,
  Sparkles, SprayCan, Sprout, Star, Store, Ticket, ToyBrick, TrainFront, TreePine, Trophy, Umbrella, Utensils, Watch,
  Wheat, Wine,
} from "lucide-react"

// Iconen voor producten (als er nog geen foto is) en winkels. De sleutel wordt in de database
// opgeslagen (kolom `icon`), het label wordt getoond in de icoonkiezer.
export const ICONS: Record<string, { label: string; Icon: LucideIcon }> = {
  gift: { label: "Cadeau", Icon: Gift },
  "book-open": { label: "Boek", Icon: BookOpen },
  library: { label: "Boeken", Icon: Library },
  notebook: { label: "Notitieboek", Icon: NotebookPen },
  mail: { label: "Kaart / brief", Icon: Mail },
  puzzle: { label: "Puzzel", Icon: Puzzle },
  dice: { label: "Spel", Icon: Dice5 },
  "toy-brick": { label: "Speelgoed", Icon: ToyBrick },
  train: { label: "Trein", Icon: TrainFront },
  baby: { label: "Baby", Icon: Baby },
  gamepad: { label: "Game", Icon: Gamepad2 },
  bike: { label: "Fiets / sport", Icon: Bike },
  trophy: { label: "Sport", Icon: Trophy },
  coffee: { label: "Koffie / thee", Icon: Coffee },
  wine: { label: "Wijn", Icon: Wine },
  beer: { label: "Bier", Icon: Beer },
  martini: { label: "Cocktail", Icon: Martini },
  cookie: { label: "Koekjes", Icon: Cookie },
  cake: { label: "Taart", Icon: Cake },
  croissant: { label: "Bakkerij", Icon: Croissant },
  wheat: { label: "Brood", Icon: Wheat },
  "candy-cane": { label: "Snoep", Icon: CandyCane },
  apple: { label: "Fruit", Icon: Apple },
  citrus: { label: "Citrus", Icon: Citrus },
  bean: { label: "Bonen", Icon: Bean },
  utensils: { label: "Keuken", Icon: Utensils },
  "cooking-pot": { label: "Kookgerei", Icon: CookingPot },
  "glass-water": { label: "Glaswerk", Icon: GlassWater },
  flame: { label: "Kaars", Icon: Flame },
  lamp: { label: "Lamp", Icon: Lamp },
  sofa: { label: "Wonen", Icon: Sofa },
  armchair: { label: "Meubel", Icon: Armchair },
  frame: { label: "Lijst / kunst", Icon: Frame },
  palette: { label: "Kunst", Icon: Palette },
  brush: { label: "Creatief", Icon: Brush },
  scissors: { label: "Knutselen", Icon: Scissors },
  star: { label: "Ster", Icon: Star },
  sparkles: { label: "Feestelijk", Icon: Sparkles },
  "party-popper": { label: "Feest", Icon: PartyPopper },
  bell: { label: "Kerstklok", Icon: Bell },
  snowflake: { label: "Winter", Icon: Snowflake },
  "tree-pine": { label: "Kerstboom", Icon: TreePine },
  flower: { label: "Bloem", Icon: Flower },
  flower2: { label: "Boeket", Icon: Flower2 },
  leaf: { label: "Groen", Icon: Leaf },
  sprout: { label: "Plant", Icon: Sprout },
  gem: { label: "Sieraad", Icon: Gem },
  crown: { label: "Luxe", Icon: Crown },
  watch: { label: "Horloge", Icon: Watch },
  glasses: { label: "Bril", Icon: Glasses },
  shirt: { label: "Kleding", Icon: Shirt },
  handbag: { label: "Tas", Icon: Handbag },
  backpack: { label: "Rugzak", Icon: Backpack },
  umbrella: { label: "Paraplu", Icon: Umbrella },
  "spray-can": { label: "Parfum", Icon: SprayCan },
  droplet: { label: "Verzorging", Icon: Droplet },
  bath: { label: "Bad & spa", Icon: Bath },
  feather: { label: "Zacht", Icon: Feather },
  heart: { label: "Liefde", Icon: Heart },
  music: { label: "Muziek", Icon: Music },
  headphones: { label: "Audio", Icon: Headphones },
  ticket: { label: "Bon / ticket", Icon: Ticket },
  "paw-print": { label: "Dieren", Icon: PawPrint },
  package: { label: "Pakket", Icon: Package },
  "shopping-bag": { label: "Tas / winkel", Icon: ShoppingBag },
  store: { label: "Winkel", Icon: Store },
}

export const ICON_KEYS = Object.keys(ICONS)

export function iconFor(key: string | undefined | null): LucideIcon {
  return (key && ICONS[key]?.Icon) || Gift
}

/** Initialen voor een monogram-logo, bv. "De Boekenhoek" → "DB", "Kaas & Zo" → "KZ" */
export function monogram(name: string) {
  const words = name.replace(/&/g, " ").split(/\s+/).filter((w) => /[a-zA-Z]/.test(w))
  if (words.length === 0) return "?"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}
