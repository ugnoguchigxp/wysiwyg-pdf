import type { Doc, ImageNode, TableNode, TextNode, UnifiedNode } from '@/types/canvas'

type BindingRecord = Record<string, unknown>
type BindingData = Record<string, BindingRecord[]>

/**
 * Data Resolver Utility
 *
 * Replaces placeholders in nodes with actual data.
 * Supports:
 * 1. bind property (e.g. "patient.name")
 * 2. Inline placeholders in text (e.g. "{透析記録情報}.[bp]")
 *
 * If multiple nodes bind to the same path, they are assigned sequential records
 * from the data array (repeater support).
 */
export function resolveBindingData(doc: Doc, data: BindingData): Doc {
  if (!data) return doc

  const counters: Record<string, number> = {}

  const placeholderResolvedNodes = doc.nodes.map((node): UnifiedNode => {
    // 1. Check direct bind property
    if (node.bind) {
      const value = getValueFromPath(data, node.bind, counters)
      if (value !== undefined) {
        if (node.t === 'text') {
          return { ...node, text: String(value) } as TextNode
        }
        // Handle other types if needed (e.g. image src)
      }
    }

    // 2. Check text content for inline placeholders {Table}.[Field]
    if (node.t === 'text') {
      const textNode = node as TextNode
      if (textNode.text?.includes('{')) {
        const resolvedText = replacePlaceholders(textNode.text, data, counters)
        return { ...node, text: cleanValue(resolvedText) } as TextNode
      }
    }

    // 3. Check table cells
    if (node.t === 'table') {
      const tableNode = node as TableNode
      const newCells = tableNode.table.cells.map((cell) => {
        if (cell.v?.includes('{')) {
          const resolvedValue = replacePlaceholders(cell.v, data, counters)
          return {
            ...cell,
            v: cleanValue(resolvedValue),
            wrap: true, // Force wrap if data is injected to prevent overflow
          }
        }
        return cell
      })
      return {
        ...node,
        table: {
          ...tableNode.table,
          cells: newCells,
        },
      } as TableNode
    }

    return node
  })

  const chartResolvedNodes = resolveChartImageBindings(placeholderResolvedNodes, data)
  return { ...doc, nodes: chartResolvedNodes }
}

/**
 * Extracts value from data object using a path like "category.field"
 * and handles sequential indexing for repeaters.
 */
function getValueFromPath(
  data: BindingData,
  path: string,
  counters: Record<string, number>
): unknown {
  // Support both "category.field" and "{Category}.[Field]"
  let category = ''
  let field = ''

  const excelMatch = path.match(/^\{(.+?)\}\.\[(.+?)\]$/)
  if (excelMatch) {
    category = excelMatch[1]
    field = excelMatch[2]
  } else {
    const parts = path.split('.')
    if (parts.length === 2) {
      category = parts[0]
      field = parts[1]
    }
  }

  if (!category || !field) return undefined

  const records = data[category] || []
  if (!Array.isArray(records) || records.length === 0) return undefined

  // Sequential index management
  const counterKey = `${category}.${field}`
  const index = counters[counterKey] || 0

  const record = records[index % records.length] // Loop back if exceeded, or should we return empty?
  // Usually, if we have 3 records and 4 fields, the 4th might be empty or loop.
  // User said "時系列で合致する要素順で表示", so if data is missing, maybe return original or empty.

  if (index >= records.length) return '' // Return empty if no more data records

  counters[counterKey] = index + 1
  return record[field]
}

/**
 * Replaces all placeholders in a string.
 */
function replacePlaceholders(
  text: string,
  data: BindingData,
  counters: Record<string, number>
): string {
  // Pattern: {Table}.[Field]
  return text.replace(/\{(.+?)\}\.\[(.+?)\]/g, (_match, category, field) => {
    const val = getValueFromPath(data, `{${category}}.[${field}]`, counters)
    // Clear syntax if not resolved to hide it in print
    return val !== undefined ? String(val) : ''
  })
}

/**
 * Cleans up Excel formula errors and JSON-like error strings.
 */
