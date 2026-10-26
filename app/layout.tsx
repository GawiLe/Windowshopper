import type { Metadata, Viewport } from "next"
import { Fraunces, Nunito } from "next/font/google"
import "./globals.css"
import { ThemeVars } from "@/components/ThemeVars"
import { Toaster } from "@/components/Toast"

const heading = Fraunces({ subsets: ["latin"], variable: "--font-heading", display: "swap" })
const body = Nunito({ subsets: ["latin"], variable: "--font-body", display: "swap" })

export const metadata: Metadata = {
  title: {
    default: "Windowshoppen De Kempenaerstraat – kadotips voor december",
    template: "%s · Windowshoppen De Kempenaerstraat",
  },
  description:
    "De online winkelstraat van De Kempenaerstraat. Ontdek kadotips van lokale winkels, maak je kadolijstje en haal je cadeaus op in het dorp.",
  applicationName: "Windowshoppen",
  appleWebApp: { capable: true, title: "Windowshoppen", statusBarStyle: "default" },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1f4d3a",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${heading.variable} ${body.variable}`}>
      <body className="min-h-dvh antialiased">
        <ThemeVars />
        {children}
        <Toaster />
      </body>
    </html>
  )
}
