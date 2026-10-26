"use client"

import { useMemo } from "react"
import { Snowflake } from "lucide-react"
import { useDB, useHydrated } from "@/lib/store"

/** Lichte, CSS-gedreven sneeuwval. Schakelt uit via admin of bij 'reduce motion'. */
export function Snow({ count = 28 }: { count?: number }) {
  const { settings } = useDB()
  const hydrated = useHydrated()

  const flakes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        // deterministische pseudo-random zodat het rustig oogt
        const r = (n: number) => ((Math.sin(i * 9301 + n * 49297) + 1) / 2)
        return {
          left: `${r(1) * 100}%`,
          size: 8 + r(2) * 12,
          duration: 9 + r(3) * 14,
          delay: -r(4) * 20,
          drift: `${(r(5) - 0.5) * 80}px`,
          opacity: 0.35 + r(6) * 0.55,
          flake: r(7) > 0.6,
        }
      }),
    [count],
  )

  if (!hydrated || !settings.snowEnabled) return null

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {flakes.map((f, i) => (
        <span
          key={i}
          className="snowflake"
          style={
            {
              left: f.left,
              width: f.flake ? f.size : f.size * 0.45,
              height: f.flake ? f.size : f.size * 0.45,
              opacity: f.opacity,
              animationDuration: `${f.duration}s`,
              animationDelay: `${f.delay}s`,
              "--drift": f.drift,
            } as React.CSSProperties
          }
        >
          {f.flake ? (
            <Snowflake className="h-full w-full" strokeWidth={1.5} />
          ) : (
            <span className="block h-full w-full rounded-full bg-white" />
          )}
        </span>
      ))}
    </div>
  )
}

/** Golvende sneeuwlaag als overgang onder een donkere sectie. */
export function SnowDrift({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 1200 40" preserveAspectRatio="none" className={`block h-6 w-full sm:h-10 ${className}`}>
      <path
        d="M0 22 C 60 6, 120 34, 190 18 S 320 4, 400 20 S 540 36, 620 16 S 760 2, 840 20 S 980 34, 1060 14 S 1160 10, 1200 20 V40 H0 Z"
        fill="var(--c-bg)"
      />
      <path
        d="M0 30 C 80 18, 150 38, 240 26 S 420 16, 520 30 S 700 40, 800 28 S 980 18, 1080 30 S 1170 34, 1200 28 V40 H0 Z"
        fill="var(--c-bg)"
        opacity="0.6"
      />
    </svg>
  )
}
