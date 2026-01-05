import { describe, expect, it } from 'vitest'

import { cn } from '@/utils/utils'

describe('utils/cn', () => {
  it('returns a string', () => {
    expect(typeof cn('a', 'b')).toBe('string')
  })

  it('merges class names', () => {
    expect(cn('a', 'b')).toContain('a')
    expect(cn('a', 'b')).toContain('b')
  })
})
