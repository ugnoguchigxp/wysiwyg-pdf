import type { Doc, Margin, Surface, UnifiedNode } from '@/types/canvas'
import type { LengthUnit, UnitOptions } from '@/utils/units'
import { fromMm, roundTo, toMm } from '@/utils/units'

export interface DocUnitConversionOptions extends UnitOptions {
  assumeUnitIfMissing?: LengthUnit
  roundDigitsForSave?: number
}

export type DocWithAnyUnit = Omit<Doc, 'unit'> & { unit: LengthUnit }

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function convertMarginLikeToMm(m: unknown, unit: LengthUnit, options: UnitOptions): Margin | undefined {
  if (!isRecord(m)) return undefined

  const t = typeof m.t === 'number' ? m.t : typeof m.top === 'number' ? m.top : undefined
  const r = typeof m.r === 'number' ? m.r : typeof m.right === 'number' ? m.right : undefined
  const b = typeof m.b === 'number' ? m.b : typeof m.bottom === 'number' ? m.bottom : undefined
  const l = typeof m.l === 'number' ? m.l : typeof m.left === 'number' ? m.left : undefined

  if (t === undefined || r === undefined || b === undefined || l === undefined) return undefined

  return {
    t: toMm(t, unit, options),
    r: toMm(r, unit, options),
    b: toMm(b, unit, options),
    l: toMm(l, unit, options),
  }
}

function convertSurfaceToMm(surface: Surface, unit: LengthUnit, options: UnitOptions): Surface {
  return {
    ...surface,
    w: toMm(surface.w, unit, options),
    h: toMm(surface.h, unit, options),
    margin: convertMarginLikeToMm(surface.margin, unit, options) ?? surface.margin,
  }
}

function convertNodeToMm(node: UnifiedNode, unit: LengthUnit, options: UnitOptions): UnifiedNode {
  if (node.t === 'line') {
    return {
      ...node,
      pts: node.pts.map((v) => toMm(v, unit, options)),
      strokeW: toMm(node.strokeW, unit, options),
    }
  }

  if (node.t === 'signature') {
    return {
      ...node,
      x: toMm(node.x, unit, options),
      y: toMm(node.y, unit, options),
      w: toMm(node.w, unit, options),
      h: toMm(node.h, unit, options),
      strokeW: toMm(node.strokeW, unit, options),
      strokes: node.strokes.map((stroke) => stroke.map((v) => toMm(v, unit, options))),
    }
  }

  if (node.t === 'table') {
    return {
      ...node,
      x: toMm(node.x, unit, options),
      y: toMm(node.y, unit, options),
      w: toMm(node.w, unit, options),
      h: toMm(node.h, unit, options),
      table: {
        ...node.table,
        rows: node.table.rows.map((v) => toMm(v, unit, options)),
        cols: node.table.cols.map((v) => toMm(v, unit, options)),
        cells: node.table.cells.map((c) => ({
          ...c,
          borderW: typeof c.borderW === 'number' ? toMm(c.borderW, unit, options) : c.borderW,
          fontSize: typeof c.fontSize === 'number' ? toMm(c.fontSize, unit, options) : c.fontSize,
        })),
      },
    }
  }

  if (node.t === 'text') {
    return {
      ...node,
      x: toMm(node.x, unit, options),
      y: toMm(node.y, unit, options),
      w: toMm(node.w, unit, options),
      h: toMm(node.h, unit, options),
      strokeW: typeof node.strokeW === 'number' ? toMm(node.strokeW, unit, options) : node.strokeW,
      fontSize: typeof node.fontSize === 'number' ? toMm(node.fontSize, unit, options) : node.fontSize,
    }
  }

  if (node.t === 'shape') {
    return {
      ...node,
      x: toMm(node.x, unit, options),
      y: toMm(node.y, unit, options),
      w: toMm(node.w, unit, options),
      h: toMm(node.h, unit, options),
      strokeW: typeof node.strokeW === 'number' ? toMm(node.strokeW, unit, options) : node.strokeW,
      radius: typeof node.radius === 'number' ? toMm(node.radius, unit, options) : node.radius,
    }
  }

  if (node.t === 'image' || node.t === 'group' || node.t === 'widget') {
    return {
      ...node,
      x: toMm(node.x, unit, options),
      y: toMm(node.y, unit, options),
      w: toMm(node.w, unit, options),
      h: toMm(node.h, unit, options),
    }
  }

  return node
}

