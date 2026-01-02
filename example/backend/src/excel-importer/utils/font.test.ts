import {
  DEFAULT_FONT_MAPPING,
  fontSizeMmToPt,
  fontSizePtToMm,
  isJapaneseFont,
  mapFont,
  normalizeFontWeight,
} from './font'

describe('mapFont', () => {
  test('maps MS Gothic to Noto Sans JP', () => {
    expect(mapFont('MS Gothic')).toBe('Noto Sans JP')
  })

  test('maps MS PGothic to Noto Sans JP', () => {
    expect(mapFont('MS PGothic')).toBe('Noto Sans JP')
  })

  test('maps MS Mincho to Noto Serif JP', () => {
    expect(mapFont('MS Mincho')).toBe('Noto Serif JP')
  })

  test('maps Meiryo to Noto Sans JP', () => {
    expect(mapFont('Meiryo')).toBe('Noto Sans JP')
  })

  test('maps Yu Gothic to Noto Sans JP', () => {
    expect(mapFont('Yu Gothic')).toBe('Noto Sans JP')
  })

  test('maps Hiragino Sans to Noto Sans JP', () => {
    expect(mapFont('Hiragino Sans')).toBe('Noto Sans JP')
  })

  test('maps Calibri to Noto Sans', () => {
    expect(mapFont('Calibri')).toBe('Noto Sans')
  })

  test('maps Arial to Noto Sans', () => {
    expect(mapFont('Arial')).toBe('Noto Sans')
  })

  test('maps Times New Roman to Noto Serif', () => {
    expect(mapFont('Times New Roman')).toBe('Noto Serif')
  })

  test('maps Courier New to Noto Sans Mono', () => {
    expect(mapFont('Courier New')).toBe('Noto Sans Mono')
  })

  test('uses custom mapping', () => {
    const customMapping = { 'Custom Font': 'Mapped Font' }
    expect(mapFont('Custom Font', customMapping)).toBe('Mapped Font')
  })

  test('custom mapping takes precedence over default', () => {
    const customMapping = { Arial: 'Custom Font' }
    expect(mapFont('Arial', customMapping)).toBe('Custom Font')
  })

  test('uses default font for unknown fonts', () => {
    expect(mapFont('Unknown Font')).toBe('Noto Sans JP')
  })

  test('uses custom default font', () => {
    expect(mapFont('Unknown Font', undefined, 'Custom Default')).toBe('Custom Default')
  })
})

describe('isJapaneseFont', () => {
  test('identifies MS Gothic as Japanese', () => {
    expect(isJapaneseFont('MS Gothic')).toBe(true)
  })

  test('identifies MS Mincho as Japanese', () => {
    expect(isJapaneseFont('MS Mincho')).toBe(true)
  })

  test('identifies Meiryo as Japanese', () => {
    expect(isJapaneseFont('Meiryo')).toBe(true)
  })

  test('identifies Hiragino Sans as Japanese', () => {
    expect(isJapaneseFont('Hiragino Sans')).toBe(true)
  })

  test('identifies Yu Gothic as Japanese', () => {
    expect(isJapaneseFont('Yu Gothic')).toBe(true)
  })

  test('identifies Noto Sans JP as Japanese', () => {
    expect(isJapaneseFont('Noto Sans JP')).toBe(true)
  })

  test('identifies Noto Serif JP as Japanese', () => {
    expect(isJapaneseFont('Noto Serif JP')).toBe(true)
  })

  test('does not identify Arial as Japanese', () => {
    expect(isJapaneseFont('Arial')).toBe(false)
  })

  test('does not identify Calibri as Japanese', () => {
    expect(isJapaneseFont('Calibri')).toBe(false)
  })

  test('does not identify Times New Roman as Japanese', () => {
    expect(isJapaneseFont('Times New Roman')).toBe(false)
  })
})

describe('normalizeFontWeight', () => {
  test('returns 700 for bold fonts', () => {
    expect(normalizeFontWeight(true)).toBe(700)
  })

  test('returns 400 for non-bold fonts', () => {
    expect(normalizeFontWeight(false)).toBe(400)
  })

  test('returns 400 when bold is undefined', () => {
    expect(normalizeFontWeight()).toBe(400)
  })

  test('uses provided weight value', () => {
    expect(normalizeFontWeight(false, 500)).toBe(500)
    expect(normalizeFontWeight(true, 600)).toBe(600)
  })

  test('weight takes precedence over bold flag', () => {
    expect(normalizeFontWeight(true, 300)).toBe(300)
  })
})

describe('fontSizePtToMm', () => {
  test('converts font size from points to millimeters', () => {
    expect(fontSizePtToMm(12)).toBeCloseTo(4.2333, 4)
    expect(fontSizePtToMm(10)).toBeCloseTo(3.5278, 4)
    expect(fontSizePtToMm(14)).toBeCloseTo(4.9389, 4)
  })

  test('handles zero', () => {
    expect(fontSizePtToMm(0)).toBe(0)
  })
})

describe('fontSizeMmToPt', () => {
  test('converts font size from millimeters to points', () => {
    expect(fontSizeMmToPt(4.2333)).toBeCloseTo(12, 2)
    expect(fontSizeMmToPt(3.5278)).toBeCloseTo(10, 2)
    expect(fontSizeMmToPt(4.9389)).toBeCloseTo(14, 2)
  })

  test('is inverse of fontSizePtToMm', () => {
    const original = 11
    expect(fontSizeMmToPt(fontSizePtToMm(original))).toBeCloseTo(original, 6)
  })
})

describe('DEFAULT_FONT_MAPPING', () => {
  test('contains all standard mappings', () => {
    expect(DEFAULT_FONT_MAPPING).toHaveProperty('MS Gothic')
    expect(DEFAULT_FONT_MAPPING).toHaveProperty('MS PGothic')
    expect(DEFAULT_FONT_MAPPING).toHaveProperty('MS Mincho')
    expect(DEFAULT_FONT_MAPPING).toHaveProperty('Meiryo')
    expect(DEFAULT_FONT_MAPPING).toHaveProperty('Yu Gothic')
    expect(DEFAULT_FONT_MAPPING).toHaveProperty('Hiragino Sans')
    expect(DEFAULT_FONT_MAPPING).toHaveProperty('Calibri')
    expect(DEFAULT_FONT_MAPPING).toHaveProperty('Arial')
    expect(DEFAULT_FONT_MAPPING).toHaveProperty('Times New Roman')
    expect(DEFAULT_FONT_MAPPING).toHaveProperty('Courier New')
  })

  test('has correct mapping values', () => {
    expect(DEFAULT_FONT_MAPPING['MS Gothic']).toBe('Noto Sans JP')
    expect(DEFAULT_FONT_MAPPING['Arial']).toBe('Noto Sans')
    expect(DEFAULT_FONT_MAPPING['Times New Roman']).toBe('Noto Serif')
  })
})
