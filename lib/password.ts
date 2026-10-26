// Wachtwoord-hash voor de demo (in de browser). In de live-versie: bcrypt in de database,
// zie users.password_hash in db/schema.sql.
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`windowshoppen:${password}`)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("")
}