function roundDoc(doc: Doc, digits: number): Doc {
  const roundN = (v: number) => roundTo(v, digits)

  const surfaces = doc.surfaces.map((s) => ({
    ...s,
    w: roundN(s.w),
    h: roundN(s.h),
    margin: s.margin
      ? {
          t: roundN(s.margin.t),
          r: roundN(s.margin.r),
          b: roundN(s.margin.b),
          l: roundN(s.margin.l),
        }
      : s.margin,
  }))

  const nodes = doc.nodes.map((n) => {
    if (n.t === 'line') {
      return { ...n, pts: n.pts.map(roundN), strokeW: roundN(n.strokeW) }
    }

    if (n.t === 'signature') {
      return {
        ...n,
        x: roundN(n.x),
        y: roundN(n.y),
        w: roundN(n.w),
        h: roundN(n.h),
        strokeW: roundN(n.strokeW),
        strokes: n.strokes.map((s) => s.map(roundN)),
      }
    }

    if (n.t === 'table') {
      return {
        ...n,
        x: roundN(n.x),
        y: roundN(n.y),
        w: roundN(n.w),
        h: roundN(n.h),
        table: {
          ...n.table,
          rows: n.table.rows.map(roundN),
          cols: n.table.cols.map(roundN),
          cells: n.table.cells.map((c) => ({
            ...c,
            borderW: typeof c.borderW === 'number' ? roundN(c.borderW) : c.borderW,
            fontSize: typeof c.fontSize === 'number' ? roundN(c.fontSize) : c.fontSize,
          })),
        },
      }
    }

    if (n.t === 'text') {
      return {
        ...n,
        x: roundN(n.x),
        y: roundN(n.y),
        w: roundN(n.w),
        h: roundN(n.h),
        strokeW: typeof n.strokeW === 'number' ? roundN(n.strokeW) : n.strokeW,
        fontSize: typeof n.fontSize === 'number' ? roundN(n.fontSize) : n.fontSize,
      }
    }

    if (n.t === 'shape') {
      return {
        ...n,
        x: roundN(n.x),
        y: roundN(n.y),
        w: roundN(n.w),
        h: roundN(n.h),
        strokeW: typeof n.strokeW === 'number' ? roundN(n.strokeW) : n.strokeW,
        radius: typeof n.radius === 'number' ? roundN(n.radius) : n.radius,
      }
    }

    if (n.t === 'image' || n.t === 'group' || n.t === 'widget') {
      return {
        ...n,
        x: roundN(n.x),
        y: roundN(n.y),
        w: roundN(n.w),
        h: roundN(n.h),
      }
    }

    return n
  })

  return { ...doc, surfaces, nodes }
}

export function convertDocToMm(input: unknown, options: DocUnitConversionOptions = {}): Doc {
  if (!isRecord(input)) {
    throw new Error('convertDocToMm: input must be an object')
  }

  const assume = options.assumeUnitIfMissing ?? 'mm'
  const unit = (typeof input.unit === 'string' ? input.unit : assume) as LengthUnit

  const doc = input as unknown as Doc
  if (!Array.isArray(doc.surfaces) || !Array.isArray(doc.nodes)) {
    throw new Error('convertDocToMm: invalid doc shape')
  }

  const normalized: Doc = {
    ...doc,
    unit: 'mm',
    surfaces: doc.surfaces.map((s) => convertSurfaceToMm(s, unit, options)),
    nodes: doc.nodes.map((n) => convertNodeToMm(n, unit, options)),
  }

  const digits = options.roundDigitsForSave ?? 3
  return roundDoc(normalized, digits)
}

function denormalizeMargin(m: Margin | undefined, unit: LengthUnit, options: UnitOptions): Margin | undefined {
  if (!m) return m
  return {
    t: fromMm(m.t, unit, options),
    r: fromMm(m.r, unit, options),
    b: fromMm(m.b, unit, options),
    l: fromMm(m.l, unit, options),
  }
}

function denormalizeSurface(surface: Surface, unit: LengthUnit, options: UnitOptions): Surface {
  return {
    ...surface,
    w: fromMm(surface.w, unit, options),
    h: fromMm(surface.h, unit, options),
    margin: denormalizeMargin(surface.margin, unit, options),
  }
}

