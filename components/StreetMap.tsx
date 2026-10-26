"use client"

import type { Shop } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ShopLogo } from "./Visuals"

// Geïllustreerde plattegrond van de winkelstraat. Winkels worden geplaatst met mapX/mapY (in %),
// die de admin per winkel kan instellen door op de kaart te tikken.

const W = 1000
const H = 500

function seeded(i: number) {
  return (Math.sin(i * 127.1 + 311.7) * 43758.5453) % 1
}

function Houses({ top }: { top: boolean }) {
  const items = []
  let x = 6
  let i = top ? 0 : 50
  while (x < W - 30) {
    const w = 58 + Math.abs(seeded(i)) * 40
    const h = 90 + Math.abs(seeded(i + 1)) * 50
    const baseY = top ? 182 : 318
    const y = top ? baseY - h : baseY
    const hue = ["#9b4a3c", "#7d4b36", "#b5653f", "#6f3b33", "#8a5a3b", "#a24f3f", "#5f4a3f"][Math.abs(Math.floor(seeded(i + 2) * 7))]
    const roofY = top ? y : y + h
    const gable = top ? `M${x - 2} ${roofY} L${x + w / 2} ${roofY - 30} L${x + w + 2} ${roofY} Z` : ""
    items.push(
      <g key={i}>
        {top && <path d={gable} fill="#4a2e26" />}
        {top && <path d={`M${x + 4} ${roofY - 2} L${x + w / 2} ${roofY - 27} L${x + w - 4} ${roofY - 2} Q${x + w / 2} ${roofY - 14} ${x + 4} ${roofY - 2}Z`} fill="white" opacity="0.95" />}
        <rect x={x} y={y} width={w} height={h} fill={hue} rx="2" />
        {/* ramen */}
        {[0, 1].map((r) =>
          [0, 1].map((c) => (
            <rect
              key={`${r}${c}`}
              x={x + 10 + c * (w / 2 - 6)}
              y={(top ? y + 14 : y + h - 60) + r * 26}
              width={w / 2 - 20}
              height={16}
              rx="2"
              fill={Math.abs(seeded(i + r + c * 3)) > 0.3 ? "#f6d77f" : "#2b2a33"}
              opacity="0.95"
            />
          )),
        )}
        {/* etalage aan de straatkant */}
        <rect x={x + 6} y={top ? y + h - 30 : y + 8} width={w - 12} height={22} rx="2" fill="#fbe7a8" />
        <rect x={x + 6} y={top ? y + h - 34 : y + 30} width={w - 12} height={5} fill={i % 2 ? "#b3262e" : "#1f4d3a"} />
      </g>,
    )
    x += w + 6
    i += 3
  }
  return <>{items}</>
}

function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-3" y="18" width="6" height="10" fill="#5b3a26" />
      <path d="M0 -26 L16 0 L8 0 L20 18 L-20 18 L-8 0 L-16 0 Z" fill="#285c40" />
      <path d="M0 -26 L8 -13 L-8 -13 Z M-12 6 L-4 4 L4 7 L12 5 L16 10 L-16 10Z" fill="white" opacity="0.9" />
      <circle cx="0" cy="-27" r="3" fill="#f3dc9a" />
      <circle cx="-7" cy="12" r="1.8" fill="#b3262e" />
      <circle cx="6" cy="2" r="1.8" fill="#f3dc9a" />
    </g>
  )
}

function Lamp({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y - 26} r="14" fill="#f6d77f" opacity="0.25" />
      <rect x={x - 1.5} y={y - 24} width="3" height="26" fill="#2b2a33" />
      <rect x={x - 5} y={y - 32} width="10" height="9" rx="2" fill="#f6d77f" stroke="#2b2a33" strokeWidth="1.5" />
    </g>
  )
}