function cleanValue(val: string): string {
  if (!val) return ''
  // Suppress Excel macro/formula errors
  if (val.includes('#VALUE!') || val.includes('#REF!') || val.includes('#NAME?')) return ''
  if (val.includes('"error":"#VALUE!"')) return ''
  return val
}

type ChartSeriesSpec = {
  label: string
  fieldCandidates: string[]
  color: string
}

type ChartBindingConfig = {
  category?: string
  xField?: string
  series?: Array<{ field: string; label?: string; color?: string }>
}

const DEFAULT_CHART_SERIES: ChartSeriesSpec[] = [
  {
    label: '血液量',
    fieldCandidates: ['血液量', '血液流量', 'bloodFlow'],
    color: '#dc2626',
  },
  {
    label: '静脈圧',
    fieldCandidates: ['静脈圧', 'venousPressure'],
    color: '#111827',
  },
  {
    label: '透析液圧',
    fieldCandidates: ['透析液圧', 'dialysatePressure'],
    color: '#2563eb',
  },
]

const DEFAULT_X_FIELD_CANDIDATES = ['測定時間', '測定時刻', 'measureTime', 'time']
const DEFAULT_CATEGORY_CANDIDATES = ['装置情報', 'deviceInfo', 'device_info']

function resolveChartImageBindings(nodes: UnifiedNode[], data: BindingData): UnifiedNode[] {
  const tableHints = extractTablePlaceholderHints(nodes)

  return nodes.map((node) => {
    if (node.t !== 'image') return node

    const imageNode = node as ImageNode
    if (!isBindableChartNode(imageNode)) return node

    const dataBinding = getChartBindingFromNode(imageNode)
    const category = pickCategoryKey(
      data,
      dataBinding?.category ? [dataBinding.category] : DEFAULT_CATEGORY_CANDIDATES
    )
    if (!category) return node

    const records = data[category]
    if (!Array.isArray(records) || records.length === 0) return node

    const xField = resolveFieldName(
      records,
      dataBinding?.xField
        ? [dataBinding.xField]
        : [...tableHints.xFieldCandidates, ...DEFAULT_X_FIELD_CANDIDATES]
    )
    if (!xField) return node

    const series = resolveSeries(records, dataBinding, tableHints.yFieldCandidates)
    if (series.length === 0) return node

    const chartSvg = buildDialysisChartSvg(records, xField, series)
    if (!chartSvg) return node

    const nextData = {
      ...(imageNode.data || {}),
      chartBound: true,
      chartCategory: category,
      chartXField: xField,
      chartSeries: series.map((s) => ({ field: s.field, label: s.label, color: s.color })),
    }

    return {
      ...imageNode,
      src: svgToDataUrl(chartSvg),
      data: nextData,
    } as ImageNode
  })
}

function isBindableChartNode(node: ImageNode): boolean {
  if (node.data && (node.data as Record<string, unknown>).excelObjectType === 'chart') return true
  if (node.id.includes('img_chart_')) return true
  if (node.name?.includes('グラフ')) return true
  return false
}

function getChartBindingFromNode(node: ImageNode): ChartBindingConfig | null {
  const cfg = node.data && (node.data as Record<string, unknown>).chartBinding
  if (!cfg || typeof cfg !== 'object') return null
  return cfg as ChartBindingConfig
}

function resolveSeries(
  records: Record<string, unknown>[],
  bindingConfig: ChartBindingConfig | null,
  tableFieldHints: string[]
): Array<{ field: string; label: string; color: string }> {
  if (bindingConfig?.series && bindingConfig.series.length > 0) {
    const resolved = bindingConfig.series
      .map((item, index) => {
        const field = resolveFieldName(records, [item.field])
        if (!field) return null
        return {
          field,
          label: item.label || item.field,
          color: item.color || defaultSeriesColor(index),
        }
      })
      .filter((item): item is { field: string; label: string; color: string } => !!item)
    return resolved
  }

  const hints = tableFieldHints.length > 0 ? tableFieldHints : []
  const result: Array<{ field: string; label: string; color: string }> = []
  for (const spec of DEFAULT_CHART_SERIES) {
    const field = resolveFieldName(records, [...hints, ...spec.fieldCandidates])
    if (!field) continue
    if (result.some((s) => s.field === field)) continue
    result.push({ field, label: spec.label, color: spec.color })
  }
  return result
}