function denormalizeNode(node: UnifiedNode, unit: LengthUnit, options: UnitOptions): UnifiedNode {
  if (node.t === 'line') {
    return {
      ...node,
      pts: node.pts.map((v) => fromMm(v, unit, options)),
      strokeW: fromMm(node.strokeW, unit, options),
    }
  }

  if (node.t === 'signature') {
    return {
      ...node,
      x: fromMm(node.x, unit, options),
      y: fromMm(node.y, unit, options),
      w: fromMm(node.w, unit, options),
      h: fromMm(node.h, unit, options),
      strokeW: fromMm(node.strokeW, unit, options),
      strokes: node.strokes.map((stroke) => stroke.map((v) => fromMm(v, unit, options))),
    }
  }

  if (node.t === 'table') {
    return {
      ...node,
      x: fromMm(node.x, unit, options),
      y: fromMm(node.y, unit, options),
      w: fromMm(node.w, unit, options),
      h: fromMm(node.h, unit, options),
      table: {
        ...node.table,
        rows: node.table.rows.map((v) => fromMm(v, unit, options)),
        cols: node.table.cols.map((v) => fromMm(v, unit, options)),
        cells: node.table.cells.map((c) => ({
          ...c,
          borderW: typeof c.borderW === 'number' ? fromMm(c.borderW, unit, options) : c.borderW,
          fontSize: typeof c.fontSize === 'number' ? fromMm(c.fontSize, unit, options) : c.fontSize,
        })),
      },
    }
  }

  if (node.t === 'text') {
    return {
      ...node,
      x: fromMm(node.x, unit, options),
      y: fromMm(node.y, unit, options),
      w: fromMm(node.w, unit, options),
      h: fromMm(node.h, unit, options),
      strokeW: typeof node.strokeW === 'number' ? fromMm(node.strokeW, unit, options) : node.strokeW,
      fontSize: typeof node.fontSize === 'number' ? fromMm(node.fontSize, unit, options) : node.fontSize,
    }
  }

  if (node.t === 'shape') {
    return {
      ...node,
      x: fromMm(node.x, unit, options),
      y: fromMm(node.y, unit, options),
      w: fromMm(node.w, unit, options),
      h: fromMm(node.h, unit, options),
      strokeW: typeof node.strokeW === 'number' ? fromMm(node.strokeW, unit, options) : node.strokeW,
      radius: typeof node.radius === 'number' ? fromMm(node.radius, unit, options) : node.radius,
    }
  }

  if (node.t === 'image' || node.t === 'group' || node.t === 'widget') {
    return {
      ...node,
      x: fromMm(node.x, unit, options),
      y: fromMm(node.y, unit, options),
      w: fromMm(node.w, unit, options),
      h: fromMm(node.h, unit, options),
    }
  }

  return node
}

function roundDocAnyUnit(doc: DocWithAnyUnit, digits: number): DocWithAnyUnit {
  const roundN = (v: number) => roundTo(v, digits)

  const surfaces = doc.surfaces.map((s) => ({
    ...s,
    w: roundN(s.w),
    h: roundN(s.h),
    margin: s.margin
      ? {
          t: roundN(s.margin.t),
          r: roundN(s.margin.r),
          b: roundN(s.margin.b),
          l: roundN(s.margin.l),
        }
      : s.margin,
  }))

  const nodes = doc.nodes.map((n) => {
    if (n.t === 'line') return { ...n, pts: n.pts.map(roundN), strokeW: roundN(n.strokeW) }
    if (n.t === 'signature') {
      return {
        ...n,
        x: roundN(n.x),
        y: roundN(n.y),
        w: roundN(n.w),
        h: roundN(n.h),
        strokeW: roundN(n.strokeW),
        strokes: n.strokes.map((s) => s.map(roundN)),
      }
    }
    if (n.t === 'table') {
      return {
        ...n,
        x: roundN(n.x),
        y: roundN(n.y),
        w: roundN(n.w),
        h: roundN(n.h),
        table: {
          ...n.table,
          rows: n.table.rows.map(roundN),
          cols: n.table.cols.map(roundN),
          cells: n.table.cells.map((c) => ({
            ...c,
            borderW: typeof c.borderW === 'number' ? roundN(c.borderW) : c.borderW,
            fontSize: typeof c.fontSize === 'number' ? roundN(c.fontSize) : c.fontSize,
          })),
        },
      }
    }
    if (n.t === 'text') {
      return {
        ...n,
        x: roundN(n.x),
        y: roundN(n.y),
        w: roundN(n.w),
        h: roundN(n.h),
        strokeW: typeof n.strokeW === 'number' ? roundN(n.strokeW) : n.strokeW,
        fontSize: typeof n.fontSize === 'number' ? roundN(n.fontSize) : n.fontSize,
      }
    }
    if (n.t === 'shape') {
      return {
        ...n,
        x: roundN(n.x),
        y: roundN(n.y),
        w: roundN(n.w),
        h: roundN(n.h),
        strokeW: typeof n.strokeW === 'number' ? roundN(n.strokeW) : n.strokeW,
        radius: typeof n.radius === 'number' ? roundN(n.radius) : n.radius,
      }
    }
    if (n.t === 'image' || n.t === 'group' || n.t === 'widget') {
      return {
        ...n,
        x: roundN(n.x),
        y: roundN(n.y),
        w: roundN(n.w),
        h: roundN(n.h),
      }
    }
    return n
  })

  return { ...doc, surfaces, nodes }
}

export function convertDocFromMm(
  doc: Doc,
  targetUnit: LengthUnit,
  options: DocUnitConversionOptions = {}
): DocWithAnyUnit {
  const converted: DocWithAnyUnit = {
    ...(doc as Omit<Doc, 'unit'>),
    unit: targetUnit,
    surfaces: doc.surfaces.map((s) => denormalizeSurface(s, targetUnit, options)),
    nodes: doc.nodes.map((n) => denormalizeNode(n, targetUnit, options)),
  }

  const digits = options.roundDigitsForSave ?? 3
  return roundDocAnyUnit(converted, digits)
}
