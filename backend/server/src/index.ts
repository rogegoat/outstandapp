import { Hono } from "hono";
import type { Client } from "@sdk/server-types";
import { tables } from "@generated";
import { eq } from "drizzle-orm";

type StatePayload = Record<string, unknown>;

const parsePayload = (value: string): StatePayload => {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as StatePayload;
    }
    return {};
  } catch {
    return {};
  }
};

export async function createApp(edgespark: Client<typeof tables>): Promise<Hono> {
  const app = new Hono();

  app.get("/api/public/hello", (c) =>
    c.json({ message: "Hello from EdgeSpark! Spark your idea to the Edge." })
  );

  app.get("/api/state", async (c) => {
    const userId = edgespark.auth.user!.id;

    const rows = await edgespark.db
      .select()
      .from(tables.appStates)
      .where(eq(tables.appStates.userId, userId))
      .limit(1);

    if (!rows[0]) {
      return c.json({ payload: {}, updatedAt: null });
    }

    return c.json({
      payload: parsePayload(rows[0].payload),
      updatedAt: rows[0].updatedAt,
    });
  });

  app.put("/api/state", async (c) => {
    const userId = edgespark.auth.user!.id;
    const body = (await c.req.json()) as { payload?: unknown };

    if (!body || typeof body !== "object" || Array.isArray(body.payload)) {
      return c.json({ error: "Payload inválido." }, 400);
    }

    const payload = body.payload && typeof body.payload === "object" ? body.payload : {};
    const payloadString = JSON.stringify(payload);

    const now = Math.floor(Date.now() / 1000);

    await edgespark.db
      .insert(tables.appStates)
      .values({ userId, payload: payloadString, updatedAt: now })
      .onConflictDoUpdate({
        target: tables.appStates.userId,
        set: { payload: payloadString, updatedAt: now },
      });

    return c.json({ ok: true, updatedAt: now });
  });

  return app;
}
