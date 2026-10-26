import { BottomNav, SiteFooter, SiteHeader } from "@/components/SiteChrome"
import { Snow } from "@/components/Snow"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Snow />
      <SiteHeader />
      <main className="mx-auto min-h-[60vh] w-full max-w-6xl pb-28 md:pb-12">{children}</main>
      <SiteFooter />
      <BottomNav />
    </>
  )
}
