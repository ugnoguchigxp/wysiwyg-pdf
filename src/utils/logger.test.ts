import { describe, expect, it } from 'vitest'

import { createContextLogger } from '@/utils/logger'

describe('utils/logger', () => {
  it('createContextLogger returns a logger with standard methods', () => {
    const log = createContextLogger('ctx')

    expect(typeof log.debug).toBe('function')
    expect(typeof log.info).toBe('function')
    expect(typeof log.warn).toBe('function')
    expect(typeof log.error).toBe('function')
  })

  it('logger methods are no-ops (do not throw)', () => {
    const log = createContextLogger('ctx')

    expect(() => log.debug('d', { a: 1 })).not.toThrow()
    expect(() => log.info('i', { a: 1 })).not.toThrow()
    expect(() => log.warn('w', { a: 1 })).not.toThrow()
    expect(() => log.error('e', { a: 1 })).not.toThrow()
  })
})

