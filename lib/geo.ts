// Adres → coördinaten via de PDOK Locatieserver van de Nederlandse overheid
// (gratis, geen API-sleutel, alleen Nederlandse adressen).
export async function geocodeAddress(address: string, town: string): Promise<{ lat: number; lng: number } | null> {
  const q = encodeURIComponent(`${address} ${town}`)
  try {
    const res = await fetch(`https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=${q}&fq=type:adres&rows=1&fl=centroide_ll`)
    if (!res.ok) return null
    const data = (await res.json()) as { response?: { docs?: { centroide_ll?: string }[] } }
    const point = data.response?.docs?.[0]?.centroide_ll // "POINT(4.47 52.18)"
    const m = point?.match(/POINT\(([-\d.]+) ([-\d.]+)\)/)
    return m ? { lng: Number(m[1]), lat: Number(m[2]) } : null
  } catch {
    return null
  }
}

/** Huisnummer uit een adres, voor een logische looproute ("De Kempenaerstraat 12" → 12). */
export function houseNumber(address: string) {
  const m = address.match(/(\d+)\s*[a-zA-Z-]*\s*$/)
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER
}
