import JSZip from 'jszip'
import type { ExcelImage } from '../types/excel'

const REL_TYPE_WORKSHEET =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet'
const REL_TYPE_DRAWING =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing'
const REL_TYPE_CHART = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart'
const REL_TYPE_IMAGE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image'

type Relationship = {
  id: string
  type: string
  target: string
}

type ChartAnchor = {
  chartRelId: string
  from: {
    row: number
    col: number
    rowOffPx: number
    colOffPx: number
  }
  to: {
    row: number
    col: number
    rowOffPx: number
    colOffPx: number
  }
}

type ChartSeries = {
  color: string
  yValues: number[]
  markerPictureRelId?: string
  markerSymbol?: string
  markerSizePx: number
}

type ChartAxisScale = {
  min?: number
  max?: number
  majorUnit?: number
  minorUnit?: number
}

/**
 * OOXML(drawing/chart) から ExcelJS が拾えない chart オブジェクトを SVG 画像として抽出する。
 * 戻り値の key は worksheet.id (= workbook.xml の sheetId)。
 */
export async function extractChartImagesFromBuffer(
  buffer: ArrayBuffer
): Promise<Map<number, ExcelImage[]>> {
  const zip = await JSZip.loadAsync(buffer)

  const workbookXml = await readZipText(zip, 'xl/workbook.xml')
  const workbookRelsXml = await readZipText(zip, 'xl/_rels/workbook.xml.rels')
  if (!workbookXml || !workbookRelsXml) {
    return new Map()
  }

  const workbookRels = parseRelationships(workbookRelsXml)
  const worksheetRelById = new Map(
    workbookRels.filter((rel) => rel.type === REL_TYPE_WORKSHEET).map((rel) => [rel.id, rel])
  )

  const sheetEntries = parseWorkbookSheetEntries(workbookXml)
  const out = new Map<number, ExcelImage[]>()

  for (const entry of sheetEntries) {
    const rel = worksheetRelById.get(entry.relId)
    if (!rel) continue

    const sheetPartPath = resolvePartPath('xl/workbook.xml', rel.target)
    const sheetRelsPath = toRelsPath(sheetPartPath)
    const sheetRelsXml = await readZipText(zip, sheetRelsPath)
    if (!sheetRelsXml) continue

    const sheetRels = parseRelationships(sheetRelsXml)
    const drawingRels = sheetRels.filter((item) => item.type === REL_TYPE_DRAWING)
    if (drawingRels.length === 0) continue

    const sheetImages: ExcelImage[] = []

    for (const drawingRel of drawingRels) {
      const drawingPartPath = resolvePartPath(sheetPartPath, drawingRel.target)
      const drawingXml = await readZipText(zip, drawingPartPath)
      if (!drawingXml) continue

      const drawingRelsPath = toRelsPath(drawingPartPath)
      const drawingRelsXml = await readZipText(zip, drawingRelsPath)
      const drawingRelationshipList = drawingRelsXml ? parseRelationships(drawingRelsXml) : []
      const chartRelById = new Map(
        drawingRelationshipList
          .filter((item) => item.type === REL_TYPE_CHART)
          .map((item) => [item.id, item])
      )

      const anchors = parseChartAnchors(drawingXml)
      let chartSeq = 0

      for (const anchor of anchors) {
        const chartRel = chartRelById.get(anchor.chartRelId)
        if (!chartRel) continue

        const chartPartPath = resolvePartPath(drawingPartPath, chartRel.target)
        const chartXml = await readZipText(zip, chartPartPath)
        if (!chartXml) continue

        const chartRelsPath = toRelsPath(chartPartPath)
        const chartRelsXml = await readZipText(zip, chartRelsPath)
        const chartRels = chartRelsXml ? parseRelationships(chartRelsXml) : []
        const imageDataUriByRelId = await extractImageDataUriByRelId(zip, chartPartPath, chartRels)

        const svg = buildScatterLikeChartSvg(chartXml, imageDataUriByRelId)
        const bytes = new TextEncoder().encode(svg)

        sheetImages.push({
          id: `chart_${entry.sheetId}_${chartSeq}`,
          type: 'image',
          extension: 'svg+xml',
          data: bytes,
          range: {
            from: {
              row: anchor.from.row,
              col: anchor.from.col,
              rowOff: anchor.from.rowOffPx,
              colOff: anchor.from.colOffPx,
            },
            to: {
              row: anchor.to.row,
              col: anchor.to.col,
              rowOff: anchor.to.rowOffPx,
              colOff: anchor.to.colOffPx,
            },
          },
        })

        chartSeq += 1
      }
    }

    if (sheetImages.length > 0) {
      out.set(entry.sheetId, sheetImages)
    }
  }

  return out
}

