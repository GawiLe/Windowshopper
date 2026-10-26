import { Suspense } from "react"
import type { Metadata } from "next"
import { ListView } from "./ListView"

export const metadata: Metadata = { title: "Mijn kadolijstje" }

export default function Page() {
  return (
    <Suspense>
      <ListView />
    </Suspense>
  )
}
