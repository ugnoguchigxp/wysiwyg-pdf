import { and, desc, eq, like } from 'drizzle-orm'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { schema } from './db'
import { importExcel as importExcelDoc } from './excel-importer'
import type { StorageService } from './storage/types'
import type { Bindings } from './types'

type Variables = {
  db: any
  storage: StorageService
}

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

routes.get('/preview-data', async (c) => {
  const db = c.get('db')
  const patientNo = c.req.query('patientNo') || 'P001'
  const s = schema as any

  const [doctorOrders, dialysis, conditions, devices, oxygen, medicines, comments] =
    await Promise.all([
      db
        .select()
        .from(s.doctorInstructions)
        .where(eq(s.doctorInstructions.patientNo, patientNo))
        .orderBy(s.doctorInstructions.drInstructionSeq)
        .limit(10),
      db
        .select()
        .from(s.dialysisRecords)
        .where(eq(s.dialysisRecords.patientNo, patientNo))
        .orderBy(s.dialysisRecords.dialysisDate)
        .limit(10),
      db
        .select()
        .from(s.dialysisConditions)
        .where(eq(s.dialysisConditions.patientNo, patientNo))
        .orderBy(s.dialysisConditions.dialysisDate)
        .limit(10),
      db.select().from(s.deviceInfo).orderBy(s.deviceInfo.index).limit(30),
      db.select().from(s.oxygenInfo).limit(10),
      db.select().from(s.medicineInfo).limit(20),
      db.select().from(s.treatmentComments).limit(10),
    ])

  return c.json({
    医師指示情報: doctorOrders,
    透析記録情報: dialysis,
    透析条件情報: conditions,
    装置情報: devices,
    酸素情報: oxygen,
    '薬剤・材料・処置情報': medicines,
    処置コメント情報: comments,
    patient:
      doctorOrders.length > 0
        ? [
            {
              'patient.name': doctorOrders[0].patientName,
              'patient.id': doctorOrders[0].patientNo,
              'patient.dob': doctorOrders[0].birthday,
            },
          ]
        : [],
  })
})

const parsePayload = (raw: string) => {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

const getFileBaseName = (name: string) => name.replace(/\.[^/.]+$/, '').trim()

const resolveUniqueTitle = async (db: any, user: string, baseTitle: string): Promise<string> => {
  const safeBase = baseTitle || 'Imported Excel'
  let candidate = safeBase
  let index = 2

  while (true) {
    const existing = await db
      .select({ id: schema.documents.id })
      .from(schema.documents)
      .where(and(eq(schema.documents.user, user), eq(schema.documents.title, candidate)))
      .limit(1)

    if (!existing[0]) return candidate
    candidate = `${safeBase} (${index})`
    index += 1
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
  const conditions = [eq(schema.documents.user, user)]
  if (type) conditions.push(eq(schema.documents.type, type))
  if (q) conditions.push(like(schema.documents.title, `%${q}%`))
  const rows = await db
    .select({
      id: schema.documents.id,
      user: schema.documents.user,
      type: schema.documents.type,
      title: schema.documents.title,
      createdAt: schema.documents.createdAt,
      updatedAt: schema.documents.updatedAt,
    })
    .from(schema.documents)
    .where(and(...conditions))
    .orderBy(desc(schema.documents.updatedAt))
    .limit(limit)
    .offset(offset)
  return c.json({ items: rows })
})

routes.get('/documents/:id', async (c) => {
  const id = c.req.param('id')
  const db = c.get('db')
  const results = await db
    .select()
    .from(schema.documents)
    .where(eq(schema.documents.id, id))
    .limit(1)
  const row = results[0]
  if (!row) return c.json({ error: 'not_found' }, 404)
  return c.json({ ...row, payload: parsePayload(row.payload) })
})

routes.post('/excel/import', async (c) => {
  const body = await c.req.parseBody().catch(() => null)
  const rawFile = body?.file
  const file = Array.isArray(rawFile) ? rawFile[0] : rawFile

  if (!(file instanceof File)) {
    return c.json({ error: 'file is required' }, 400)
  }

  if (!file.name.match(/\.(xlsx|xls|xlsm)$/i)) {
    return c.json({ error: 'unsupported file type' }, 400)
  }

  try {
    const db = c.get('db')
    const user = 'anonymous'
    const fileBuffer = await file.arrayBuffer()
    const baseTitle = getFileBaseName(file.name) || 'Imported Excel'
    const converted = await importExcelDoc(fileBuffer, { documentTitle: baseTitle })
    const title = await resolveUniqueTitle(db, user, converted.title || baseTitle)
    const now = Date.now()
    const id = crypto.randomUUID()

    await db.insert(schema.documents).values({
      id,
      user,
      type: 'report',
      title,
      payload: JSON.stringify(converted),
      createdAt: now,
      updatedAt: now,
    })

    return c.json({ id, title }, 201)
  } catch (error) {
    console.error('Excel import failed', error)
    return c.json({ error: 'excel import failed' }, 500)
  }
})

routes.post('/documents', async (c) => {
  const body = await c.req.json().catch(() => null)
  const user = typeof body?.user === 'string' ? body.user.trim() : 'anonymous'
  const type = typeof body?.type === 'string' ? body.type.trim() : ''
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const payload = body?.payload
  const force = Boolean(body?.force)
  if (!type || !title || payload === undefined)
    return c.json({ error: 'required fields missing' }, 400)
  const db = c.get('db')
  const existingResults = await db
    .select()
    .from(schema.documents)
    .where(and(eq(schema.documents.user, user), eq(schema.documents.title, title)))
    .limit(1)
  const existing = existingResults[0]
  const now = Date.now()
  if (existing && !force) return c.json({ status: 'exists', document: existing }, 409)
  const serialized = JSON.stringify(payload)
  if (existing && force) {
    await db
      .update(schema.documents)
      .set({ payload: serialized, updatedAt: now, type: type || existing.type })
      .where(eq(schema.documents.id, existing.id))
    return c.json({ status: 'updated', id: existing.id })
  }
  const id = crypto.randomUUID()
  await db.insert(schema.documents).values({
    id,
    user,
    type: type || 'unknown',
    title,
    payload: serialized,
    createdAt: now,
    updatedAt: now,
  })
  return c.json({ id, user, type: type || 'unknown', title, createdAt: now, updatedAt: now }, 201)
})

routes.put('/documents/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => null)
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const payload = body?.payload
  if (!title || payload === undefined) return c.json({ error: 'required fields missing' }, 400)
  const db = c.get('db')
  const existingResults = await db
    .select()
    .from(schema.documents)
    .where(eq(schema.documents.id, id))
    .limit(1)
  if (!existingResults[0]) return c.json({ error: 'not_found' }, 404)
  await db
    .update(schema.documents)
    .set({ payload: JSON.stringify(payload), updatedAt: Date.now(), title })
    .where(eq(schema.documents.id, id))
  return c.json({ status: 'updated', id })
})