async function extractImageDataUriByRelId(
  zip: JSZip,
  partPath: string,
  rels: Relationship[]
): Promise<Map<string, string>> {
  const out = new Map<string, string>()

  for (const rel of rels) {
    if (rel.type !== REL_TYPE_IMAGE) continue
    const targetPath = resolvePartPath(partPath, rel.target)
    const file = zip.file(targetPath)
    if (!file) continue

    const bytes = await file.async('uint8array')
    const ext = getExtension(targetPath)
    const mime =
      ext === 'jpg' || ext === 'jpeg'
        ? 'image/jpeg'
        : ext === 'gif'
          ? 'image/gif'
          : ext === 'webp'
            ? 'image/webp'
            : 'image/png'
    out.set(rel.id, `data:${mime};base64,${toBase64(bytes)}`)
  }

  return out
}

function buildScatterLikeChartSvg(
  chartXml: string,
  imageDataUriByRelId: Map<string, string>
): string {
  const width = 1200
  const height = 420

  const layout = parsePlotLayout(chartXml) ?? { x: 0.16, y: 0.1, w: 0.78, h: 0.76 }
  const plotX = clamp(layout.x, 0, 0.95) * width
  const plotY = clamp(layout.y, 0, 0.95) * height
  const plotW = clamp(layout.w, 0.05, 1) * width
  const plotH = clamp(layout.h, 0.05, 1) * height

  const yScale = parseYAxisScale(chartXml)
  const series = parseChartSeries(chartXml)

  const allValues = series.flatMap((item) => item.yValues).filter(Number.isFinite)
  const minV = Number.isFinite(yScale.min)
    ? Number(yScale.min)
    : allValues.length > 0
      ? Math.min(...allValues)
      : 0
  const maxV = Number.isFinite(yScale.max)
    ? Number(yScale.max)
    : allValues.length > 0
      ? Math.max(...allValues)
      : 100
  const valueRange = Math.max(1, maxV - minV)

  const majorStep =
    yScale.majorUnit && yScale.majorUnit > 0 ? yScale.majorUnit : Math.max(10, valueRange / 4)
  const minorStep = yScale.minorUnit && yScale.minorUnit > 0 ? yScale.minorUnit : undefined

  const fragments: string[] = []
  fragments.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`
  )
  fragments.push('<rect x="0" y="0" width="100%" height="100%" fill="#ffffff"/>')
  fragments.push(
    `<rect x="${fmt(plotX)}" y="${fmt(plotY)}" width="${fmt(plotW)}" height="${fmt(plotH)}" fill="none" stroke="#7f7f7f" stroke-width="1.4"/>`
  )

  const majorValues = buildScaleValues(minV, maxV, majorStep, 20)
  for (const v of majorValues) {
    const y = valueToY(v, minV, maxV, plotY, plotH)
    fragments.push(
      `<line x1="${fmt(plotX)}" y1="${fmt(y)}" x2="${fmt(plotX + plotW)}" y2="${fmt(y)}" stroke="#9b9b9b" stroke-width="1"/>`
    )
  }

  if (minorStep && minorStep > 0) {
    const minorValues = buildScaleValues(minV, maxV, minorStep, 80)
    for (const v of minorValues) {
      if (Math.abs(v % majorStep) < 0.00001) continue
      const y = valueToY(v, minV, maxV, plotY, plotH)
      fragments.push(
        `<line x1="${fmt(plotX)}" y1="${fmt(y)}" x2="${fmt(plotX + plotW)}" y2="${fmt(y)}" stroke="#d6d6d6" stroke-width="0.8"/>`
      )
    }
  }

  const verticalCount = 12
  for (let i = 0; i <= verticalCount; i++) {
    const x = plotX + (plotW * i) / verticalCount
    fragments.push(
      `<line x1="${fmt(x)}" y1="${fmt(plotY)}" x2="${fmt(x)}" y2="${fmt(plotY + plotH)}" stroke="#d6d6d6" stroke-width="0.8"/>`
    )
  }

  for (const item of series) {
    if (item.yValues.length === 0) continue
    const points = item.yValues.map((v, idx) => {
      const x =
        item.yValues.length <= 1
          ? plotX + plotW / 2
          : plotX + (plotW * idx) / Math.max(1, item.yValues.length - 1)
      const y = valueToY(v, minV, maxV, plotY, plotH)
      return { x, y }
    })

    if (points.length >= 2) {
      const polyline = points.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' ')
      fragments.push(
        `<polyline points="${polyline}" fill="none" stroke="${escapeXml(item.color)}" stroke-width="2"/>`
      )
    }

    for (const p of points) {
      const markerSize = Math.max(8, item.markerSizePx)
      const markerUri = item.markerPictureRelId
        ? imageDataUriByRelId.get(item.markerPictureRelId)
        : undefined
      if (markerUri) {
        fragments.push(
          `<image href="${escapeXml(markerUri)}" x="${fmt(p.x - markerSize / 2)}" y="${fmt(p.y - markerSize / 2)}" width="${fmt(markerSize)}" height="${fmt(markerSize)}" preserveAspectRatio="xMidYMid meet"/>`
        )
      } else {
        fragments.push(
          `<circle cx="${fmt(p.x)}" cy="${fmt(p.y)}" r="${fmt(markerSize / 3)}" fill="${escapeXml(item.color)}"/>`
        )
      }
    }
  }

  fragments.push(
    `<line x1="${fmt(plotX)}" y1="${fmt(plotY + plotH)}" x2="${fmt(plotX + plotW)}" y2="${fmt(plotY + plotH)}" stroke="#404040" stroke-width="1.4"/>`
  )
  fragments.push(
    `<line x1="${fmt(plotX)}" y1="${fmt(plotY)}" x2="${fmt(plotX)}" y2="${fmt(plotY + plotH)}" stroke="#404040" stroke-width="1.4"/>`
  )

  fragments.push(
    `<text x="${fmt(plotX - 8)}" y="${fmt(plotY + plotH + 20)}" text-anchor="end" font-family="Meiryo, 'Noto Sans JP', sans-serif" font-size="22" font-weight="700" fill="#202020">${escapeXml(formatAxisValue(minV))}</text>`
  )

  const xAxisTitle = parseXAxisTitle(chartXml)
  if (xAxisTitle) {
    fragments.push(
      `<text x="${fmt(plotX + plotW / 2)}" y="${fmt(plotY + plotH + 36)}" text-anchor="middle" font-family="Meiryo, 'Noto Sans JP', sans-serif" font-size="20" font-weight="700" fill="#202020">${escapeXml(xAxisTitle)}</text>`
    )
  }

  fragments.push('</svg>')
  return fragments.join('')
}

function parseWorkbookSheetEntries(workbookXml: string): Array<{ sheetId: number; relId: string }> {
  const out: Array<{ sheetId: number; relId: string }> = []
  const sheetTagRe = /<sheet\b[^>]*\/>/g
  for (const match of workbookXml.matchAll(sheetTagRe)) {
    const attrs = parseXmlAttributes(match[0])
    const sheetIdRaw = attrs.sheetId
    const relId = attrs['r:id']
    if (!sheetIdRaw || !relId) continue
    const sheetId = Number.parseInt(sheetIdRaw, 10)
    if (!Number.isFinite(sheetId)) continue
    out.push({ sheetId, relId })
  }
  return out
}

function parseRelationships(xml: string): Relationship[] {
  const out: Relationship[] = []
  const relRe = /<Relationship\b[^>]*\/>/g
  for (const match of xml.matchAll(relRe)) {
    const attrs = parseXmlAttributes(match[0])
    if (!attrs.Id || !attrs.Type || !attrs.Target) continue
    out.push({
      id: attrs.Id,
      type: attrs.Type,
      target: attrs.Target,
    })
  }
  return out
}

function parseChartAnchors(drawingXml: string): ChartAnchor[] {
  const out: ChartAnchor[] = []
  const anchorRe = /<xdr:twoCellAnchor\b[^>]*>([\s\S]*?)<\/xdr:twoCellAnchor>/g
  for (const match of drawingXml.matchAll(anchorRe)) {
    const block = match[1]
    const chartRelId = firstCapture(block, /<c:chart\b[^>]*r:id="([^"]+)"/)
    if (!chartRelId) continue

    const fromBlock = firstCapture(block, /<xdr:from>([\s\S]*?)<\/xdr:from>/)
    const toBlock = firstCapture(block, /<xdr:to>([\s\S]*?)<\/xdr:to>/)
    if (!fromBlock || !toBlock) continue

    const from = parseAnchorPoint(fromBlock)
    const to = parseAnchorPoint(toBlock)
    if (!from || !to) continue

    out.push({
      chartRelId,
      from,
      to,
    })
  }
  return out
}

function parseAnchorPoint(xml: string):
  | {
      row: number
      col: number
      rowOffPx: number
      colOffPx: number
    }
  | undefined {
  const row = parseIntTag(xml, 'xdr:row')
  const col = parseIntTag(xml, 'xdr:col')
  const rowOffEmu = parseIntTag(xml, 'xdr:rowOff') ?? 0
  const colOffEmu = parseIntTag(xml, 'xdr:colOff') ?? 0
  if (row === undefined || col === undefined) return undefined
  return {
    row,
    col,
    rowOffPx: emuToPx(rowOffEmu),
    colOffPx: emuToPx(colOffEmu),
  }
}

function parsePlotLayout(
  chartXml: string
): { x: number; y: number; w: number; h: number } | undefined {
  const layoutBlock = firstCapture(chartXml, /<c:manualLayout>([\s\S]*?)<\/c:manualLayout>/)
  if (!layoutBlock) return undefined
  const x = parseFloatTag(layoutBlock, 'c:x')
  const y = parseFloatTag(layoutBlock, 'c:y')
  const w = parseFloatTag(layoutBlock, 'c:w')
  const h = parseFloatTag(layoutBlock, 'c:h')
  if (![x, y, w, h].every((v) => Number.isFinite(v))) return undefined
  return { x: Number(x), y: Number(y), w: Number(w), h: Number(h) }
}

function parseYAxisScale(chartXml: string): ChartAxisScale {
  const blocks = [...chartXml.matchAll(/<c:valAx>([\s\S]*?)<\/c:valAx>/g)].map((m) => m[1])
  const leftAxis = blocks.find((block) => /<c:axPos\b[^>]*val="l"/.test(block))
  const axis = leftAxis ?? blocks[0]
  if (!axis) return {}

  return {
    min: parseFloatTag(axis, 'c:min'),
    max: parseFloatTag(axis, 'c:max'),
    majorUnit: parseFloatTag(axis, 'c:majorUnit'),
    minorUnit: parseFloatTag(axis, 'c:minorUnit'),
  }
}

function parseXAxisTitle(chartXml: string): string | undefined {
  const blocks = [...chartXml.matchAll(/<c:valAx>([\s\S]*?)<\/c:valAx>/g)].map((m) => m[1])
  const bottomAxis = blocks.find((block) => /<c:axPos\b[^>]*val="b"/.test(block))
  if (!bottomAxis) return undefined
  return firstCapture(bottomAxis, /<a:t>([^<]+)<\/a:t>/)?.trim()
}

function parseChartSeries(chartXml: string): ChartSeries[] {
  const out: ChartSeries[] = []
  for (const match of chartXml.matchAll(/<c:ser>([\s\S]*?)<\/c:ser>/g)) {
    const block = match[1]
    const colorHex = firstCapture(block, /<a:srgbClr\b[^>]*val="([0-9A-Fa-f]{6})"/)
    const yValues = parseSeriesValues(block)
    const markerPictureRelId = firstCapture(block, /<a:blip\b[^>]*r:embed="([^"]+)"/)
    const markerSymbol = firstCapture(block, /<c:marker>[\s\S]*?<c:symbol\b[^>]*val="([^"]+)"/)
    const markerSize = parseFloatTag(block, 'c:size')

    out.push({
      color: colorHex ? `#${colorHex.toUpperCase()}` : '#0070C0',
      yValues,
      markerPictureRelId,
      markerSymbol,
      markerSizePx: Number.isFinite(markerSize) ? Math.max(6, Number(markerSize) * 2.2) : 10,
    })
  }
  return out
}