function extractTablePlaceholderHints(nodes: UnifiedNode[]): {
  xFieldCandidates: string[]
  yFieldCandidates: string[]
} {
  const allFields = new Set<string>()
  for (const node of nodes) {
    if (node.t !== 'table') continue
    const tableNode = node as TableNode
    for (const cell of tableNode.table.cells) {
      if (!cell.v || !cell.v.includes('{')) continue
      for (const match of cell.v.matchAll(/\{(.+?)\}\.\[(.+?)\]/g)) {
        const category = match[1]
        const field = match[2]
        if (category !== '装置情報') continue
        allFields.add(field)
      }
    }
  }

  const xFieldCandidates = [...allFields].filter((f) =>
    ['測定時間', '測定時刻', 'measureTime', 'time'].includes(f)
  )
  const yFieldCandidates = [...allFields].filter((f) =>
    [
      '血液量',
      '血液流量',
      '静脈圧',
      '透析液圧',
      'bloodFlow',
      'venousPressure',
      'dialysatePressure',
    ].includes(f)
  )

  return { xFieldCandidates, yFieldCandidates }
}

function pickCategoryKey(data: BindingData, candidates: string[]): string | null {
  for (const key of candidates) {
    const records = data[key]
    if (Array.isArray(records) && records.length > 0) return key
  }
  return null
}

function resolveFieldName(records: Record<string, unknown>[], candidates: string[]): string | null {
  if (records.length === 0) return null
  const firstRecord = records[0] || {}
  for (const c of candidates) {
    if (c in firstRecord) return c
  }
  // Fallback: loose normalized match against first record keys
  const keys = Object.keys(firstRecord)
  for (const c of candidates) {
    const target = normalizeKey(c)
    const matched = keys.find((key) => normalizeKey(key) === target)
    if (matched) return matched
  }
  return null
}

function normalizeKey(value: string): string {
  return value
    .replace(/\s+/g, '')
    .replace(/[（）()_-]/g, '')
    .toLowerCase()
}

