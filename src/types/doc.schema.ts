import { z } from 'zod'
import type { Doc, TableData, UnifiedNode } from './canvas'

export const NodeIdSchema = z.string().min(1)
export const SurfaceIdSchema = z.string().min(1)
export const ColorSchema = z.string().regex(/^(#[0-9A-Fa-f]{6}|rgba?\(|hsla?\(|transparent)/)

const BaseNodeSchema = z.object({
  id: NodeIdSchema,
  s: SurfaceIdSchema,
  r: z.number().optional().default(0),
  opacity: z.number().min(0).max(1).optional().default(1),
  locked: z.boolean().optional(),
  hidden: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  bind: z.string().optional(),
  name: z.string().optional(),
  data: z.record(z.unknown()).optional(),
  isPlaceholder: z.boolean().optional(),
})

export const TextNodeSchema = BaseNodeSchema.extend({
  t: z.literal('text'),
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
  text: z.string(),
  font: z.string().optional(),
  fontSize: z.number().positive().optional(),
  fontWeight: z.number().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  lineThrough: z.boolean().optional(),
  align: z.enum(['l', 'c', 'r', 'j']).optional(),
  vAlign: z.enum(['t', 'm', 'b']).optional(),
  fill: ColorSchema.optional(),
  hasFrame: z.boolean().optional(),
  borderColor: ColorSchema.optional(),
  borderWidth: z.number().optional(),
  backgroundColor: ColorSchema.optional(),
  padding: z.number().optional(),
  cornerRadius: z.number().optional(),
  stroke: ColorSchema.optional(),
  strokeW: z.number().optional(),
  dynamicContent: z.string().optional(),
})

export const ShapeNodeSchema = BaseNodeSchema.extend({
  t: z.literal('shape'),
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
  shape: z.enum([
    'rect',
    'circle',
    'triangle',
    'diamond',
    'star',
    'pentagon',
    'hexagon',
    'arrow-u',
    'arrow-d',
    'arrow-l',
    'arrow-r',
    'trapezoid',
    'cylinder',
    'heart',
    'tree',
    'house',
  ]),
  radius: z.number().optional(),
  fill: ColorSchema.optional(),
  stroke: ColorSchema.optional(),
  strokeW: z.number().positive().optional(),
  dash: z.array(z.number()).optional(),
  sides: z.number().int().min(3).optional(),
})

export const LineNodeSchema = BaseNodeSchema.extend({
  t: z.literal('line'),
  pts: z.array(z.number()).min(4),
  arrows: z
    .tuple([
      z.enum([
        'none',
        'arrow',
        'circle',
        'diamond',
        'standard',
        'filled',
        'triangle',
        'open',
        'square',
      ]),
      z.enum([
        'none',
        'arrow',
        'circle',
        'diamond',
        'standard',
        'filled',
        'triangle',
        'open',
        'square',
      ]),
    ])
    .optional(),
  stroke: ColorSchema,
  strokeW: z.number().positive(),
  dash: z.array(z.number()).optional(),
  routing: z.enum(['straight', 'orthogonal', 'bezier']).optional(),
  startConn: z
    .object({
      nodeId: NodeIdSchema,
      anchor: z.enum(['auto', 't', 'b', 'l', 'r', 'tl', 'tr', 'bl', 'br']),
    })
    .optional(),
  endConn: z
    .object({
      nodeId: NodeIdSchema,
      anchor: z.enum(['auto', 't', 'b', 'l', 'r', 'tl', 'tr', 'bl', 'br']),
    })
    .optional(),
})

export const ImageNodeSchema = BaseNodeSchema.extend({
  t: z.literal('image'),
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
  src: z.string().min(1).optional(),
  assetId: z.string().optional(),
})

export const GroupNodeSchema = BaseNodeSchema.extend({
  t: z.literal('group'),
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
  children: z.array(NodeIdSchema),
})

const CellSchema = z.object({
  r: z.number().int().min(0),
  c: z.number().int().min(0),
  rs: z.number().int().min(1).optional(),
  cs: z.number().int().min(1).optional(),
  v: z.string(),
  bg: z.string().optional(),
  border: z.string().optional(),
  borderColor: z.string().optional(),
  borderW: z.number().optional(),
  font: z.string().optional(),
  fontSize: z.number().optional(),
  align: z.enum(['l', 'c', 'r']).optional(),
  vAlign: z.enum(['t', 'm', 'b']).optional(),
  color: z.string().optional(),
})

const TableDataSchema = z.object({
  rows: z.array(z.number().positive()),
  cols: z.array(z.number().positive()),
  cells: z.array(CellSchema),
})

export const TableNodeSchema = BaseNodeSchema.extend({
  t: z.literal('table'),
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
  table: TableDataSchema,
})

export const SignatureNodeSchema = BaseNodeSchema.extend({
  t: z.literal('signature'),
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
  strokes: z.array(z.array(z.number())),
  stroke: ColorSchema,
  strokeW: z.number().positive(),
  pressureData: z.array(z.array(z.number())).optional(),
  usePressureSim: z.boolean().optional(),
})

export const WidgetNodeSchema = BaseNodeSchema.extend({
  t: z.literal('widget'),
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
  widget: z.string(),
})

export const UnifiedNodeSchema = z.discriminatedUnion('t', [
  TextNodeSchema,
  ShapeNodeSchema,
  LineNodeSchema,
  ImageNodeSchema,
  GroupNodeSchema,
  TableNodeSchema,
  SignatureNodeSchema,
  WidgetNodeSchema,
])

export type UnifiedNodeSchemaType = z.infer<typeof UnifiedNodeSchema>

const MarginSchema = z.object({
  t: z.number(),
  r: z.number(),
  b: z.number(),
  l: z.number(),
})

export const SurfaceSchema = z.object({
  id: SurfaceIdSchema,
  type: z.enum(['page', 'canvas', 'slide']),
  w: z.number().positive(),
  h: z.number().positive(),
  margin: MarginSchema.optional(),
  bg: z.string().optional(),
  masterId: z.string().optional(),
})

export const DocSchema = z.object({
  v: z.literal(1),
  id: z.string().min(1),
  title: z.string(),
  unit: z.literal('mm'),
  surfaces: z.array(SurfaceSchema).min(1),
  nodes: z.array(UnifiedNodeSchema),
  assets: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(['image', 'font', 'video']),
        uri: z.string(),
        mime: z.string().optional(),
        size: z.number().optional(),
        metadata: z.record(z.unknown()).optional(),
      })
    )
    .optional(),
  binding: z
    .object({
      sampleData: z.record(z.unknown()),
      sources: z
        .array(
          z.object({
            id: z.string(),
            type: z.enum(['json', 'api']),
            url: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional(),
  animation: z.any().optional(),
  snap: z
    .object({
      grid: z.number().optional(),
      guides: z.boolean().optional(),
    })
    .optional(),
})

export function validateDoc(
  doc: unknown
): { success: true; data: Doc } | { success: false; errors: string[] } {
  const result = DocSchema.safeParse(doc)
  if (result.success) {
    return { success: true, data: result.data as Doc }
  }
  return {
    success: false,
    errors: result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`),
  }
}

export function validateNode(
  node: unknown
): { success: true; data: UnifiedNode } | { success: false; errors: string[] } {
  const result = UnifiedNodeSchema.safeParse(node)
  if (result.success) {
    return { success: true, data: result.data as UnifiedNode }
  }
  return {
    success: false,
    errors: result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`),
  }
}

export function validateTableCells(table: TableData): string[] {
  const errors: string[] = []
  const occupied = new Set<string>()

  for (const cell of table.cells) {
    const rs = cell.rs ?? 1
    const cs = cell.cs ?? 1

    if (cell.r + rs > table.rows.length) {
      errors.push(`Cell at (${cell.r},${cell.c}): rs=${rs} exceeds row count ${table.rows.length}`)
    }
    if (cell.c + cs > table.cols.length) {
      errors.push(`Cell at (${cell.r},${cell.c}): cs=${cs} exceeds col count ${table.cols.length}`)
    }

    for (let r = cell.r; r < cell.r + rs; r++) {
      for (let c = cell.c; c < cell.c + cs; c++) {
        const key = `${r},${c}`
        if (occupied.has(key)) {
          errors.push(`Cell collision at (${r},${c})`)
        }
        occupied.add(key)
      }
    }
  }

  return errors
}