function parseSeriesValues(seriesXml: string): number[] {
  const yValBlock = firstCapture(seriesXml, /<c:yVal>([\s\S]*?)<\/c:yVal>/)
  if (!yValBlock) return []
  const numCache = firstCapture(yValBlock, /<c:numCache>([\s\S]*?)<\/c:numCache>/)
  if (!numCache) return []

  const points: Array<{ idx: number; value: number }> = []
  for (const match of numCache.matchAll(/<c:pt\b[^>]*idx="(\d+)"[^>]*>\s*<c:v>([^<]+)<\/c:v>/g)) {
    const idx = Number.parseInt(match[1], 10)
    const value = Number.parseFloat(match[2])
    if (!Number.isFinite(idx) || !Number.isFinite(value)) continue
    points.push({ idx, value })
  }

  points.sort((a, b) => a.idx - b.idx)
  return points.map((item) => item.value)
}

function buildScaleValues(min: number, max: number, step: number, maxTicks: number): number[] {
  if (!Number.isFinite(step) || step <= 0) return []
  const start = Math.ceil(min / step) * step
  const out: number[] = []
  for (let value = start; value <= max + step * 0.0001; value += step) {
    out.push(Number(value.toFixed(8)))
    if (out.length >= maxTicks) break
  }
  return out
}

