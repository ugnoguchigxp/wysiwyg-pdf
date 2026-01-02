import {
  DEFAULT_MDW,
  excelColWidthToMm,
  excelRowHeightToMm,
  getDefaultColWidthMm,
  getDefaultRowHeightMm,
  getPaperSizeMm,
  INCH_TO_MM,
  inchToMm,
  mmToExcelColWidth,
  mmToInch,
  mmToPt,
  mmToPx,
  PAPER_SIZES,
  PT_TO_INCH,
  PX_TO_INCH,
  ptToMm,
  pxToMm,
} from './units'

describe('Unit Constants', () => {
  test('INCH_TO_MM is correct', () => {
    expect(INCH_TO_MM).toBe(25.4)
  })

  test('PT_TO_INCH is correct', () => {
    expect(PT_TO_INCH).toBe(1 / 72)
  })

  test('PX_TO_INCH is correct', () => {
    expect(PX_TO_INCH).toBe(1 / 96)
  })

  test('DEFAULT_MDW is correct', () => {
    expect(DEFAULT_MDW).toBe(7)
  })
})

describe('ptToMm', () => {
  test('converts points to millimeters', () => {
    expect(ptToMm(72)).toBeCloseTo(25.4, 2)
    expect(ptToMm(1)).toBeCloseTo(0.3528, 4)
    expect(ptToMm(12)).toBeCloseTo(4.2333, 4)
  })
})

describe('mmToPt', () => {
  test('converts millimeters to points', () => {
    expect(mmToPt(25.4)).toBeCloseTo(72, 2)
    expect(mmToPt(10)).toBeCloseTo(28.3465, 4)
  })

  test('is inverse of ptToMm', () => {
    const original = 100
    expect(mmToPt(ptToMm(original))).toBeCloseTo(original, 6)
  })
})

describe('pxToMm', () => {
  test('converts pixels to millimeters', () => {
    expect(pxToMm(96)).toBeCloseTo(25.4, 2)
    expect(pxToMm(1)).toBeCloseTo(0.2646, 4)
  })
})

describe('mmToPx', () => {
  test('converts millimeters to pixels', () => {
    expect(mmToPx(25.4)).toBeCloseTo(96, 2)
    expect(mmToPx(10)).toBeCloseTo(37.7953, 4)
  })

  test('is inverse of pxToMm', () => {
    const original = 100
    expect(mmToPx(pxToMm(original))).toBeCloseTo(original, 6)
  })
})

describe('inchToMm', () => {
  test('converts inches to millimeters', () => {
    expect(inchToMm(1)).toBe(25.4)
    expect(inchToMm(2)).toBe(50.8)
    expect(inchToMm(0.5)).toBe(12.7)
  })
})

describe('mmToInch', () => {
  test('converts millimeters to inches', () => {
    expect(mmToInch(25.4)).toBe(1)
    expect(mmToInch(50.8)).toBe(2)
  })

  test('is inverse of inchToMm', () => {
    const original = 100
    expect(mmToInch(inchToMm(original))).toBeCloseTo(original, 6)
  })
})

describe('excelRowHeightToMm', () => {
  test('converts Excel row height to millimeters', () => {
    expect(excelRowHeightToMm(15)).toBeCloseTo(5.2917, 4)
    expect(excelRowHeightToMm(20)).toBeCloseTo(7.0556, 4)
  })

  test('is equivalent to ptToMm', () => {
    const height = 30
    expect(excelRowHeightToMm(height)).toBe(ptToMm(height))
  })
})

describe('excelColWidthToMm', () => {
  test('converts Excel column width to millimeters', () => {
    expect(excelColWidthToMm(8.43)).toBeCloseTo(15.6104, 4)
    expect(excelColWidthToMm(10)).toBeCloseTo(18.5208, 4)
  })

  test('uses custom MDW', () => {
    const defaultResult = excelColWidthToMm(10)
    const customResult = excelColWidthToMm(10, 8)
    expect(defaultResult).not.toBe(customResult)
  })
})

describe('mmToExcelColWidth', () => {
  test('converts millimeters to Excel column width (approximate)', () => {
    expect(mmToExcelColWidth(25)).toBeCloseTo(13.4983, 2)
  })

  test('uses custom MDW', () => {
    const defaultResult = mmToExcelColWidth(25)
    const customResult = mmToExcelColWidth(25, 8)
    expect(defaultResult).not.toBe(customResult)
  })
})

describe('getDefaultRowHeightMm', () => {
  test('returns default row height in mm', () => {
    const defaultHeight = getDefaultRowHeightMm()
    expect(defaultHeight).toBeCloseTo(5.2917, 4)
  })

  test('is equivalent to ptToMm(15)', () => {
    expect(getDefaultRowHeightMm()).toBe(ptToMm(15))
  })
})

describe('getDefaultColWidthMm', () => {
  test('returns default column width in mm', () => {
    const defaultWidth = getDefaultColWidthMm()
    expect(defaultWidth).toBeCloseTo(15.6104, 4)
  })

  test('is equivalent to excelColWidthToMm(8.43)', () => {
    expect(getDefaultColWidthMm()).toBe(excelColWidthToMm(8.43))
  })

  test('uses custom MDW', () => {
    const defaultResult = getDefaultColWidthMm()
    const customResult = getDefaultColWidthMm(8)
    expect(defaultResult).not.toBe(customResult)
  })
})

describe('getPaperSizeMm', () => {
  test('returns A4 size in portrait', () => {
    const size = getPaperSizeMm('a4', false)
    expect(size.w).toBe(210)
    expect(size.h).toBe(297)
  })

  test('returns A4 size in landscape', () => {
    const size = getPaperSizeMm('a4', true)
    expect(size.w).toBe(297)
    expect(size.h).toBe(210)
  })

  test('returns Letter size', () => {
    const size = getPaperSizeMm('letter', false)
    expect(size.w).toBeCloseTo(215.9, 1)
    expect(size.h).toBeCloseTo(279.4, 1)
  })

  test('returns A3 size', () => {
    const size = getPaperSizeMm('a3', false)
    expect(size.w).toBe(297)
    expect(size.h).toBe(420)
  })

  test('returns Legal size', () => {
    const size = getPaperSizeMm('legal', false)
    expect(size.w).toBeCloseTo(215.9, 1)
    expect(size.h).toBeCloseTo(355.6, 1)
  })

  test('returns B5 size', () => {
    const size = getPaperSizeMm('b5', false)
    expect(size.w).toBe(176)
    expect(size.h).toBe(250)
  })
})

describe('PAPER_SIZES', () => {
  test('contains all standard paper sizes', () => {
    expect(PAPER_SIZES).toHaveProperty('letter')
    expect(PAPER_SIZES).toHaveProperty('legal')
    expect(PAPER_SIZES).toHaveProperty('a3')
    expect(PAPER_SIZES).toHaveProperty('a4')
    expect(PAPER_SIZES).toHaveProperty('a5')
    expect(PAPER_SIZES).toHaveProperty('b4')
    expect(PAPER_SIZES).toHaveProperty('b5')
  })

  test('A4 dimensions are correct', () => {
    expect(PAPER_SIZES.a4.w).toBe(210)
    expect(PAPER_SIZES.a4.h).toBe(297)
  })

  test('Letter dimensions are correct', () => {
    expect(PAPER_SIZES.letter.w).toBeCloseTo(215.9, 1)
    expect(PAPER_SIZES.letter.h).toBeCloseTo(279.4, 1)
  })
})
