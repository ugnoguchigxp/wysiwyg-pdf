export type ListType = 'bullet' | 'number'

const BULLET_MARKER = '・'
const LIST_INDENT_STEP = 2
const LIST_MARKER_INDENT = 1
const LIST_MARKER_GAP = 1
const MAX_LIST_LEVEL = 5

type ParseOptions = {
  vertical?: boolean
}

export type ParsedListLine = {
  isList: boolean
  type?: ListType
  level: number
  content: string
  prefixLength: number
  indentLength: number
  gapLength: number
  markerText?: string
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const getIndentLength = (indent: string) => indent.replace(/\t/g, '  ').length

export const parseListLine = (line: string, options: ParseOptions = {}): ParsedListLine => {
  const match = line.match(/^(\s*)(・|(\d+)\.)(\s*)(.*)$/)
  if (!match) {
    return { isList: false, level: 1, content: line, prefixLength: 0, indentLength: 0, gapLength: 0 }
  }

  const indentRaw = match[1] ?? ''
  const marker = match[2] ?? ''
  const spaceAfter = match[4] ?? ''
  const content = match[5] ?? ''
  const type: ListType = marker === BULLET_MARKER ? 'bullet' : 'number'
  const indentLength = getIndentLength(indentRaw)
  const gapLength = getIndentLength(spaceAfter)
  const level = options.vertical
    ? 1
    : clamp(Math.floor(Math.max(indentLength - LIST_MARKER_INDENT, 0) / LIST_INDENT_STEP) + 1, 1, MAX_LIST_LEVEL)

  return {
    isList: true,
    type,
    level,
    content,
    prefixLength: indentRaw.length + marker.length + spaceAfter.length,
    indentLength,
    gapLength,
    markerText: marker,
  }
}

export const buildListLine = (
  content: string,
  type: ListType,
  level: number,
  options: ParseOptions & { number?: number } = {}
) => {
  const safeLevel = options.vertical ? 1 : clamp(level, 1, MAX_LIST_LEVEL)
  const indent = options.vertical ? '' : ' '.repeat(LIST_MARKER_INDENT + LIST_INDENT_STEP * (safeLevel - 1))
  const marker = type === 'bullet' ? BULLET_MARKER : `${options.number ?? 1}.`
  const gap = ' '.repeat(LIST_MARKER_GAP)
  return `${indent}${marker}${gap}${content}`
}

export const normalizeListText = (text: string, options: ParseOptions = {}) => {
  const lines = text.split('\n')
  const counters = Array(MAX_LIST_LEVEL).fill(0)

  const normalized = lines.map((line) => {
    const parsed = parseListLine(line, options)
    if (!parsed.isList || !parsed.type) {
      counters.fill(0)
      return line
    }

    const level = options.vertical ? 1 : parsed.level

    if (parsed.type === 'number') {
      counters[level - 1] += 1
      for (let i = level; i < MAX_LIST_LEVEL; i += 1) counters[i] = 0
      return buildListLine(parsed.content, 'number', level, { ...options, number: counters[level - 1] })
    }

    counters.fill(0)
    return buildListLine(parsed.content, 'bullet', level, options)
  })

  return normalized.join('\n')
}

export const getListTypeFromText = (text: string, options: ParseOptions = {}): ListType | null => {
  const lines = text.split('\n')
  let found: ListType | null = null

  for (const line of lines) {
    const parsed = parseListLine(line, options)
    if (!parsed.isList || !parsed.type) continue
    if (!found) {
      found = parsed.type
      continue
    }
    if (found !== parsed.type) return null
  }

  return found
}

export const applyListFormatting = (text: string, type: ListType, options: ParseOptions = {}) => {
  const lines = text.split('\n')
  if (lines.every((line) => line.trim() === '')) {
    return buildListLine('', type, 1, options)
  }
  const withMarkers = lines.map((line) => {
    if (line.trim() === '') return line
    const parsed = parseListLine(line, options)
    const level = options.vertical ? 1 : parsed.isList ? parsed.level : 1
    const content = parsed.isList ? parsed.content : line
    return buildListLine(content, type, level, options)
  })

  return normalizeListText(withMarkers.join('\n'), options)
}

export const removeListFormatting = (text: string, options: ParseOptions = {}) => {
  const lines = text.split('\n')
  const cleaned = lines.map((line) => {
    const parsed = parseListLine(line, options)
    if (!parsed.isList) return line
    return parsed.content
  })

  return cleaned.join('\n')
}

export const getNextListNumber = (
  text: string,
  lineIndex: number,
  level: number,
  options: ParseOptions = {}
) => {
  const lines = text.split('\n')
  const counters = Array(MAX_LIST_LEVEL).fill(0)
  const maxIndex = Math.min(lineIndex, lines.length - 1)

  for (let i = 0; i <= maxIndex; i += 1) {
    const parsed = parseListLine(lines[i], options)
    if (!parsed.isList || parsed.type !== 'number') {
      counters.fill(0)
      continue
    }
    const lineLevel = options.vertical ? 1 : parsed.level
    counters[lineLevel - 1] += 1
    for (let j = lineLevel; j < MAX_LIST_LEVEL; j += 1) counters[j] = 0
  }

  const safeLevel = options.vertical ? 1 : clamp(level, 1, MAX_LIST_LEVEL)
  return counters[safeLevel - 1] + 1
}
