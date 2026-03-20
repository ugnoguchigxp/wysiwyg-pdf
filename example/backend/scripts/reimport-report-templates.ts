import { DatabaseSync } from 'node:sqlite'
import { loadReportTemplateSeeds } from '../src/report-template-seed'

const DB_PATH = `${process.cwd()}/data.sqlite`
const USER = 'anonymous'
const NOW = Date.now()

const main = async () => {
  const db = new DatabaseSync(DB_PATH)
  const selectStmt = db.prepare(
    'SELECT id FROM documents WHERE user = ? AND title = ? LIMIT 1'
  )
  const updateStmt = db.prepare(
    'UPDATE documents SET type = ?, payload = ?, updated_at = ? WHERE id = ?'
  )
  const insertStmt = db.prepare(
    'INSERT INTO documents (id, user, type, title, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )

  const templates = await loadReportTemplateSeeds()
  if (templates.length === 0) {
    console.log('No report templates found to import.')
    db.close()
    return
  }

  for (const template of templates) {
    const payloadText = JSON.stringify(template.payload)
    const existing = selectStmt.get(USER, template.title) as { id?: string } | undefined

    if (existing?.id) {
      updateStmt.run(template.type ?? 'report', payloadText, NOW, existing.id)
      console.log(`updated: ${template.title} (${existing.id})`)
    } else {
      const id = crypto.randomUUID()
      insertStmt.run(id, USER, template.type ?? 'report', template.title, payloadText, NOW, NOW)
      console.log(`inserted: ${template.title} (${id})`)
    }
  }

  db.close()
}

main().catch((err) => {
  console.error('Failed to reimport report templates:', err)
  process.exit(1)
})
