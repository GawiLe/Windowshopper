import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Projectmap vastzetten, zodat een los lockfile elders (bv. in je thuismap) geen verwarring geeft
  turbopack: { root: __dirname },
}

export default nextConfig
