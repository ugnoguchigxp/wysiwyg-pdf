/**
 * Tries to increment a name based on a pattern of "Prefix + Number".
 * e.g., "B1" -> "B2", "Bed-10" -> "Bed-11", "No.01" -> "No.02"
 * If the name doesn't end with a number, it appends "1".
 *
 * @param name The base name to increment
 * @param existingNames Collection of names that should be avoided
 * @returns A unique incremented name
 */
export function incrementName(name: string, existingNames: string[] | Set<string>): string {
  const match = name.match(/^(.*?)(\d+)$/)
  let prefix = name
  let nextNum = 1
  let padding = 0

  if (match) {
    prefix = match[1]
    const numStr = match[2]
    padding = numStr.length
    nextNum = parseInt(numStr, 10) + 1
  } else {
    // If no number, append "1"
    // But check if we need a separator?
    // User requested "B1" -> "B2", let's be conservative.
    prefix = name
    nextNum = 1
    padding = 0
  }

  const nameSet = existingNames instanceof Set ? existingNames : new Set(existingNames)

  let candidate = `${prefix}${nextNum.toString().padStart(padding, '0')}`

  while (nameSet.has(candidate)) {
    nextNum++
    candidate = `${prefix}${nextNum.toString().padStart(padding, '0')}`
  }

  return candidate
}
