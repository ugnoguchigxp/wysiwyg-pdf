import { routes } from "./app";
import { drizzle } from "drizzle-orm/d1";
import { documents } from "./schema";
import { R2StorageService } from "./storage/r2";
import type { StorageService } from "./storage/types";
import type { Bindings } from "./types";
import { and, lt } from "drizzle-orm";
import { Hono } from "hono";
import type { ScheduledEvent, ExecutionContext } from "@cloudflare/workers-types";

const app = new Hono<{ Bindings: Bindings; Variables: { db: any, storage: StorageService } }>();

app.use("*", async (c, next) => {
    const db = drizzle(c.env.DB);
    // Assume public access or return relative path handled by frontend/worker
    const storage = new R2StorageService(c.env.BUCKET);
    c.set("db", db);
    c.set("storage", storage);
    await next();
});

app.route("/api", routes);

app.get('*', async (c) => {
    if (c.env.ASSETS) {
        const res = await c.env.ASSETS.fetch(new URL('/index.html', c.req.url));
        return res;
    }
    return c.text("Not Found", 404);
});

export default {
    fetch: app.fetch,

    async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
        const db = drizzle(env.DB);
        const bucket = env.BUCKET;

        console.log("[Cron] Starting cleanup...");

        try {
            // 1. Wipe DB (All documents)
            // Note: Delete without where clause deletes all rows.
            await db.delete(documents).run();
            console.log("[Cron] DB wiped.");

            // 2. Wipe Storage (Non-default files)
            // List all objects
            let truncated = true;
            let cursor: string | undefined;

            while (truncated) {
                const list = await bucket.list({ cursor });
                truncated = list.truncated;
                cursor = (list as any).cursor;

                const keysToDelete = list.objects
                    // Filter logic: Keep "defaults/" if needed.
                    // For now user said "defaults" (default image).
                    // Let's assume we keep files starting with "default_".
                    .filter(o => !o.key.startsWith("default_"))
                    .map(o => o.key);

                if (keysToDelete.length > 0) {
                    await bucket.delete(keysToDelete);
                    console.log(`[Cron] Deleted ${keysToDelete.length} files.`);
                }
            }

            console.log("[Cron] Cleanup complete.");
        } catch (e) {
            console.error("[Cron] Cleanup failed", e);
        }
    }
}
