import { mmToPt } from '@/utils/units'

export const mmToPtValue = (mm: number | undefined) => mmToPt(mm ?? 0)
export const mmPt = (mm: number | undefined) => `${mm ?? 0}mm`
