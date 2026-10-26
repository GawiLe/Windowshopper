import { BottomNav, SiteFooter, SiteHeader } from "@/components/SiteChrome"
import { Snow } from "@/components/Snow"
import { AreaGate } from "@/components/AreaGate"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Snow />
      <SiteHeader />
      <main className="min-h-[60vh] w-full pb-28 md:pb-16">
        <AreaGate>{children}</AreaGate>
      </main>
      <SiteFooter />
      <BottomNav />
    </>
  )
}