function buildDialysisChartSvg(
  records: Record<string, unknown>[],
  xField: string,
  series: Array<{ field: string; label: string; color: string }>
): string | null {
  type Point = { xLabel: string; values: Array<number | null> }
  const points: Point[] = records.map((record) => ({
    xLabel: String(record[xField] ?? ''),
    values: series.map((s) => toNumeric(record[s.field])),
  }))

  const validValues = points.flatMap((p) => p.values.filter((v): v is number => Number.isFinite(v)))
  if (validValues.length === 0) return null

  const width = 1200
  const height = 420
  const margin = { top: 36, right: 20, bottom: 56, left: 68 }
  const plotW = width - margin.left - margin.right
  const plotH = height - margin.top - margin.bottom

  const minValueRaw = Math.min(...validValues)
  const maxValueRaw = Math.max(...validValues)
  const span = Math.max(1, maxValueRaw - minValueRaw)
  const padding = Math.max(5, span * 0.08)
  const minValue = Math.floor((minValueRaw - padding) / 10) * 10
  const maxValue = Math.ceil((maxValueRaw + padding) / 10) * 10
  const ySpan = Math.max(1, maxValue - minValue)

  const yTicks = 6
  const xCount = Math.max(1, points.length - 1)

  const toX = (index: number) => margin.left + (plotW * index) / xCount
  const toY = (value: number) => margin.top + ((maxValue - value) / ySpan) * plotH

  const lineFragments: string[] = []
  const pointFragments: string[] = []

  for (let sIndex = 0; sIndex < series.length; sIndex++) {
    const s = series[sIndex]
    const polylinePoints: string[] = []
    points.forEach((point, index) => {
      const v = point.values[sIndex]
      if (v === null || !Number.isFinite(v)) return
      const x = toX(index)
      const y = toY(v)
      polylinePoints.push(`${fmtSvg(x)},${fmtSvg(y)}`)
      pointFragments.push(
        `<circle cx="${fmtSvg(x)}" cy="${fmtSvg(y)}" r="4.5" fill="${escapeXml(s.color)}" />`
      )
    })
    if (polylinePoints.length > 1) {
      lineFragments.push(
        `<polyline points="${polylinePoints.join(' ')}" fill="none" stroke="${escapeXml(s.color)}" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round" />`
      )
    }
  }

  const gridLines: string[] = []
  for (let i = 0; i <= yTicks; i++) {
    const ratio = i / yTicks
    const y = margin.top + plotH * ratio
    const v = maxValue - ySpan * ratio
    gridLines.push(
      `<line x1="${fmtSvg(margin.left)}" y1="${fmtSvg(y)}" x2="${fmtSvg(margin.left + plotW)}" y2="${fmtSvg(y)}" stroke="#d1d5db" stroke-width="${i === yTicks ? '1.5' : '1'}" />`
    )
    gridLines.push(
      `<text x="${fmtSvg(margin.left - 8)}" y="${fmtSvg(y + 5)}" text-anchor="end" font-family="Meiryo, 'Noto Sans JP', sans-serif" font-size="18" fill="#374151">${escapeXml(formatTickValue(v))}</text>`
    )
  }

  const xLabels: string[] = []
  const maxLabelCount = 12
  const step = Math.max(1, Math.ceil(points.length / maxLabelCount))
  for (let i = 0; i < points.length; i += step) {
    const x = toX(i)
    xLabels.push(
      `<text x="${fmtSvg(x)}" y="${fmtSvg(margin.top + plotH + 26)}" text-anchor="middle" font-family="Meiryo, 'Noto Sans JP', sans-serif" font-size="18" fill="#374151">${escapeXml(points[i].xLabel)}</text>`
    )
    xLabels.push(
      `<line x1="${fmtSvg(x)}" y1="${fmtSvg(margin.top + plotH)}" x2="${fmtSvg(x)}" y2="${fmtSvg(margin.top + plotH + 6)}" stroke="#6b7280" stroke-width="1" />`
    )
  }

  const legends: string[] = []
  const legendStartX = margin.left
  let legendX = legendStartX
  const legendY = 20
  for (const s of series) {
    legends.push(
      `<line x1="${fmtSvg(legendX)}" y1="${fmtSvg(legendY)}" x2="${fmtSvg(legendX + 24)}" y2="${fmtSvg(legendY)}" stroke="${escapeXml(s.color)}" stroke-width="3" />`
    )
    legends.push(
      `<text x="${fmtSvg(legendX + 30)}" y="${fmtSvg(legendY + 6)}" font-family="Meiryo, 'Noto Sans JP', sans-serif" font-size="18" fill="#111827">${escapeXml(s.label)}</text>`
    )
    legendX += 155
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
    `<rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff" />`,
    ...legends,
    ...gridLines,
    `<line x1="${fmtSvg(margin.left)}" y1="${fmtSvg(margin.top + plotH)}" x2="${fmtSvg(margin.left + plotW)}" y2="${fmtSvg(margin.top + plotH)}" stroke="#6b7280" stroke-width="1.6" />`,
    `<line x1="${fmtSvg(margin.left)}" y1="${fmtSvg(margin.top)}" x2="${fmtSvg(margin.left)}" y2="${fmtSvg(margin.top + plotH)}" stroke="#6b7280" stroke-width="1.6" />`,
    ...xLabels,
    ...lineFragments,
    ...pointFragments,
    `</svg>`,
  ].join('')
}

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${toBase64(svg)}`
}

function toNumeric(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const normalized = value.replace(/,/g, '').replace(/[^\d.-]/g, '')
  if (!normalized) return null
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function toBase64(value: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'utf-8').toString('base64')
  }
  if (typeof btoa === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    return btoa(unescape(encodeURIComponent(value)))
  }
  return ''
}

function defaultSeriesColor(index: number): string {
  const palette = ['#dc2626', '#111827', '#2563eb', '#059669', '#9333ea']
  return palette[index % palette.length]
}

function fmtSvg(value: number): string {
  return Number(value.toFixed(3)).toString()
}

function formatTickValue(value: number): string {
  if (Math.abs(value - Math.round(value)) < 0.0001) return `${Math.round(value)}`
  return `${Number(value.toFixed(1))}`
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}