function valueToY(value: number, min: number, max: number, plotY: number, plotH: number): number {
  const range = Math.max(1, max - min)
  const ratio = (value - min) / range
  return plotY + plotH - ratio * plotH
}

function formatAxisValue(value: number): string {
  if (Math.abs(value - Math.round(value)) < 0.000001) {
    return `${Math.round(value)}`
  }
  return `${Number(value.toFixed(1))}`
}

function parseIntTag(xml: string, tagName: string): number | undefined {
  const raw = firstCapture(
    xml,
    new RegExp(`<${escapeRegExp(tagName)}>(-?\\d+)<\\/${escapeRegExp(tagName)}>`)
  )
  if (!raw) return undefined
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseFloatTag(xml: string, tagName: string): number | undefined {
  const raw = firstCapture(
    xml,
    new RegExp(`<${escapeRegExp(tagName)}\\b[^>]*val="(-?\\d+(?:\\.\\d+)?(?:E[+-]?\\d+)?)"`)
  )
  if (!raw) return undefined
  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseXmlAttributes(tag: string): Record<string, string> {
  const out: Record<string, string> = {}
  const attrRe = /([A-Za-z0-9:._-]+)="([^"]*)"/g
  for (const match of tag.matchAll(attrRe)) {
    out[match[1]] = match[2]
  }
  return out
}

