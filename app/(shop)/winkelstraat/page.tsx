import { Suspense } from "react"
import type { Metadata } from "next"
import { Catalog } from "./Catalog"

export const metadata: Metadata = { title: "Alle kado's" }

export default function Page() {
  return (
    <Suspense>
      <Catalog />
    </Suspense>
  )
}
