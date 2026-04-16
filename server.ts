import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { SignJWT, jwtVerify } from "jose";
import Database from "better-sqlite3";
import { join } from "path";
import { existsSync, mkdirSync, readFileSync } from "fs";

const DATA_DIR = process.env.DATA_DIR ?? "./data";
const PORT = parseInt(process.env.PORT ?? "3000");
const AUTH_PASSWORD = process.env.AUTH_PASSWORD ?? "changeme";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "outstand-secret-change-in-prod"
);

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(join(DATA_DIR, "db.sqlite"));
db.exec(`
  CREATE TABLE IF NOT EXISTS app_state (
    id INTEGER PRIMARY KEY DEFAULT 1,
    payload TEXT NOT NULL DEFAULT '{}',
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

const app = new Hono();

const requireAuth = async (c: any, next: any) => {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) return c.json({ error: "Unauthorized" }, 401);
  try {
    await jwtVerify(auth.slice(7), JWT_SECRET);
    await next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
};

app.post("/api/auth/login", async (c) => {
  const { password } = await c.req.json<{ password: string }>();
  if (password !== AUTH_PASSWORD) return c.json({ error: "Senha incorreta" }, 401);
  const token = await new SignJWT({ sub: "user" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
  return c.json({ token });
});

app.get("/api/auth/session", async (c) => {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) return c.json({ user: null });
  try {
    await jwtVerify(auth.slice(7), JWT_SECRET);
    return c.json({ user: { id: "user", name: "Rogério" } });
  } catch {
    return c.json({ user: null });
  }
});

app.get("/api/state", requireAuth, async (c) => {
  const row = db
    .prepare("SELECT payload, updated_at FROM app_state WHERE id = 1")
    .get() as { payload: string; updated_at: number } | undefined;
  if (!row) return c.json({ payload: {}, updatedAt: null });
  try {
    return c.json({ payload: JSON.parse(row.payload), updatedAt: row.updated_at });
  } catch {
    return c.json({ payload: {}, updatedAt: null });
  }
});

app.put("/api/state", requireAuth, async (c) => {
  const body = await c.req.json<{ payload?: unknown }>();
  const payload = body?.payload && typeof body.payload === "object" ? body.payload : {};
  const now = Math.floor(Date.now() / 1000);
  db.prepare(`
    INSERT INTO app_state (id, payload, updated_at) VALUES (1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at
  `).run(JSON.stringify(payload), now);
  return c.json({ ok: true, updatedAt: now });
});

app.use("/*", serveStatic({ root: "./dist" }));

app.get("/*", (c) => {
  try {
    return c.html(readFileSync("./dist/index.html", "utf8"));
  } catch {
    return c.text("Not found", 404);
  }
});

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`Outstand server on port ${info.port}`);
});