function firstCapture(text: string, pattern: RegExp): string | undefined {
  const match = text.match(pattern)
  return match?.[1]
}

async function readZipText(zip: JSZip, path: string): Promise<string | undefined> {
  const file = zip.file(path)
  if (!file) return undefined
  return file.async('text')
}

function toRelsPath(partPath: string): string {
  const normalized = normalizePath(partPath)
  const dir = dirname(normalized)
  const base = basename(normalized)
  return normalizePath(`${dir}/_rels/${base}.rels`)
}

function resolvePartPath(basePartPath: string, target: string): string {
  if (!target) return normalizePath(basePartPath)
  if (target.startsWith('/')) return normalizePath(target.slice(1))
  const baseDir = dirname(normalizePath(basePartPath))
  return normalizePath(`${baseDir}/${target}`)
}

function normalizePath(path: string): string {
  const parts = path.replace(/\\/g, '/').split('/')
  const out: string[] = []

  for (const part of parts) {
    if (!part || part === '.') continue
    if (part === '..') {
      out.pop()
      continue
    }
    out.push(part)
  }

  return out.join('/')
}

function dirname(path: string): string {
  const normalized = normalizePath(path)
  const idx = normalized.lastIndexOf('/')
  if (idx === -1) return ''
  return normalized.slice(0, idx)
}

function basename(path: string): string {
  const normalized = normalizePath(path)
  const idx = normalized.lastIndexOf('/')
  if (idx === -1) return normalized
  return normalized.slice(idx + 1)
}

function getExtension(path: string): string {
  const idx = path.lastIndexOf('.')
  if (idx === -1) return ''
  return path.slice(idx + 1).toLowerCase()
}

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64')
}

function emuToPx(emu: number): number {
  // OOXML: 1px = 9525 EMU (@96DPI)
  return emu / 9525
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function fmt(value: number): string {
  return Number.isFinite(value) ? Number(value.toFixed(3)).toString() : '0'
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function escapeXml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}
