import type { Metadata, Viewport } from "next"
import { Jost, Playfair_Display } from "next/font/google"
import "./globals.css"
import { ThemeVars } from "@/components/ThemeVars"
import { Toaster } from "@/components/Toast"

const heading = Playfair_Display({ subsets: ["latin"], variable: "--font-heading", display: "swap" })
const body = Jost({ subsets: ["latin"], variable: "--font-body", display: "swap" })

export const metadata: Metadata = {
  title: {
    default: "Windowshoppen De Kempenaer – kadotips voor december",
    template: "%s · Windowshoppen De Kempenaer",
  },
  description:
    "De online winkelstraat van winkelgebied De Kempenaer in Oegstgeest. Ontdek kadotips van lokale winkels, maak je kadolijstje en haal je cadeaus op in het dorp.",
  applicationName: "Windowshoppen",
  appleWebApp: { capable: true, title: "Windowshoppen", statusBarStyle: "default" },
  icons: { icon: "/brand/kempenaer-logo.svg", apple: "/brand/kempenaer-logo.svg" },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#023934",
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
