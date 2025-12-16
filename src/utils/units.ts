export type LengthUnit = 'mm' | 'pt' | 'px' | 'in'

export interface UnitOptions {
  dpi?: number
}

const MM_PER_INCH = 25.4
const PT_PER_INCH = 72

export function mmToPx(mm: number, options: UnitOptions = {}): number {
  const dpi = options.dpi ?? 96
  return (mm * dpi) / MM_PER_INCH
}

export function pxToMm(px: number, options: UnitOptions = {}): number {
  const dpi = options.dpi ?? 96
  return (px * MM_PER_INCH) / dpi
}

export function mmToPt(mm: number): number {
  return (mm * PT_PER_INCH) / MM_PER_INCH
}

export function ptToMm(pt: number): number {
  return (pt * MM_PER_INCH) / PT_PER_INCH
}

export function inToMm(inches: number): number {
  return inches * MM_PER_INCH
}

export function mmToIn(mm: number): number {
  return mm / MM_PER_INCH
}

export function toMm(value: number, unit: LengthUnit, options: UnitOptions = {}): number {
  switch (unit) {
    case 'mm':
      return value
    case 'pt':
      return ptToMm(value)
    case 'px':
      return pxToMm(value, options)
    case 'in':
      return inToMm(value)
    default: {
      const _exhaustive: never = unit
      return _exhaustive
    }
  }
}

export function fromMm(mm: number, unit: LengthUnit, options: UnitOptions = {}): number {
  switch (unit) {
    case 'mm':
      return mm
    case 'pt':
      return mmToPt(mm)
    case 'px':
      return mmToPx(mm, options)
    case 'in':
      return mmToIn(mm)
    default: {
      const _exhaustive: never = unit
      return _exhaustive
    }
  }
}

export function roundTo(value: number, digits: number): number {
  const p = Math.pow(10, digits)
  return Math.round(value * p) / p
}
