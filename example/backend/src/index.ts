import { Hono } from "hono";
import { cors } from "hono/cors";
import { and, desc, eq, like } from "drizzle-orm";
import { db } from "./db";
import { documents } from "./schema";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return "*"
      const allowed = new Set([
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
      ])
      return allowed.has(origin) ? origin : ""
    },
  })
);

app.get("/health", (c) => c.json({ ok: true }));

const parsePayload = (raw: string) => {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

app.get("/documents", (c) => {
  const query = c.req.query();
  const user = (query.user ?? "anonymous").trim();
  const type = query.type?.trim();
  const q = query.q?.trim();
  const limit = Math.min(Number.parseInt(query.limit ?? "20", 10) || 20, 100);
  const offset = Math.max(Number.parseInt(query.offset ?? "0", 10) || 0, 0);

  const conditions = [eq(documents.user, user)];
  if (type) conditions.push(eq(documents.type, type));
  if (q) conditions.push(like(documents.title, `%${q}%`));

  const rows = db
    .select({
      id: documents.id,
      user: documents.user,
      type: documents.type,
      title: documents.title,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
    })
    .from(documents)
    .where(and(...conditions))
    .orderBy(desc(documents.updatedAt))
    .limit(limit)
    .offset(offset)
    .all();

  return c.json({ items: rows });
});

app.get("/documents/:id", (c) => {
  const id = c.req.param("id");
  const user = (c.req.query("user") ?? "").trim();

  const row = db
    .select()
    .from(documents)
    .where(user ? and(eq(documents.id, id), eq(documents.user, user)) : eq(documents.id, id))
    .get();

  if (!row) {
    return c.json({ error: "not_found" }, 404);
  }

  return c.json({
    ...row,
    payload: parsePayload(row.payload),
  });
});

app.post("/documents", async (c) => {
  const body = await c.req.json().catch(() => null);
  const user = typeof body?.user === "string" ? body.user.trim() : "anonymous";
  const type = typeof body?.type === "string" ? body.type.trim() : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const payload = body?.payload;
  const force = Boolean(body?.force);

  if (!type || !title || payload === undefined) {
    return c.json({ error: "user/type/title/payload are required" }, 400);
  }

  const existing = db
    .select()
    .from(documents)
    .where(and(eq(documents.user, user), eq(documents.title, title)))
    .get();

  const now = Date.now();

  if (existing && !force) {
    return c.json(
      {
        error: "exists",
        document: {
          id: existing.id,
          user: existing.user,
          type: existing.type,
          title: existing.title,
          createdAt: existing.createdAt,
          updatedAt: existing.updatedAt,
        },
      },
      409
    );
  }

  const serialized = JSON.stringify(payload);

  if (existing) {
    db.update(documents)
      .set({
        type,
        payload: serialized,
        updatedAt: now,
      })
      .where(eq(documents.id, existing.id))
      .run();

    const updated = db
      .select()
      .from(documents)
      .where(eq(documents.id, existing.id))
      .get();

    return c.json({
      ...updated,
      payload: parsePayload(updated.payload),
    });
  }

  const id = crypto.randomUUID();
  db.insert(documents)
    .values({
      id,
      user,
      type,
      title,
      payload: serialized,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const inserted = db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .get();

  return c.json(
    {
      ...inserted,
      payload: parsePayload(inserted.payload),
    },
    201
  );
});

app.put("/documents/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const payload = body?.payload;
  const type = typeof body?.type === "string" ? body.type.trim() : "";

  if (!title || payload === undefined) {
    return c.json({ error: "title/payload are required" }, 400);
  }

  const existing = db.select().from(documents).where(eq(documents.id, id)).get();
  if (!existing) {
    return c.json({ error: "not_found" }, 404);
  }

  const now = Date.now();
  db.update(documents)
    .set({
      title,
      type: type || existing.type,
      payload: JSON.stringify(payload),
      updatedAt: now,
    })
    .where(eq(documents.id, id))
    .run();

  const updated = db.select().from(documents).where(eq(documents.id, id)).get();
  return c.json({
    ...updated,
    payload: parsePayload(updated.payload),
  });
});

const port = Number(process.env.PORT ?? 3001);

Bun.serve({
  fetch: app.fetch,
  port,
});

console.log(`Backend listening on http://localhost:${port}`);
