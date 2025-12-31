import { routes } from "./app";
import { serveStatic } from "hono/bun";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { LocalStorage } from "./storage/local";
import { seed } from "./seed";
import { db as dbCheck, sqlite } from "./db";
import { Hono } from "hono";
import type { Bindings } from "./types";
import type { StorageService } from "./storage/types";

seed();

const storage = new LocalStorage('public/uploads', 'http://localhost:3001');
const bunDb = drizzle(sqlite);

const app = new Hono<{ Bindings: Bindings; Variables: { db: any, storage: StorageService } }>();

// Inject dependencies
app.use("*", async (c, next) => {
  c.set("db", bunDb);
  c.set("storage", storage);
  await next();
});

// Serve static files for uploads
app.use("/public/*", serveStatic({ root: "./" }));

// Mount routes
app.route("/api", routes);

const port = Number(process.env.PORT ?? 3001);

Bun.serve({
  fetch: app.fetch,
  port,
});

console.log(`Backend listening on http://localhost:${port}`);