export function StreetMap({
  shops,
  compact = false,
  selectedId,
  onSelect,
  onPlace,
  className,
}: {
  shops: Shop[]
  compact?: boolean
  selectedId?: string | null
  onSelect?: (shop: Shop) => void
  /** Admin: klik op de kaart om de geselecteerde winkel te plaatsen */
  onPlace?: (x: number, y: number) => void
  className?: string
}) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onPlace) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    onPlace(Math.round(x * 10) / 10, Math.round(y * 10) / 10)
  }

  // slingers met lampjes boven de straat
  const garland = Array.from({ length: 9 }, (_, k) => {
    const x1 = 30 + k * 110
    return { x1, x2: x1 + 100 }
  })

  return (
    <div
      className={cn("relative aspect-[2/1] w-full select-none bg-[#f3efe6]", onPlace && "cursor-crosshair", className)}
      onClick={handleClick}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <pattern id="cobble" width="16" height="10" patternUnits="userSpaceOnUse">
            <rect width="16" height="10" fill="#cdbfa8" />
            <rect x="1" y="1" width="6" height="3.5" rx="1" fill="#d9ccb6" />
            <rect x="9" y="1" width="6" height="3.5" rx="1" fill="#d6c8b0" />
            <rect x="5" y="5.5" width="6" height="3.5" rx="1" fill="#dbcfba" />
          </pattern>
        </defs>
        {/* sneeuwige grond */}
        <rect width={W} height={H} fill="#f5f2ec" />
        <rect y="0" width={W} height="40" fill="#e9eef2" />
        {/* stoepen + straat */}
        <rect x="0" y="182" width={W} height="20" fill="#e3ddd2" />
        <rect x="0" y="298" width={W} height="20" fill="#e3ddd2" />
        <rect x="0" y="202" width={W} height="96" fill="url(#cobble)" />
        <path d="M0 202 Q250 196 500 204 T1000 200" stroke="white" strokeWidth="5" fill="none" opacity="0.9" />
        <path d="M0 298 Q250 304 500 296 T1000 300" stroke="white" strokeWidth="5" fill="none" opacity="0.9" />
        {/* zijstraat */}
        <rect x="470" y="318" width="60" height="182" fill="url(#cobble)" />
        <rect x="470" y="0" width="0" height="0" />

        <Houses top />
        <Houses top={false} />
        {/* zijstraat over de huizen heen */}
        <rect x="468" y="318" width="64" height="182" fill="url(#cobble)" />
        <rect x="460" y="318" width="8" height="182" fill="#e3ddd2" />
        <rect x="532" y="318" width="8" height="182" fill="#e3ddd2" />

        {garland.map((g, k) => (
          <g key={k}>
            <path d={`M${g.x1} 186 Q${(g.x1 + g.x2) / 2} 226 ${g.x2} 186`} stroke="#2b2a33" strokeWidth="1" fill="none" opacity="0.5" />
            {[0.15, 0.32, 0.5, 0.68, 0.85].map((t, j) => {
              const x = g.x1 + (g.x2 - g.x1) * t
              const y = 186 + 4 * 40 * t * (1 - t) * 0.5 * 2
              return <circle key={j} cx={x} cy={y} r="2.6" fill={j % 2 ? "#f3dc9a" : "#e5484d"} />
            })}
          </g>
        ))}

        {[60, 300, 700, 940].map((x) => (
          <Tree key={x} x={x} y={262} s={0.9} />
        ))}
        {[180, 420, 600, 820].map((x) => (
          <Lamp key={x} x={x} y={296} />
        ))}
        <Tree x={500} y={250} s={1.6} />

        {!compact && (
          <text x="500" y="474" textAnchor="middle" fontSize="13" fill="#7b6f60" fontFamily="serif" fontStyle="italic">
            naar het dorpsplein
          </text>
        )}
        <text x="120" y="256" fontSize={compact ? 22 : 16} fill="#6b5e4d" fontFamily="serif" fontStyle="italic" opacity="0.8">
          De Kempenaerstraat
        </text>
      </svg>

      {shops.map((s) => {
        const sel = s.id === selectedId
        return (
          <button
            key={s.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (onPlace) return handleClick(e as unknown as React.MouseEvent<HTMLDivElement>)
              onSelect?.(s)
            }}
            className={cn(
              "absolute z-10 -translate-x-1/2 -translate-y-full transition",
              sel ? "z-20 scale-110" : "hover:scale-105",
              compact && "pointer-events-none",
            )}
            style={{ left: `${s.mapX}%`, top: `${s.mapY}%` }}
            aria-label={`Winkel ${s.name}`}
          >
            <span className={cn("flex flex-col items-center", sel && "drop-shadow-lg")}>
              <span className={cn("rounded-full bg-white p-0.5 shadow-md", sel && "ring-4 ring-gold")}>
                <ShopLogo shop={s} size={compact ? 30 : 40} />
              </span>
              <span className="-mt-1 h-3 w-3 rotate-45 bg-white shadow-md" />
              {!compact && (
                <span
                  className={cn(
                    "mt-0.5 max-w-24 truncate rounded-full px-2 py-0.5 text-[10px] font-bold shadow",
                    sel ? "bg-primary text-white" : "bg-white/95 text-ink",
                  )}
                >
                  {s.name}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
