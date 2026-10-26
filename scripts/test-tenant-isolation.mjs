// Controleert dat winkelgebieden in de database volledig van elkaar gescheiden zijn.
// Draait db/schema.sql + db/seed.sql in een tijdelijke Postgres (PGlite) als app-rol zonder BYPASSRLS.
// Gebruik: npm run db:test   (maak eerst db/seed.sql met npm run db:seed-sql)
import { PGlite } from "@electric-sql/pglite"
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto"
import { readFileSync } from "node:fs"
const R = new URL("../db/", import.meta.url).pathname
const db = new PGlite({ extensions: { pgcrypto } })
await db.exec(readFileSync(R + "schema.sql", "utf8"))
await db.exec(readFileSync(R + "seed.sql", "utf8"))
// app-rol zonder superuser/BYPASSRLS, zoals in productie
await db.exec(`create role windowshop_app nologin; grant usage on schema public to windowshop_app;
  grant select, insert, update, delete on all tables in schema public to windowshop_app;
  grant execute on all functions in schema public to windowshop_app;`)
const q = async (sql, p) => (await db.query(sql, p)).rows
const ids = Object.fromEntries((await q("select slug, id from areas")).map((r) => [r.slug, r.id]))
console.log("areas", Object.keys(ids), "domains", (await q("select domain from area_domains order by 1")).map(r=>r.domain).join(", "))
const asArea = async (slug, fn) => {
  await db.exec("begin; set local role windowshop_app;")
  await db.query("select set_config('app.area_id', $1, true)", [slug ? ids[slug] : ""])
  try { return await fn() } finally { await db.exec("rollback") }
}
let ok = true
const check = (label, cond) => { console.log((cond ? "OK   " : "FOUT ") + label); if (!cond) ok = false }

await asArea("kempenaer", async () => {
  const c = (await q("select (select count(*) from shops)::int s, (select count(*) from products)::int p, (select count(*) from memberships)::int m, (select count(*) from areas)::int a"))[0]
  check(`kempenaer ziet alleen eigen data (${JSON.stringify(c)})`, c.s === 8 && c.p === 31 && c.m === 8 && c.a === 1)
})
await asArea("mijdrecht", async () => {
  const c = (await q("select (select count(*) from shops)::int s, (select count(*) from products)::int p"))[0]
  check(`mijdrecht ziet alleen eigen data (${JSON.stringify(c)})`, c.s === 3 && c.p === 6)
})
await asArea(null, async () => {
  const c = (await q("select (select count(*) from shops)::int s, (select count(*) from products)::int p"))[0]
  check("zonder gebied ziet niets", c.s === 0 && c.p === 0)
})
// id's van mijdrecht ophalen (als eigenaar in platform-scope)
await db.exec("begin"); await db.query("select set_config('app.platform','super',true)")
const mdrShop = (await q("select id from shops where area_id=$1 limit 1", [ids.mijdrecht]))[0].id
const mdrProd = (await q("select id from products where area_id=$1 limit 1", [ids.mijdrecht]))[0].id
const kmpShop = (await q("select id from shops where area_id=$1 limit 1", [ids.kempenaer]))[0].id
await db.exec("commit")

const expectFail = async (label, fn) => { try { await fn(); check(label + " (werd NIET geblokkeerd)", false) } catch (e) { check(`${label}: geblokkeerd (${e.message.slice(0, 70)})`, true) } }
await asArea("kempenaer", () => expectFail("kempenaer voegt product toe aan winkel van mijdrecht", () => q("insert into products (shop_id, title, price_cents) values ($1,'Test',100)", [mdrShop])))
await asArea("kempenaer", () => expectFail("kempenaer schrijft rij met area_id van mijdrecht", () => q("insert into products (area_id, shop_id, title, price_cents) values ($1,$2,'Test',100)", [ids.mijdrecht, mdrShop])))
await asArea("kempenaer", async () => {
  const r = await db.query("update products set price_cents = 1 where id = $1", [mdrProd])
  check("kempenaer kan product van mijdrecht niet wijzigen (0 rijen)", r.affectedRows === 0)
})
await asArea("kempenaer", () => expectFail("kempenaer reserveert product van mijdrecht", () => q("select * from create_reservations('A','a@x.nl','',current_date+1,'', $1::jsonb)", [JSON.stringify([{ product_id: mdrProd, quantity: 1 }])])))
await asArea("kempenaer", async () => {
  const prods = await q("select id from products where stock_mode='count' limit 2")
  const res = await q("select * from create_reservations('Sanne','s@x.nl','',current_date+1,'', $1::jsonb)", [JSON.stringify(prods.map((p) => ({ product_id: p.id, quantity: 1 })))])
  check(`reserveren binnen eigen gebied werkt (${res.length} reservering(en), area klopt: ${res.every((r) => r.area_id === ids.kempenaer)})`, res.length >= 1 && res.every((r) => r.area_id === ids.kempenaer))
})
await asArea("mijdrecht", () => expectFail("mijdrecht koppelt winkelier aan winkel van kempenaer", async () => {
  const u = (await q("select id from users limit 1"))[0].id
  await q("insert into memberships (user_id, role, shop_id) values ($1, 'shop', $2)", [u, kmpShop])
}))
await asArea("mijdrecht", () => expectFail("mijdrecht maakt een nieuw gebied aan", () => q("insert into areas (slug, name) values ('x','X')")))
const login = await q(`select email, is_super_admin from users where lower(email)=lower($1) and password_hash = crypt($2, password_hash)`, ["lgawi@connect-create.nl", "Welkom123!"])
check("superadmin kan inloggen met wachtwoord", login.length === 1 && login[0].is_super_admin)
console.log(ok ? "\nALLE CONTROLES GESLAAGD" : "\nER ZIJN FOUTEN")
process.exit(ok ? 0 : 1)
