/**
 * Safe browser API wrappers for environments where browser APIs might not be available (e.g., SSR, Node.js tests).
 */

export function generateUUID(): string {
  // Use crypto.randomUUID if available
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  // Fallback for environments without crypto.randomUUID (e.g., some Node versions or older browsers)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
    try {
      localStorage.setItem(key, value)
    } catch {
      // Handle quota errors or restricted access
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
    try {
      localStorage.removeItem(key)
    } catch {
      // Ignore errors
    }
  },
}
