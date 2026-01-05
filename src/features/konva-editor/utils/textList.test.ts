import { describe, expect, it } from 'vitest'
import {
  applyListFormatting,
  buildListLine,
  getListTypeFromText,
  getNextListNumber,
  normalizeListText,
  parseListLine,
  removeListFormatting,
} from '@/features/konva-editor/utils/textList'

describe('features/konva-editor/utils/textList', () => {
  it('builds and parses list lines with consistent levels', () => {
    const line = buildListLine('Item', 'bullet', 3)
    const parsed = parseListLine(line)

    expect(parsed.isList).toBe(true)
    expect(parsed.type).toBe('bullet')
    expect(parsed.level).toBe(3)
    expect(parsed.content).toBe('Item')
  })

  it('clamps list level to 1..5 and keeps vertical at level 1', () => {
    const line = buildListLine('Item', 'number', 10)
    const parsed = parseListLine(line)

    expect(parsed.level).toBe(5)

    const verticalParsed = parseListLine(line, { vertical: true })
    expect(verticalParsed.level).toBe(1)
  })

  it('applies list formatting to empty text by creating a marker line', () => {
    const text = applyListFormatting('', 'bullet')
    expect(text.trimStart().startsWith('・')).toBe(true)
  })

  it('removes list formatting while keeping content', () => {
    const text = ' ・ item\n  1. thing'
    const cleaned = removeListFormatting(text)
    expect(cleaned).toBe('item\nthing')
  })

  it('detects list type only when all list lines match', () => {
    const text = ' ・ a\n ・ b'
    expect(getListTypeFromText(text)).toBe('bullet')

    const mixed = ' ・ a\n 1. b'
    expect(getListTypeFromText(mixed)).toBe(null)
  })

  it('renumbers lists per level and resets after non-list lines', () => {
    const text = [
      ' 1. One',
      ' 2. Two',
      'plain',
      ' 1. Restart',
    ].join('\n')

    const normalized = normalizeListText(text)
    expect(normalized).toBe(text)
  })

  it('calculates next list number per level', () => {
    const text = [
      ' 1. One',
      ' 2. Two',
      '   1. Nested One',
      ' 3. Three',
    ].join('\n')

    const next = getNextListNumber(text, 3, 1)
    expect(next).toBe(4)
  })
})
