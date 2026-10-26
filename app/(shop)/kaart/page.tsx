import { Suspense } from "react"
import type { Metadata } from "next"
import { MapView } from "./MapView"

export const metadata: Metadata = { title: "Kaart" }

export default function Page() {
  return (
    <Suspense>
      <MapView />
    </Suspense>
  )
}
