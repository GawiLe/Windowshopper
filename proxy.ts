import { NextResponse, type NextRequest } from "next/server"

// Geeft het (genormaliseerde) domein door aan de app, zodat server components en server actions
// het juiste winkelgebied kunnen opzoeken in area_domains (zie docs/V0-MIGRATIE.md).
// Voor lokaal testen: ?gebied=<slug> zet een cookie waarmee je een gebied kiest op localhost.
export function proxy(request: NextRequest) {
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "")
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/^www\./, "")

  const headers = new Headers(request.headers)
  headers.set("x-ws-host", host)
  const response = NextResponse.next({ request: { headers } })

  const choice = request.nextUrl.searchParams.get("gebied")
  if (choice && /^[a-z0-9-]+$/.test(choice)) {
    response.cookies.set("ws-gebied", choice, { path: "/", sameSite: "lax" })
  }
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|brand/|favicon.ico).*)"],
}
