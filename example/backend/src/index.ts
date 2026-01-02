import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { cors } from 'hono/cors'
import { routes } from './app'
import { db as dbCheck, sqlite } from './db'
import { seed } from './seed'
import { LocalStorage } from './storage/local'
import type { StorageService } from './storage/types'
import type { Bindings } from './types'

seed()

const storage = new LocalStorage('public/uploads', 'http://localhost:3001')
const bunDb = drizzle(sqlite)

const app = new Hono<{ Bindings: Bindings; Variables: { db: any; storage: StorageService } }>()

// Inject dependencies
app.use('*', async (c, next) => {
  c.set('db', bunDb)
  c.set('storage', storage)
  await next()
})

// Serve static files for uploads
app.use('/public/*', serveStatic({ root: './' }))

app.use('*', cors())

// Mount routes
app.route('/api', routes)

const port = Number(process.env.PORT ?? 8000)

Bun.serve({
  fetch: app.fetch,
  port,
})

console.log(`Backend listening on http://localhost:${port}`)
