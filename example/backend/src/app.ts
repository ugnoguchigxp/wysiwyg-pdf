import { and, desc, eq, like } from 'drizzle-orm'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { documents } from './schema'
import type { StorageService } from './storage/types'
import type { Bindings } from './types'

type Variables = {
  db: any // Generic Drizzle DB interface
  storage: StorageService
}

// This application instance handles the business logic routes.
// It expects 'db' and 'storage' to be available in the context (Variables).
export const routes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

routes.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return '*'
      const allowed = new Set([
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'https://pdf.wysiwyg-doc.com',
      ])
      return allowed.has(origin) ? origin : ''
    },
  })
)

routes.get('/health', (c) => c.json({ ok: true }))

routes.post('/upload', async (c) => {
  const body = await c.req.parseBody()
  const file = body.file as File

  if (!file) {
    return c.json({ error: 'no_file' }, 400)
  }

  const storage = c.get('storage')
  const id = crypto.randomUUID()
  const ext = file.name.split('.').pop() || 'bin'
  const filename = `${id}.${ext}`

  try {
    const url = await storage.upload(file, filename)
    return c.json({
      id,
      url,
      name: file.name,
    })
  } catch (e) {
    console.error('Upload failed', e)
    return c.json({ error: 'upload_failed' }, 500)
  }
})

import { importExcel } from './excel-importer'

routes.post('/excel/import', async (c) => {
  const body = await c.req.parseBody()
  const file = body.file as File

  if (!file) {
    return c.json({ error: 'no_file' }, 400)
  }

  try {
    const buffer = await file.arrayBuffer()
    const doc = await importExcel(buffer)

    const id = crypto.randomUUID()
    const now = Date.now()
    const user = 'anonymous'
    // Remove extension and ensure title is unique enough or let DB handle it?
    // Schema has unique index on (user, title).
    // We should probably append timestamp if needed, but let's start simple.
    // Actually, let's append a short random string to avoid collision if user uploads same file twice.
    const title = `${file.name.replace(/\.[^/.]+$/, '')} (${new Date().toLocaleTimeString()})`

    const db = c.get('db')
    await db.insert(documents).values({
      id,
      user,
      type: 'report',
      title,
      payload: JSON.stringify(doc),
      createdAt: now,
      updatedAt: now,
    })

    return c.json({ id, title })
  } catch (e) {
    console.error('Excel import failed', e)
    return c.json({ error: 'import_failed', details: String(e) }, 500)
  }
})

const parsePayload = (raw: string) => {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

routes.get('/documents', async (c) => {
  const query = c.req.query()
  const user = (query.user ?? 'anonymous').trim()
  const type = query.type?.trim()
  const q = query.q?.trim()
  const limit = Math.min(Number.parseInt(query.limit ?? '20', 10) || 20, 100)
  const offset = Math.max(Number.parseInt(query.offset ?? '0', 10) || 0, 0)

  const db = c.get('db')

  const conditions = [eq(documents.user, user)]
  if (type) conditions.push(eq(documents.type, type))
  if (q) conditions.push(like(documents.title, `%${q}%`))

  const rows = await db
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
  // .all() is for synchronous sqlite, but D1 is async.
  // Drizzle's unified interface usually supports await .all() or just await query builder.
  // For universal support, we should assume async.
  // .all() might be specific to bun-sqlite synchronous driver?
  // Let's iterate: Drizzle usually returns a Promise if we await it, but .all() might be the sync method.
  // We should check what the generic interface supports.
  // Usually with generic usage, we just await the query builder.

  return c.json({ items: rows })
})

routes.get('/documents/:id', async (c) => {
  const id = c.req.param('id')
  const user = (c.req.query('user') ?? '').trim()
  const db = c.get('db')

  const results = await db
    .select()
    .from(documents)
    .where(user ? and(eq(documents.id, id), eq(documents.user, user)) : eq(documents.id, id))
    .limit(1)
  // .get() is convenient but might differ between adapters.
  // Using limit(1) and taking [0] is safer for universal async.

  const row = results[0]

  if (!row) {
    return c.json({ error: 'not_found' }, 404)
  }

  return c.json({
    ...row,
    payload: parsePayload(row.payload),
  })
})

routes.post('/documents', async (c) => {
  const body = await c.req.json().catch(() => null)
  const user = typeof body?.user === 'string' ? body.user.trim() : 'anonymous'
  const type = typeof body?.type === 'string' ? body.type.trim() : ''
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const payload = body?.payload
  const force = Boolean(body?.force)

  if (!type || !title || payload === undefined) {
    return c.json({ error: 'user/type/title/payload are required' }, 400)
  }

  const db = c.get('db')

  const existingResults = await db
    .select()
    .from(documents)
    .where(and(eq(documents.user, user), eq(documents.title, title)))
    .limit(1)
  const existing = existingResults[0]

  const now = Date.now()

  if (existing && !force) {
    return c.json({ status: 'exists', document: existing }, 409)
  }

  const serialized = JSON.stringify(payload)

  if (existing && force) {
    await db
      .update(documents)
      .set({ payload: serialized, updatedAt: now, type: type || existing.type })
      .where(eq(documents.id, existing.id))

    console.log(`[POST /documents] Updated doc: ${existing.id}`)
    return c.json({ status: 'updated', id: existing.id })
  }

  const id = crypto.randomUUID()
  await db.insert(documents).values({
    id,
    user,
    type: type || 'unknown',
    title,
    payload: serialized,
    createdAt: now,
    updatedAt: now,
  })

  console.log(`[POST /documents] Created doc: ${id}, title=${title}`)
  return c.json({ id, user, type: type || 'unknown', title, createdAt: now, updatedAt: now }, 201)
})

routes.put('/documents/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => null)
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const payload = body?.payload
  const type = typeof body?.type === 'string' ? body.type.trim() : ''

  if (!title || payload === undefined) {
    return c.json({ error: 'title/payload are required' }, 400)
  }

  const db = c.get('db')

  const existingResults = await db.select().from(documents).where(eq(documents.id, id)).limit(1)
  const existing = existingResults[0]

  if (!existing) {
    return c.json({ error: 'not_found' }, 404)
  }

  try {
    const timestamp = Date.now()
    await db
      .update(documents)
      .set({
        payload: JSON.stringify(payload),
        updatedAt: timestamp,
        title,
        type: type || existing.type,
      })
      .where(eq(documents.id, id))

    return c.json({ status: 'updated', id })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'internal_error' }, 500)
  }
})
