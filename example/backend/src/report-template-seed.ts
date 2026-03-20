import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { importExcelFromFile } from './excel-importer'

export interface ReportTemplateSeed {
  title: string
  payload: unknown
  type?: string
}

type TemplateSource = {
  title: string
  basename: string
}

const DEFAULT_TEMPLATE_SOURCES: TemplateSource[] = [
  { title: '医師指示テンプレート', basename: 'doctor_order' },
  { title: '透析記録テンプレート', basename: 'standard_record' },
]

const EXCEL_EXTENSIONS = ['.xlsm', '.xlsx', '.xls'] as const

function resolveFromCwd(pathLike: string) {
  return resolve(process.cwd(), pathLike)
}

function toSeedFileCandidates(): string[] {
  const envPath = process.env.REPORT_TEMPLATE_SEED_FILE?.trim()
  const defaults = ['./template/local/report-templates.seed.json']
  return [envPath, ...defaults].filter((value): value is string => Boolean(value))
}

function toTemplateDirCandidates(): string[] {
  const envDir = process.env.REPORT_TEMPLATE_XLS_DIR?.trim()
  // Legacy "./template" is kept as a fallback for backward compatibility.
  return [envDir, './template/local', './template'].filter((value): value is string =>
    Boolean(value)
  )
}

function normalizeTemplateSeed(value: unknown): ReportTemplateSeed | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  if (typeof row.title !== 'string' || row.title.trim() === '') return null
  if (!('payload' in row)) return null
  const type = typeof row.type === 'string' && row.type.trim() ? row.type : 'report'
  return {
    title: row.title.trim(),
    type,
    payload: row.payload,
  }
}

function parseSeedPayload(raw: string): ReportTemplateSeed[] {
  const parsed = JSON.parse(raw) as unknown
  const rows = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as any).templates)
      ? (parsed as any).templates
      : []
  return rows.map(normalizeTemplateSeed).filter((row): row is ReportTemplateSeed => row !== null)
}

async function loadFromSeedJson(): Promise<ReportTemplateSeed[]> {
  for (const pathLike of toSeedFileCandidates()) {
    const filePath = resolveFromCwd(pathLike)
    if (!existsSync(filePath)) continue

    try {
      const raw = await readFile(filePath, 'utf-8')
      const parsed = parseSeedPayload(raw)
      if (parsed.length > 0) {
        console.log(`[seed] Loaded ${parsed.length} report template(s) from ${filePath}`)
        return parsed
      }
      console.warn(`[seed] Seed file found but no valid templates: ${filePath}`)
    } catch (error) {
      console.warn(`[seed] Failed to read seed file: ${filePath}`, error)
    }
  }

  return []
}

function findExcelTemplatePath(templateDir: string, basename: string): string | null {
  for (const ext of EXCEL_EXTENSIONS) {
    const candidate = resolveFromCwd(`${templateDir}/${basename}${ext}`)
    if (existsSync(candidate)) return candidate
  }
  return null
}

async function loadFromExcelFiles(): Promise<ReportTemplateSeed[]> {
  const templatesByTitle = new Map<string, ReportTemplateSeed>()

  for (const templateDir of toTemplateDirCandidates()) {
    for (const source of DEFAULT_TEMPLATE_SOURCES) {
      if (templatesByTitle.has(source.title)) continue
      const filePath = findExcelTemplatePath(templateDir, source.basename)
      if (!filePath) continue

      try {
        console.log(`[seed] Importing report template from Excel: ${filePath}`)
        const payload = await importExcelFromFile(filePath, { sheetIndex: 0 })
        templatesByTitle.set(source.title, {
          title: source.title,
          type: 'report',
          payload,
        })
      } catch (error) {
        console.warn(`[seed] Failed to import report template: ${filePath}`, error)
      }
    }
  }

  const templates = Array.from(templatesByTitle.values())
  if (templates.length > 0) {
    console.log(`[seed] Loaded ${templates.length} report template(s) from Excel sources.`)
  }
  return templates
}

export async function loadReportTemplateSeeds(): Promise<ReportTemplateSeed[]> {
  const fromJson = await loadFromSeedJson()
  if (fromJson.length > 0) return fromJson

  const fromExcel = await loadFromExcelFiles()
  if (fromExcel.length > 0) return fromExcel

  console.log(
    '[seed] No report template seeds found. Set REPORT_TEMPLATE_SEED_FILE or REPORT_TEMPLATE_XLS_DIR if needed.'
  )
  return []
}
